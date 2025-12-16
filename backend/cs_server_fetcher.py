"""
CS 1.6 Server Status Fetcher Module

This module provides a reusable interface for querying Counter-Strike 1.6 servers
using the A2S (Source Engine query) protocol. It handles connection management,
error handling, timeout management, and hostname resolution.
"""

import socket
import time
import logging
from typing import Dict, Any, Optional, List, Tuple
import a2s

logger = logging.getLogger(__name__)


class CS16ServerFetcher:
    """
    Fetches and returns detailed information about Counter-Strike 1.6 servers.
    
    Supports querying via IP:port format and hostname resolution. Handles
    timeouts, connection errors, and offline servers gracefully.
    """
    
    DEFAULT_TIMEOUT = 3.0
    MIN_PORT = 1
    MAX_PORT = 65535
    
    def __init__(self, timeout: float = DEFAULT_TIMEOUT):
        """
        Initialize the server fetcher.
        
        Args:
            timeout: Connection timeout in seconds (default: 3.0)
        """
        self.timeout = max(timeout, 0.5)  # Ensure minimum timeout
    
    def resolve_address(self, host: str, port: int) -> Tuple[str, int]:
        """
        Resolve hostname to IP address and validate port.
        
        Args:
            host: Hostname or IP address
            port: Port number
            
        Returns:
            Tuple of (resolved_ip, port)
            
        Raises:
            ValueError: If port is invalid or host cannot be resolved
        """
        if not isinstance(port, int):
            raise ValueError(f"Port must be an integer, got {type(port)}")
        
        if port < self.MIN_PORT or port > self.MAX_PORT:
            raise ValueError(f"Port must be between {self.MIN_PORT} and {self.MAX_PORT}, got {port}")
        
        if not host or not isinstance(host, str):
            raise ValueError("Host must be a non-empty string")
        
        try:
            # Try to resolve hostname to IP
            resolved_ip = socket.gethostbyname(host)
            return resolved_ip, port
        except socket.gaierror as e:
            raise ValueError(f"Cannot resolve hostname '{host}': {str(e)}")
        except Exception as e:
            raise ValueError(f"Address resolution error: {str(e)}")
    
    def fetch(self, host: str, port: int) -> Dict[str, Any]:
        """
        Fetch server information from a CS 1.6 server.
        
        Args:
            host: Server IP or hostname
            port: Server port
            
        Returns:
            Dictionary with server information:
            {
                "success": bool,
                "data": {
                    "hostname": str,
                    "map": str,
                    "current_players": int,
                    "max_players": int,
                    "game": str,
                    "server_type": str,
                    "os": str,
                    "password_protected": bool,
                    "vac_enabled": bool,
                    "ping": float,
                    "player_list": list
                },
                "error": str (if not successful)
            }
        """
        try:
            # Resolve address
            resolved_ip, resolved_port = self.resolve_address(host, port)
            address = (resolved_ip, resolved_port)
            
            # Measure and fetch server info
            start_time = time.time()
            info = a2s.info(address, timeout=self.timeout)
            ping = (time.time() - start_time) * 1000
            
            # Fetch player list
            player_list = self._fetch_player_list(address)
            
            return {
                "success": True,
                "data": {
                    "hostname": info.server_name,
                    "map": info.map_name,
                    "current_players": info.player_count,
                    "max_players": info.max_players,
                    "game": info.game,
                    "server_type": info.server_type,
                    "os": info.platform,
                    "password_protected": info.password_protected,
                    "vac_enabled": info.vac_enabled,
                    "ping": round(ping, 2),
                    "player_list": player_list
                }
            }
            
        except ValueError as e:
            logger.warning(f"Invalid input for {host}:{port} - {str(e)}")
            return {"success": False, "error": str(e)}
        except socket.timeout:
            logger.warning(f"Connection timeout for {host}:{port}")
            return {"success": False, "error": "Connection timeout - server may be offline"}
        except ConnectionRefusedError:
            logger.warning(f"Connection refused for {host}:{port}")
            return {"success": False, "error": "Connection refused - invalid IP or port"}
        except ConnectionResetError:
            logger.warning(f"Connection reset for {host}:{port}")
            return {"success": False, "error": "Connection reset - server may be offline"}
        except socket.error as e:
            logger.warning(f"Socket error for {host}:{port} - {str(e)}")
            return {"success": False, "error": f"Network error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error querying {host}:{port} - {str(e)}")
            return {"success": False, "error": f"Failed to query server: {str(e)}"}
    
    def _fetch_player_list(self, address: Tuple[str, int]) -> List[Dict[str, Any]]:
        """
        Fetch the list of players from the server.
        
        Args:
            address: Tuple of (ip, port)
            
        Returns:
            List of player dictionaries with name, score, and duration
        """
        try:
            players = a2s.players(address, timeout=self.timeout)
            return [
                {
                    "name": p.name,
                    "score": p.score,
                    "duration": p.duration
                }
                for p in players if p.name
            ]
        except Exception as e:
            logger.debug(f"Could not fetch player list from {address}: {str(e)}")
            return []
    
    def fetch_multiple(self, servers: List[Tuple[str, int]]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch information from multiple servers.
        
        Args:
            servers: List of (host, port) tuples
            
        Returns:
            Dictionary mapping "host:port" to server info dictionaries
        """
        results = {}
        for host, port in servers:
            key = f"{host}:{port}"
            results[key] = self.fetch(host, port)
        return results


def create_fetcher(timeout: float = CS16ServerFetcher.DEFAULT_TIMEOUT) -> CS16ServerFetcher:
    """
    Factory function to create a CS16ServerFetcher instance.
    
    Args:
        timeout: Connection timeout in seconds
        
    Returns:
        CS16ServerFetcher instance
    """
    return CS16ServerFetcher(timeout=timeout)


def query_server(host: str, port: int, timeout: float = CS16ServerFetcher.DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Convenience function to query a single server.
    
    Args:
        host: Server IP or hostname
        port: Server port
        timeout: Connection timeout in seconds
        
    Returns:
        Dictionary with server information (see CS16ServerFetcher.fetch for structure)
    """
    fetcher = create_fetcher(timeout=timeout)
    return fetcher.fetch(host, port)
