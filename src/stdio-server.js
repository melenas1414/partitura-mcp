#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { abcToPdf, pdfToBase64, AbcToPdfSchema } from './index.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'partitura-mcp',
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

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr so it doesn't interfere with stdio communication
  console.error('Partitura MCP Server (stdio) started successfully');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
