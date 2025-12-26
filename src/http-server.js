#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer } from 'http';
import { randomUUID } from 'node:crypto';
import { abcToPdf, pdfToBase64, AbcToPdfSchema } from './index.js';

const PORT = process.env.PORT || 3000;

// Map to store transports by session ID
const transports = {};

/**
 * Create and configure a new MCP server instance
 */
function createMcpServer() {
  const server = new Server(
    {
      name: 'partitura-mcp-http',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  return server;
}

/**
 * Configure MCP server handlers
 */
function setupServerHandlers(server) {
  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'abc_to_pdf',
          description: 'Convert ABC music notation to PDF sheet music. ABC notation is a text-based music notation system that can represent melodies, chords, and rhythms. The tool validates the input, renders it as sheet music, and returns a PDF file.',
          inputSchema: {
            type: 'object',
            properties: {
              abc_notation: {
                type: 'string',
                description: 'The ABC notation string to convert. Must be valid ABC notation format. ' +
                            'Example (use actual newlines, not escape sequences): ' +
                            'X:1 [newline] T:Scale [newline] M:4/4 [newline] L:1/4 [newline] K:C [newline] C D E F | G A B c |',
              },
              title: {
                type: 'string',
                description: 'Optional title for the PDF document. If not provided, defaults to "Music Sheet".',
              },
              composer: {
                type: 'string',
                description: 'Optional composer name for the PDF document metadata.',
              },
            },
            required: ['abc_notation'],
          },
        },
      ],
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name !== 'abc_to_pdf') {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      // Validate input using Zod schema
      const validatedArgs = AbcToPdfSchema.parse(args);

      // Convert ABC to PDF
      const pdfBuffer = await abcToPdf(validatedArgs.abc_notation, {
        title: validatedArgs.title,
        composer: validatedArgs.composer,
      });

      // Convert to base64
      const base64Pdf = pdfToBase64(pdfBuffer);

      // Return result
      return {
        content: [
          {
            type: 'resource',
            resource: {
              uri: `data:application/pdf;base64,${base64Pdf}`,
              mimeType: 'application/pdf',
              text: `Generated PDF from ABC notation${validatedArgs.title ? ` - ${validatedArgs.title}` : ''}`,
            },
          },
          {
            type: 'text',
            text: `Successfully generated PDF from ABC notation. Size: ${Math.round(pdfBuffer.length / 1024)}KB`,
          },
        ],
      };
    } catch (error) {
      // Return error message
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });
}

/**
 * Create HTTP server with Streamable HTTP support
 */
const httpServer = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'partitura-mcp' }));
    return;
  }

  // Root endpoint - API documentation
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Partitura MCP Server</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>🎵 Partitura MCP Server</h1>
          <p>Model Context Protocol server for converting ABC notation to PDF sheet music.</p>
          
          <h2>Endpoints</h2>
          <ul>
            <li><code>GET /</code> - This documentation page</li>
            <li><code>GET /health</code> - Health check endpoint</li>
            <li><code>POST /mcp</code> - MCP endpoint for JSON-RPC messages</li>
            <li><code>GET /mcp</code> - MCP endpoint for SSE streaming (requires mcp-session-id header)</li>
            <li><code>DELETE /mcp</code> - MCP endpoint for session termination</li>
          </ul>
          
          <h2>Available Tools</h2>
          <h3>abc_to_pdf</h3>
          <p>Convert ABC music notation to PDF sheet music.</p>
          <pre>
{
  "abc_notation": "X:1\\nT:Scale\\nM:4/4\\nL:1/4\\nK:C\\nC D E F | G A B c |",
  "title": "Optional Title",
  "composer": "Optional Composer"
}
          </pre>
          
          <h2>Status</h2>
          <p>Server is running on port ${PORT}</p>
          <p>Protocol: MCP Streamable HTTP (2025-11-25)</p>
        </body>
      </html>
    `);
    return;
  }

  // MCP Streamable HTTP endpoint - handles GET, POST, and DELETE
  if (req.url === '/mcp') {
    const sessionId = req.headers['mcp-session-id'];
    
    try {
      if (req.method === 'POST') {
        // Handle POST requests
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const message = JSON.parse(body);
            
            let transport;
            
            if (sessionId && transports[sessionId]) {
              // Reuse existing transport
              transport = transports[sessionId];
              console.log(`Reusing transport for session: ${sessionId}`);
            } else if (!sessionId && isInitializeRequest(message)) {
              // New initialization request
              console.log('Creating new transport for initialization');
              
              transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (newSessionId) => {
                  console.log(`Session initialized with ID: ${newSessionId}`);
                  transports[newSessionId] = transport;
                }
              });
              
              // Set up onclose handler to clean up transport when closed
              transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                  console.log(`Transport closed for session ${sid}, removing from transports map`);
                  delete transports[sid];
                }
              };
              
              // Create and configure MCP server
              const server = createMcpServer();
              setupServerHandlers(server);
              
              // Connect the transport to the MCP server
              await server.connect(transport);
            } else {
              // Invalid request - no session ID or not initialization request
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                  code: -32000,
                  message: 'Bad Request: No valid session ID provided or not an initialization request'
                },
                id: null
              }));
              return;
            }
            
            // Handle the request with the transport
            await transport.handleRequest(req, res, message);
          } catch (error) {
            console.error('Error handling MCP POST request:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                  code: -32603,
                  message: 'Internal server error'
                },
                id: null
              }));
            }
          }
        });
        
        return;
      } else if (req.method === 'GET') {
        // Handle GET requests for SSE streams
        if (!sessionId || !transports[sessionId]) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid or missing session ID');
          return;
        }
        
        console.log(`Establishing SSE stream for session ${sessionId}`);
        
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
        return;
      } else if (req.method === 'DELETE') {
        // Handle DELETE requests for session termination
        if (!sessionId || !transports[sessionId]) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid or missing session ID');
          return;
        }
        
        console.log(`Received session termination request for session ${sessionId}`);
        
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
        return;
      } else {
        // Method not allowed
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
      }
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        }));
      }
    }
    
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

/**
 * Start the server
 */
async function main() {
  httpServer.listen(PORT, () => {
    console.log(`Partitura MCP Streamable HTTP Server started on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Protocol: MCP Streamable HTTP (2025-11-25)`);
  });
}

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  
  console.log('Server shutdown complete');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
