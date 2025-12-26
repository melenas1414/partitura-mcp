# API Documentation

## Overview

The Partitura MCP server provides a single tool for converting ABC music notation to PDF sheet music through the Model Context Protocol.

## Tool: abc_to_pdf

Converts ABC music notation to a PDF document containing rendered sheet music.

### Input Schema

```typescript
{
  abc_notation: string;  // Required: ABC notation string
  title?: string;        // Optional: Title for the PDF
  composer?: string;     // Optional: Composer name
}
```

### Parameters

#### abc_notation (required)
- **Type**: `string`
- **Description**: Valid ABC notation string to convert to sheet music
- **Validation**: 
  - Must not be empty
  - Must not contain malicious content (script tags, etc.)
  - Should follow ABC notation format

#### title (optional)
- **Type**: `string`
- **Description**: Title to display on the generated PDF
- **Default**: "Music Sheet"

#### composer (optional)
- **Type**: `string`
- **Description**: Composer name to include in PDF metadata and display
- **Default**: "Unknown"

### Output

The tool returns an array of content items:

1. **Resource object** containing the PDF:
```json
{
  "type": "resource",
  "resource": {
    "uri": "data:application/pdf;base64,<base64-encoded-pdf>",
    "mimeType": "application/pdf",
    "text": "Generated PDF from ABC notation - <title>"
  }
}
```

2. **Text confirmation** with file size:
```json
{
  "type": "text",
  "text": "Successfully generated PDF from ABC notation. Size: 45KB"
}
```

### Error Handling

If an error occurs, the tool returns:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: <error-message>"
    }
  ],
  "isError": true
}
```

Common errors:
- `ABC notation cannot be empty`
- `ABC notation contains potentially unsafe content`
- `Failed to render ABC notation`
- `Failed to generate PDF: <details>`

## ABC Notation Format

ABC notation is a text-based music notation system. Here's a quick reference:

### Header Fields
- `X:` - Reference number (required)
- `T:` - Title
- `C:` - Composer
- `M:` - Meter (time signature), e.g., `4/4`, `3/4`, `6/8`
- `L:` - Default note length, e.g., `1/4`, `1/8`
- `K:` - Key signature, e.g., `C`, `G`, `Dm`, `Bb`
- `Q:` - Tempo

### Notes
- Letters `A-G` and `a-g` represent notes
- Uppercase = lower octave, lowercase = higher octave
- Note length: `C2` = half note, `C/2` = eighth note
- Rests: `z` with optional length, e.g., `z2`
- Accidentals: `^C` = sharp, `_C` = flat, `=C` = natural

### Rhythm
- Bar lines: `|` (single), `||` (double), `|:` (repeat start), `:|` (repeat end)
- Triplets: `(3ABC`
- Chords: `[CEG]`

### Example
```abc
X:1
T:Twinkle Twinkle Little Star
C:Traditional
M:4/4
L:1/4
K:C
CC GG | AA G2 | FF EE | DD C2 |
GG FF | EE D2 | GG FF | EE D2 |
CC GG | AA G2 | FF EE | DD C2 |]
```

## Transport Protocols

### Stdio (Local)

For local AI assistants and command-line integration:

```bash
npx partitura-mcp
```

Communication is via standard input/output using JSON-RPC 2.0 protocol.

### HTTP Streamable (Remote)

For remote AI assistants and web applications:

```bash
PORT=3000 npm run start:http
```

**Endpoints:**
- `GET /` - Documentation page
- `GET /health` - Health check
- `POST /mcp` - MCP endpoint for JSON-RPC messages (initialization and tool calls)
- `GET /mcp` - MCP endpoint for SSE streaming (requires mcp-session-id header)
- `DELETE /mcp` - MCP endpoint for session termination

**Protocol**: MCP Streamable HTTP transport specification (released 2025-11-25)

**MCP Protocol Version**: `2024-11-05`

The server uses session-based communication:
1. Client sends initialization request via POST to `/mcp`
2. Server responds with session ID in `mcp-session-id` header
3. Client uses session ID for subsequent requests
4. Client can establish SSE stream via GET to `/mcp` with session ID header

## Security Considerations

### Input Validation

The server validates all input to prevent:
- Empty or malformed ABC notation
- Script injection attacks
- XXE attacks
- Resource exhaustion

### Content Security

- ABC notation is sanitized before processing
- PDF generation is isolated from system resources
- File size limits prevent memory exhaustion
- Error messages don't leak sensitive information

### Best Practices

1. **Validate input** before sending to the server
2. **Limit ABC notation size** to reasonable lengths (< 100KB)
3. **Use HTTPS** in production for HTTP transport
4. **Implement rate limiting** on the client side
5. **Handle errors gracefully** and inform users

## Performance

### Resource Usage

- **Memory**: ~50-100MB per conversion
- **CPU**: Low, most time spent in rendering
- **Conversion time**: 1-3 seconds typical

### Optimization Tips

1. Cache repeated conversions on the client side
2. Batch multiple conversions when possible
3. Use stdio transport for better performance in local scenarios
4. Consider streaming for large ABC files

## Troubleshooting

### Common Issues

**Problem**: `Failed to render ABC notation`
- **Solution**: Check ABC notation syntax, ensure required fields (X, K) are present

**Problem**: `ABC notation contains potentially unsafe content`
- **Solution**: Remove HTML tags or JavaScript from the notation string

**Problem**: `Connection timeout`
- **Solution**: Check network connectivity, verify server is running

**Problem**: Empty or corrupted PDF
- **Solution**: Ensure ABC notation is valid, check for special characters

### Debug Mode

Enable debug logging:

```bash
DEBUG=partitura:* npm run start:http
```

For stdio server, check stderr output for debug messages.

## Integration Examples

### Python Client

```python
import json
import subprocess

def convert_abc_to_pdf(abc_notation, title=None, composer=None):
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "abc_to_pdf",
            "arguments": {
                "abc_notation": abc_notation,
                "title": title,
                "composer": composer
            }
        }
    }
    
    process = subprocess.Popen(
        ["npx", "partitura-mcp"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    output, error = process.communicate(json.dumps(request).encode())
    return json.loads(output)
```

### JavaScript Client

```javascript
import { spawn } from 'child_process';

async function convertAbcToPdf(abcNotation, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn('npx', ['partitura-mcp']);
    
    let output = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(output));
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'abc_to_pdf',
        arguments: {
          abc_notation: abcNotation,
          ...options
        }
      }
    };
    
    process.stdin.write(JSON.stringify(request));
    process.stdin.end();
  });
}
```

## Versioning

The server follows Semantic Versioning (SemVer):
- **Major**: Breaking changes to API or protocol
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, performance improvements

Current version: **1.0.0**

## License

MIT License - See LICENSE file for details
