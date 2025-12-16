# CS Server Fetcher - Integration Examples

This document provides practical examples of how to integrate the `cs_server_fetcher` module into your applications.

## FastAPI Integration (Current Implementation)

The `server.py` file already demonstrates the FastAPI integration:

```python
from cs_server_fetcher import create_fetcher

def query_cs_server(ip: str, port: int, timeout: float = 3.0) -> Dict[str, Any]:
    """Query a CS 1.6 server using the A2S (Source Engine) protocol"""
    fetcher = create_fetcher(timeout=timeout)
    return fetcher.fetch(ip, port)

@api_router.post("/query-server")
async def query_server(request: ServerQueryRequest):
    """Query a CS 1.6 server and return its information"""
    result = await asyncio.to_thread(query_cs_server, request.ip, request.port)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result["data"]
```

## Basic Script Usage

### Simple Query

```python
from cs_server_fetcher import query_server

# Query a server
result = query_server("192.168.1.100", 27015)

if result["success"]:
    print(f"Server: {result['data']['hostname']}")
    print(f"Map: {result['data']['map']}")
    print(f"Players: {result['data']['current_players']}/{result['data']['max_players']}")
else:
    print(f"Error: {result['error']}")
```

### Batch Query with Class

```python
from cs_server_fetcher import CS16ServerFetcher

fetcher = CS16ServerFetcher(timeout=5.0)

servers = [
    ("game1.example.com", 27015),
    ("game2.example.com", 27015),
    ("192.168.1.100", 27016),
]

results = fetcher.fetch_multiple(servers)

for server_key, info in results.items():
    if info["success"]:
        print(f"{server_key}: {info['data']['hostname']}")
    else:
        print(f"{server_key}: ERROR - {info['error']}")
```

## Flask Integration Example

```python
from flask import Flask, jsonify, request
from cs_server_fetcher import query_server

app = Flask(__name__)

@app.route('/api/query-server', methods=['POST'])
def query_cs_server():
    data = request.json
    ip = data.get('ip')
    port = data.get('port')
    
    if not ip or not port:
        return jsonify({"error": "Missing IP or port"}), 400
    
    try:
        result = query_server(ip, port)
        
        if not result["success"]:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify(result["data"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

## Django Integration Example

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from cs_server_fetcher import query_server
import json

@require_POST
def query_cs_server(request):
    try:
        data = json.loads(request.body)
        ip = data.get('ip')
        port = data.get('port')
        
        if not ip or not port:
            return JsonResponse({"error": "Missing IP or port"}, status=400)
        
        result = query_server(ip, port)
        
        if not result["success"]:
            return JsonResponse({"error": result["error"]}, status=400)
        
        return JsonResponse(result["data"])
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
```

## Monitoring Application

```python
from cs_server_fetcher import CS16ServerFetcher
import time
from datetime import datetime

class ServerMonitor:
    def __init__(self, servers_config: list, check_interval: int = 60):
        """
        Initialize monitor
        servers_config: list of {"name": str, "ip": str, "port": int}
        check_interval: seconds between checks
        """
        self.fetcher = CS16ServerFetcher(timeout=5.0)
        self.servers = servers_config
        self.check_interval = check_interval
        self.history = {}
    
    def check_all(self):
        """Check all servers and log results"""
        timestamp = datetime.now().isoformat()
        
        for server in self.servers:
            result = self.fetcher.fetch(server["ip"], server["port"])
            
            if result["success"]:
                data = result["data"]
                print(f"[{timestamp}] {server['name']}: {data['current_players']}/{data['max_players']} players")
                
                if server["name"] not in self.history:
                    self.history[server["name"]] = []
                
                self.history[server["name"]].append({
                    "timestamp": timestamp,
                    "data": data
                })
            else:
                print(f"[{timestamp}] {server['name']}: OFFLINE - {result['error']}")
    
    def run(self):
        """Run monitoring loop"""
        while True:
            self.check_all()
            time.sleep(self.check_interval)

# Usage
if __name__ == "__main__":
    servers = [
        {"name": "Server 1", "ip": "game1.example.com", "port": 27015},
        {"name": "Server 2", "ip": "game2.example.com", "port": 27015},
    ]
    
    monitor = ServerMonitor(servers, check_interval=30)
    monitor.run()
```

## Web Dashboard Example

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from cs_server_fetcher import CS16ServerFetcher
from typing import List

app = FastAPI()

fetcher = CS16ServerFetcher()

class ServerDashboard:
    def __init__(self, servers: List[tuple]):
        self.servers = servers
    
    @property
    def status_overview(self):
        results = fetcher.fetch_multiple(self.servers)
        
        online = 0
        offline = 0
        total_players = 0
        
        for key, info in results.items():
            if info["success"]:
                online += 1
                total_players += info["data"]["current_players"]
            else:
                offline += 1
        
        return {
            "total_servers": len(self.servers),
            "online": online,
            "offline": offline,
            "total_players": total_players
        }
    
    @property
    def detailed_status(self):
        results = fetcher.fetch_multiple(self.servers)
        
        servers_info = []
        for key, info in results.items():
            if info["success"]:
                servers_info.append({
                    "address": key,
                    "status": "online",
                    "data": info["data"]
                })
            else:
                servers_info.append({
                    "address": key,
                    "status": "offline",
                    "error": info["error"]
                })
        
        return servers_info

dashboard = ServerDashboard([
    ("game1.example.com", 27015),
    ("game2.example.com", 27015),
])

@app.get("/api/dashboard/overview")
async def get_overview():
    return dashboard.status_overview

@app.get("/api/dashboard/servers")
async def get_servers():
    return dashboard.detailed_status
```

## Error Handling Best Practices

```python
from cs_server_fetcher import query_server
import logging

logger = logging.getLogger(__name__)

def safe_query_server(ip: str, port: int, timeout: float = 3.0):
    """Safely query server with logging"""
    try:
        result = query_server(ip, port, timeout)
        
        if not result["success"]:
            logger.warning(f"Failed to query {ip}:{port}: {result['error']}")
            return None
        
        logger.info(f"Successfully queried {ip}:{port}")
        return result["data"]
        
    except Exception as e:
        logger.error(f"Unexpected error querying {ip}:{port}: {str(e)}")
        return None

# Usage
server_info = safe_query_server("192.168.1.100", 27015)
if server_info:
    print(f"Players: {server_info['current_players']}/{server_info['max_players']}")
else:
    print("Could not retrieve server information")
```

## Testing the Integration

```python
import unittest
from cs_server_fetcher import CS16ServerFetcher

class TestServerFetcher(unittest.TestCase):
    def setUp(self):
        self.fetcher = CS16ServerFetcher(timeout=2.0)
    
    def test_invalid_address(self):
        """Test handling of invalid address"""
        result = self.fetcher.fetch("invalid.test", 27015)
        self.assertFalse(result["success"])
        self.assertIn("error", result)
    
    def test_invalid_port(self):
        """Test handling of invalid port"""
        result = self.fetcher.fetch("192.168.1.1", 99999)
        self.assertFalse(result["success"])
        self.assertIn("error", result)
    
    def test_timeout_server(self):
        """Test timeout handling"""
        # Query a non-routable address
        result = self.fetcher.fetch("192.0.2.1", 27015)
        self.assertFalse(result["success"])
        self.assertIn("timeout", result["error"].lower())
```

## Performance Tips

1. **Reuse Fetcher Instance**: Create one fetcher and reuse it across multiple queries to avoid initialization overhead.

```python
# Good
fetcher = CS16ServerFetcher()
for server in servers:
    result = fetcher.fetch(server["ip"], server["port"])

# Avoid
for server in servers:
    result = query_server(server["ip"], server["port"])  # Creates new fetcher each time
```

2. **Use fetch_multiple() for Batch Queries**: More efficient than looping with individual fetch calls.

3. **Configure Timeout Appropriately**: Higher timeout values for unreliable networks, lower for local networks.

4. **Cache Results**: Store results temporarily to avoid excessive queries.

```python
from functools import lru_cache
from time import time

class CachedFetcher:
    def __init__(self, cache_ttl: int = 30):
        self.fetcher = CS16ServerFetcher()
        self.cache = {}
        self.cache_ttl = cache_ttl
    
    def fetch(self, ip: str, port: int):
        key = f"{ip}:{port}"
        now = time()
        
        if key in self.cache:
            cached_time, cached_result = self.cache[key]
            if now - cached_time < self.cache_ttl:
                return cached_result
        
        result = self.fetcher.fetch(ip, port)
        self.cache[key] = (now, result)
        return result
```

## License

All integration examples are part of the serverstat-hub project - MIT License
