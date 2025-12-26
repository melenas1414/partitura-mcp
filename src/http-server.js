#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer } from 'http';
import { abcToPdf, pdfToBase64, AbcToPdfSchema } from './index.js';

const PORT = process.env.PORT || 3000;

/**
 * Create and configure the MCP server
 */
const mcpServer = new Server(
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

/**
 * Handler for listing available tools
 */
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
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
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
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

/**
 * Create HTTP server with SSE support
 */
const httpServer = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  // MCP SSE endpoint
  if (req.url === '/sse' && req.method === 'GET') {
    console.log('New SSE connection established');
    
    const transport = new SSEServerTransport('/messages', res);
    await mcpServer.connect(transport);
    
    // Handle connection close
    req.on('close', () => {
      console.log('SSE connection closed');
    });
    
    return;
  }

  // POST endpoint for messages
  if (req.url === '/messages' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const message = JSON.parse(body);
        
        // Handle the message through transport
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
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
            <li><code>GET /sse</code> - SSE endpoint for MCP connections</li>
            <li><code>POST /messages</code> - Message endpoint for MCP protocol</li>
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
        </body>
      </html>
    `);
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
    console.log(`Partitura MCP HTTP Server started on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  });
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
