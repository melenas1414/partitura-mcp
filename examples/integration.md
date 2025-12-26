# Integration Examples

This document provides examples of how to integrate the Partitura MCP server with various AI assistants and applications.

## Table of Contents

- [Claude Desktop](#claude-desktop)
- [Node.js Client](#nodejs-client)
- [Python Client](#python-client)
- [Direct API Usage](#direct-api-usage)

## Claude Desktop

To use this MCP server with Claude Desktop:

1. Install the package globally or locally:
   ```bash
   npm install -g partitura-mcp
   # or use npx
   ```

2. Configure Claude Desktop by editing the config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

3. Add the MCP server configuration:
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

4. Restart Claude Desktop

5. Use it in conversations:
   ```
   Human: Can you convert this ABC notation to a PDF?
   X:1
   T:Twinkle Twinkle Little Star
   M:4/4
   L:1/4
   K:C
   CC GG | AA G2 | FF EE | DD C2 |
   
   Claude: I'll help you convert that ABC notation to a PDF...
   [Uses the abc_to_pdf tool]
   ```

## Node.js Client

### Stdio Transport

```javascript
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

class PartituraClient {
  constructor() {
    this.server = spawn('npx', ['partitura-mcp']);
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    this.server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => {
        try {
          const response = JSON.parse(line);
          const handler = this.pendingRequests.get(response.id);
          if (handler) {
            handler.resolve(response);
            this.pendingRequests.delete(response.id);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    });
  }
  
  async request(method, params) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.server.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
  
  async listTools() {
    const response = await this.request('tools/list');
    return response.result?.tools || [];
  }
  
  async convertAbcToPdf(abcNotation, options = {}) {
    const response = await this.request('tools/call', {
      name: 'abc_to_pdf',
      arguments: {
        abc_notation: abcNotation,
        ...options
      }
    });
    
    return response.result;
  }
  
  async savePdf(abcNotation, outputPath, options = {}) {
    const result = await this.convertAbcToPdf(abcNotation, options);
    const resource = result.content.find(c => c.type === 'resource');
    
    if (!resource) {
      throw new Error('No PDF resource in response');
    }
    
    const base64Data = resource.resource.uri.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    writeFileSync(outputPath, pdfBuffer);
    
    return pdfBuffer.length;
  }
  
  close() {
    this.server.kill();
  }
}

// Usage example
async function main() {
  const client = new PartituraClient();
  
  try {
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.map(t => t.name));
    
    // Convert ABC to PDF
    const abc = `X:1
T:Amazing Grace
C:John Newton
M:3/4
L:1/4
K:G
D | G2 B/2A/2 | G2 B | B2 A | G2 E |
D2 D | G2 B/2A/2 | G4 z2 |`;
    
    const size = await client.savePdf(abc, 'output.pdf', {
      title: 'Amazing Grace',
      composer: 'John Newton'
    });
    
    console.log(`PDF saved successfully! Size: ${Math.round(size / 1024)}KB`);
  } finally {
    client.close();
  }
}

main().catch(console.error);
```

### HTTP Transport

```javascript
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

class PartituraHttpClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }
  
  async health() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
  
  async convertAbcToPdf(abcNotation, options = {}) {
    // Note: HTTP/SSE implementation depends on your client library
    // This is a simplified example
    const eventSource = new EventSource(`${this.baseUrl}/sse`);
    
    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'response') {
          resolve(data.result);
          eventSource.close();
        }
      };
      
      eventSource.onerror = (error) => {
        reject(error);
        eventSource.close();
      };
      
      // Send request
      fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });
    });
  }
}

// Usage
const client = new PartituraHttpClient('http://localhost:3000');
const status = await client.health();
console.log('Server status:', status);
```

## Python Client

```python
import json
import subprocess
import base64
from pathlib import Path

class PartituraClient:
    def __init__(self):
        self.server = subprocess.Popen(
            ['npx', 'partitura-mcp'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self.request_id = 0
    
    def request(self, method, params=None):
        self.request_id += 1
        request = {
            'jsonrpc': '2.0',
            'id': self.request_id,
            'method': method
        }
        if params:
            request['params'] = params
        
        self.server.stdin.write(json.dumps(request) + '\n')
        self.server.stdin.flush()
        
        # Read response
        response_line = self.server.stdout.readline()
        return json.loads(response_line)
    
    def list_tools(self):
        response = self.request('tools/list')
        return response.get('result', {}).get('tools', [])
    
    def convert_abc_to_pdf(self, abc_notation, title=None, composer=None):
        params = {
            'name': 'abc_to_pdf',
            'arguments': {
                'abc_notation': abc_notation
            }
        }
        if title:
            params['arguments']['title'] = title
        if composer:
            params['arguments']['composer'] = composer
        
        response = self.request('tools/call', params)
        return response.get('result')
    
    def save_pdf(self, abc_notation, output_path, title=None, composer=None):
        result = self.convert_abc_to_pdf(abc_notation, title, composer)
        
        # Extract PDF from response
        for content in result.get('content', []):
            if content['type'] == 'resource':
                uri = content['resource']['uri']
                base64_data = uri.split(',')[1]
                pdf_data = base64.b64decode(base64_data)
                
                Path(output_path).write_bytes(pdf_data)
                return len(pdf_data)
        
        raise ValueError('No PDF resource in response')
    
    def close(self):
        self.server.terminate()
        self.server.wait()

# Usage example
def main():
    client = PartituraClient()
    
    try:
        # List tools
        tools = client.list_tools()
        print('Available tools:', [t['name'] for t in tools])
        
        # Convert ABC to PDF
        abc = """X:1
T:Greensleeves
C:Traditional English
M:6/8
L:1/8
K:Em
E | G2 A B2 c | d3 e2 d | B2 G G2 ^F | G3 E2 E |
G2 A B2 c | d3 e2 d | B2 G ^F2 ^D | E6- | E2 z |]"""
        
        size = client.save_pdf(
            abc,
            'greensleeves.pdf',
            title='Greensleeves',
            composer='Traditional English'
        )
        
        print(f'PDF saved successfully! Size: {size // 1024}KB')
    
    finally:
        client.close()

if __name__ == '__main__':
    main()
```

## Direct API Usage

### cURL Examples

```bash
# Health check
curl http://localhost:3000/health

# Get server info (HTML page)
curl http://localhost:3000/

# Note: For actual tool calls via HTTP, you need to use the SSE protocol
# which requires a proper client library. See the Node.js example above.
```

### Testing with MCP Inspector

The Model Context Protocol provides an inspector tool for debugging:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Inspect the server
mcp-inspector npx partitura-mcp
```

This will open a web interface where you can:
- See all available tools
- Test tool calls
- Inspect request/response payloads
- Debug issues

## Error Handling

All clients should handle these common errors:

```javascript
try {
  const result = await client.convertAbcToPdf(abcNotation);
} catch (error) {
  if (error.message.includes('ABC notation cannot be empty')) {
    console.error('Invalid input: ABC notation is required');
  } else if (error.message.includes('unsafe content')) {
    console.error('Security error: Input contains potentially dangerous content');
  } else if (error.message.includes('Failed to render')) {
    console.error('ABC notation syntax error');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Best Practices

1. **Validate input client-side** before sending to the server
2. **Handle timeouts** gracefully (conversions typically take 1-3 seconds)
3. **Cache results** when appropriate to reduce server load
4. **Use connection pooling** for HTTP clients
5. **Implement retry logic** with exponential backoff
6. **Monitor PDF sizes** - very complex scores can produce large PDFs
7. **Test with various ABC notations** to ensure compatibility

## Performance Tips

- For batch processing, reuse the same client instance
- Use the stdio transport for local processing (lower latency)
- Use the HTTP transport for remote/distributed systems
- Consider streaming large PDFs instead of loading entirely in memory
- Implement caching for frequently requested conversions

## Troubleshooting

### Connection Issues

```javascript
// Add connection timeout
const timeout = setTimeout(() => {
  console.error('Connection timeout');
  client.close();
}, 5000);

try {
  await client.listTools();
  clearTimeout(timeout);
} catch (error) {
  console.error('Connection failed:', error);
}
```

### Invalid ABC Notation

```javascript
// Validate before sending
function validateAbc(abc) {
  if (!abc.includes('X:')) {
    throw new Error('Missing X: (reference number)');
  }
  if (!abc.includes('K:')) {
    throw new Error('Missing K: (key signature)');
  }
  return true;
}

try {
  validateAbc(abcNotation);
  await client.convertAbcToPdf(abcNotation);
} catch (error) {
  console.error('Validation error:', error.message);
}
```

## Additional Resources

- [ABC Notation Documentation](http://abcnotation.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/melenas1414/partitura-mcp)
