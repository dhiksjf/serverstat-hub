# CS 1.6 Server Status Fetcher Module

A reusable Python module for querying Counter-Strike 1.6 servers using the A2S (Source Engine query) protocol.

## Features

- **A2S Protocol Support**: Queries CS 1.6 servers using the Source Engine query protocol
- **Server Information Retrieval**:
  - Server hostname/name
  - Current map
  - Player count (current and max)
  - Game type
  - Server type (Dedicated/Listen)
  - Operating system
  - Password protection status
  - VAC anti-cheat status
  - Server ping/latency
  - Active player list with scores and play duration
- **Connection Management**:
  - Configurable timeout handling
  - Graceful error handling for offline/unreachable servers
  - Socket error recovery
- **Address Resolution**:
  - Support for both IP addresses and hostnames
  - Automatic DNS resolution
  - Port validation
- **Structured Output**: Returns consistent JSON/dictionary format for easy integration

## Installation

The module requires the `python-a2s` package:

```bash
pip install python-a2s
```

This is already included in `requirements.txt`.

## Usage

### Basic Usage - Query Single Server

```python
from cs_server_fetcher import query_server

# Query a server by IP and port
result = query_server("192.168.1.100", 27015)

if result["success"]:
    data = result["data"]
    print(f"Server: {data['hostname']}")
    print(f"Map: {data['map']}")
    print(f"Players: {data['current_players']}/{data['max_players']}")
else:
    print(f"Error: {result['error']}")
```

### Advanced Usage - Using the Class

```python
from cs_server_fetcher import CS16ServerFetcher

# Create a fetcher with custom timeout
fetcher = CS16ServerFetcher(timeout=5.0)

# Query a server
result = fetcher.fetch("game.example.com", 27015)

# Query multiple servers
servers = [
    ("server1.example.com", 27015),
    ("192.168.1.100", 27015),
    ("server3.example.com", 27016)
]
results = fetcher.fetch_multiple(servers)

for server_key, server_info in results.items():
    print(f"{server_key}: {server_info}")
```

### Using the Factory Function

```python
from cs_server_fetcher import create_fetcher

fetcher = create_fetcher(timeout=3.0)
result = fetcher.fetch("192.168.1.100", 27015)
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "hostname": "Server Name",
    "map": "de_dust2",
    "current_players": 10,
    "max_players": 32,
    "game": "Counter-Strike",
    "server_type": "dedicated",
    "os": "windows",
    "password_protected": false,
    "vac_enabled": true,
    "ping": 45.32,
    "player_list": [
      {
        "name": "Player1",
        "score": 2500,
        "duration": 1800
      },
      {
        "name": "Player2",
        "score": 1800,
        "duration": 1500
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Connection timeout - server may be offline"
}
```

## Error Handling

The module handles various error scenarios gracefully:

- **Connection Timeout**: Server doesn't respond within the timeout period
- **Connection Refused**: Invalid IP address or port
- **Network Errors**: Socket/network-level errors
- **Invalid Input**: Invalid hostname, port, or data types
- **Resolution Errors**: Hostname cannot be resolved
- **Server Offline**: Server is not responding to queries

All errors are returned in the response dictionary with a `success: false` flag and an `error` message.

## API Reference

### CS16ServerFetcher Class

#### `__init__(timeout: float = 3.0)`

Initialize the fetcher with an optional timeout value.

**Parameters:**
- `timeout` (float): Connection timeout in seconds (minimum 0.5, default 3.0)

#### `fetch(host: str, port: int) -> Dict[str, Any]`

Fetch server information from a single CS 1.6 server.

**Parameters:**
- `host` (str): Server IP address or hostname
- `port` (int): Server port (1-65535)

**Returns:** Dictionary with server information and success status

#### `fetch_multiple(servers: List[Tuple[str, int]]) -> Dict[str, Dict[str, Any]]`

Fetch information from multiple servers.

**Parameters:**
- `servers` (List[Tuple[str, int]]): List of (host, port) tuples

**Returns:** Dictionary mapping "host:port" to server info dictionaries

#### `resolve_address(host: str, port: int) -> Tuple[str, int]`

Resolve hostname to IP address and validate port.

**Parameters:**
- `host` (str): Hostname or IP address
- `port` (int): Port number

**Returns:** Tuple of (resolved_ip, port)

**Raises:** ValueError if address is invalid

### Module-Level Functions

#### `create_fetcher(timeout: float = 3.0) -> CS16ServerFetcher`

Factory function to create a fetcher instance.

#### `query_server(host: str, port: int, timeout: float = 3.0) -> Dict[str, Any]`

Convenience function to query a single server with default settings.

## Integration Example

### With FastAPI (as used in serverstat-hub)

```python
from fastapi import FastAPI, HTTPException
from cs_server_fetcher import query_server

app = FastAPI()

@app.post("/api/query-server")
async def api_query_server(ip: str, port: int):
    result = await asyncio.to_thread(query_server, ip, port)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result["data"]
```

## Performance Considerations

- **Timeout**: Default 3.0 seconds is suitable for most networks. Increase for unreliable connections.
- **Player List**: Optional feature that can fail independently without affecting server info
- **Multiple Servers**: Use `fetch_multiple()` for batch queries to minimize overhead
- **Async Integration**: Compatible with async frameworks via `asyncio.to_thread()`

## Troubleshooting

### "Cannot resolve hostname"
- Check the hostname spelling
- Verify DNS connectivity
- Try using IP address directly

### "Connection timeout"
- Server may be offline
- Check firewall rules
- Increase timeout value
- Verify IP:port combination

### "Connection refused"
- Invalid port number
- Server not running on that port
- Firewall blocking the connection

### No player list returned
- Some servers don't respond to player queries
- This doesn't indicate server failure - server info is still available
- Player list is optional in the response

## License

Part of the serverstat-hub application - MIT License
