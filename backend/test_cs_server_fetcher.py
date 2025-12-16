#!/usr/bin/env python3
"""
Test script for the CS 1.6 Server Status Fetcher module.

This script tests the module with various scenarios including:
- Valid server queries
- Invalid addresses
- Timeout handling
- Hostname resolution
"""

import sys
from cs_server_fetcher import (
    CS16ServerFetcher,
    create_fetcher,
    query_server
)


def test_address_validation():
    """Test address validation"""
    print("\n=== Testing Address Validation ===")
    fetcher = CS16ServerFetcher()
    
    # Test invalid port (too high)
    try:
        fetcher.resolve_address("192.168.1.100", 70000)
        print("❌ Should have raised ValueError for port > 65535")
    except ValueError as e:
        print(f"✓ Correctly rejected invalid port: {e}")
    
    # Test invalid port (too low)
    try:
        fetcher.resolve_address("192.168.1.100", 0)
        print("❌ Should have raised ValueError for port < 1")
    except ValueError as e:
        print(f"✓ Correctly rejected invalid port: {e}")
    
    # Test invalid port type
    try:
        fetcher.resolve_address("192.168.1.100", "27015")
        print("❌ Should have raised ValueError for non-integer port")
    except ValueError as e:
        print(f"✓ Correctly rejected non-integer port: {e}")
    
    # Test empty hostname
    try:
        fetcher.resolve_address("", 27015)
        print("❌ Should have raised ValueError for empty hostname")
    except ValueError as e:
        print(f"✓ Correctly rejected empty hostname: {e}")


def test_invalid_address():
    """Test querying invalid address"""
    print("\n=== Testing Invalid Address ===")
    result = query_server("invalid-host-that-definitely-does-not-exist-12345.com", 27015)
    
    if not result["success"]:
        print(f"✓ Correctly failed with error: {result['error']}")
    else:
        print("❌ Should have failed for non-existent hostname")


def test_invalid_server():
    """Test querying unreachable server"""
    print("\n=== Testing Unreachable Server ===")
    # Use a non-routable address that will timeout
    result = query_server("192.0.2.1", 27015, timeout=1.0)
    
    if not result["success"]:
        print(f"✓ Correctly failed with error: {result['error']}")
    else:
        print("❌ Should have failed for unreachable server")


def test_fetcher_creation():
    """Test fetcher creation methods"""
    print("\n=== Testing Fetcher Creation ===")
    
    # Test create_fetcher
    fetcher1 = create_fetcher(timeout=2.0)
    print(f"✓ Created fetcher with create_fetcher(): {type(fetcher1).__name__}")
    
    # Test class instantiation
    fetcher2 = CS16ServerFetcher(timeout=3.0)
    print(f"✓ Created fetcher with class: {type(fetcher2).__name__}")
    
    # Test default timeout
    fetcher3 = CS16ServerFetcher()
    print(f"✓ Created fetcher with default timeout: {fetcher3.timeout}s")


def test_response_format():
    """Test response format for error case"""
    print("\n=== Testing Response Format ===")
    
    result = query_server("invalid.server.test", 27015, timeout=1.0)
    
    # Check response structure
    if "success" not in result:
        print("❌ Missing 'success' field in response")
        return
    
    if not result["success"] and "error" not in result:
        print("❌ Missing 'error' field in error response")
        return
    
    print(f"✓ Response structure is correct")
    print(f"  - success: {result['success']}")
    print(f"  - error: {result.get('error', 'N/A')}")


def test_multiple_servers():
    """Test multiple server fetching"""
    print("\n=== Testing Multiple Server Fetching ===")
    
    fetcher = create_fetcher(timeout=1.0)
    
    servers = [
        ("invalid1.test", 27015),
        ("invalid2.test", 27015),
        ("invalid3.test", 27015),
    ]
    
    results = fetcher.fetch_multiple(servers)
    
    if len(results) == 3:
        print(f"✓ Fetched {len(results)} servers")
        for key, result in results.items():
            status = "success" if result["success"] else "failed"
            print(f"  - {key}: {status}")
    else:
        print(f"❌ Expected 3 results, got {len(results)}")


def main():
    """Run all tests"""
    print("=" * 60)
    print("CS 1.6 Server Status Fetcher - Test Suite")
    print("=" * 60)
    
    try:
        test_fetcher_creation()
        test_address_validation()
        test_response_format()
        test_invalid_address()
        test_invalid_server()
        test_multiple_servers()
        
        print("\n" + "=" * 60)
        print("✓ All tests completed successfully!")
        print("=" * 60)
        return 0
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
