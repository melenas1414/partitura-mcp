# Partitura MCP - ABC Notation to PDF Server

A Model Context Protocol (MCP) server that converts ABC music notation to PDF sheet music. This server can be used by AI assistants to generate professional-looking sheet music from text-based ABC notation.

## Features

- 🎵 Convert ABC notation to high-quality PDF sheet music
- 🔌 Two server modes: stdio (local) and HTTP (remote)
- ✅ Input validation for ABC notation
- 🛡️ Built with security best practices
- 📦 ES Modules support
- 🚀 Easy integration with AI assistants

## Installation

```bash
npm install
```

## Quick Start

Run the demo to generate sample PDFs and test all features:

```bash
npm run demo
```

This will:
- Generate PDF samples for various songs
- Test security validation
- Create example PDFs in the `output-samples/` directory

## Usage

### Stdio Server (Local)

For local AI assistants and command-line tools:

```bash
npm run start:stdio
```

Or using the binary directly:

```bash
npx partitura-mcp
```

### HTTP Server (Remote)

For remote AI assistants and web applications:

```bash
npm run start:http
```

The server will start on `http://localhost:3000`

You can specify a custom port:

```bash
PORT=8080 npm run start:http
```

## MCP Tool: `abc_to_pdf`

The server exposes a single tool called `abc_to_pdf` that converts ABC notation to PDF.

### Parameters

- `abc_notation` (string, required): The ABC notation string to convert
- `title` (string, optional): Optional title for the PDF document
- `composer` (string, optional): Optional composer name for the PDF document

### Example ABC Notation

```abc
X:1
T:Scale in C Major
M:4/4
L:1/4
K:C
C D E F | G A B c |
```

### Response

The tool returns the PDF as base64-encoded data along with metadata:

```json
{
  "content": [
    {
      "type": "resource",
      "resource": {
        "uri": "data:application/pdf;base64,...",
        "mimeType": "application/pdf",
        "text": "Generated PDF from ABC notation"
      }
    }
  ]
}
```

## Integration with AI Assistants

### Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "partitura": {
      "command": "npx",
      "args": ["partitura-mcp"]
    }
  }
}
```

### GitHub Copilot Configuration

For GitHub Copilot with MCP support, configure the HTTP server endpoint in your settings.

## Examples

See the [examples](./examples) directory for:

- Simple melodies
- Complex compositions
- Integration examples with various AI assistants

## ABC Notation Reference

ABC notation is a text-based music notation system. Here are some basics:

- `X:` - Reference number
- `T:` - Title
- `M:` - Meter (time signature)
- `L:` - Default note length
- `K:` - Key signature
- `|` - Bar line
- `||` - Double bar line (end of section)

For full ABC notation documentation, visit: http://abcnotation.com/

## Development

### Project Structure

```
partitura-mcp/
├── src/
│   ├── index.js           # Core conversion logic
│   ├── stdio-server.js    # Stdio MCP server
│   └── http-server.js     # HTTP MCP server
├── examples/
│   └── sample-abc.md      # Example ABC notations
├── docs/
│   └── api.md             # Detailed API documentation
├── tests/
│   └── conversion.test.js # Tests
└── README.md
```

### Running Tests

```bash
npm test
```

## Security

- Input validation using Zod schemas
- ABC notation sanitization before processing
- Resource limits to prevent abuse
- Error handling for malformed input

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
