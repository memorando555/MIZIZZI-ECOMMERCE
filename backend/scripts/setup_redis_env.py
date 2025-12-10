#!/usr/bin/env python3
"""
setup_redis_env.py - Helper script to set up Upstash Redis environment variables.

This script helps you configure the Upstash Redis environment variables
needed for the caching system to work properly.

Usage:
    python backend/scripts/setup_redis_env.py
    
What it does:
    1. Prompts for your Upstash credentials
    2. Tests the connection
    3. Optionally creates/updates your .env file
"""
import os
import sys

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)


def main():
    """Main setup function."""
    print("=" * 60)
    print("  Upstash Redis Setup for Mizizzi E-commerce")
    print("=" * 60)
    print()
    print("This script will help you set up Upstash Redis caching.")
    print()
    print("Get your credentials from: https://console.upstash.com/redis")
    print("Select your database 'mizizzi' and go to the 'REST' tab.")
    print()
    
    # Check if already set
    existing_url = os.environ.get('UPSTASH_REDIS_REST_URL')
    existing_token = os.environ.get('UPSTASH_REDIS_REST_TOKEN')
    
    if existing_url and existing_token:
        print(f"[INFO] Credentials already detected in environment:")
        print(f"  URL: {existing_url}")
        print(f"  Token: {'*' * 20} (hidden)")
        print()
        
        use_existing = input("Use existing credentials? (y/n): ").strip().lower()
        if use_existing == 'y':
            url, token = existing_url, existing_token
        else:
            url = input("Enter UPSTASH_REDIS_REST_URL: ").strip()
            token = input("Enter UPSTASH_REDIS_REST_TOKEN: ").strip()
    else:
        # Prompt for credentials
        print("Enter your Upstash credentials:")
        print()
        url = input("UPSTASH_REDIS_REST_URL (e.g., https://calm-marmot-36085.upstash.io): ").strip()
        token = input("UPSTASH_REDIS_REST_TOKEN: ").strip()
    
    if not url or not token:
        print("\n[ERROR] Both URL and token are required!")
        return False
    
    # Set environment variables for this session
    os.environ['UPSTASH_REDIS_REST_URL'] = url
    os.environ['UPSTASH_REDIS_REST_TOKEN'] = token
    
    # Test connection
    print()
    print("Testing connection...")
    print()
    
    try:
        from upstash_redis import Redis as UpstashRedis
        
        client = UpstashRedis(url=url, token=token)
        response = client.ping()
        
        if response:
            print("[OK] Successfully connected to Upstash Redis!")
            
            # Test basic operations
            client.set("mizizzi:test:setup", "success", ex=60)
            value = client.get("mizizzi:test:setup")
            client.delete("mizizzi:test:setup")
            
            if value == "success":
                print("[OK] Read/write operations working correctly")
            else:
                print("[WARNING] Read/write test returned unexpected value")
        else:
            print("[ERROR] Ping failed - check your credentials")
            return False
            
    except ImportError:
        print("[ERROR] upstash-redis package not installed")
        print("Install with: pip install upstash-redis")
        return False
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False
    
    # Offer to update .env file
    print()
    env_file = os.path.join(backend_dir, '.env')
    
    update_env = input(f"Update {env_file}? (y/n): ").strip().lower()
    
    if update_env == 'y':
        try:
            # Read existing content
            existing_content = ""
            if os.path.exists(env_file):
                with open(env_file, 'r') as f:
                    existing_content = f.read()
            
            # Update or add variables
            lines = existing_content.split('\n') if existing_content else []
            url_found = False
            token_found = False
            
            for i, line in enumerate(lines):
                if line.startswith('UPSTASH_REDIS_REST_URL='):
                    lines[i] = f'UPSTASH_REDIS_REST_URL={url}'
                    url_found = True
                elif line.startswith('UPSTASH_REDIS_REST_TOKEN='):
                    lines[i] = f'UPSTASH_REDIS_REST_TOKEN={token}'
                    token_found = True
            
            if not url_found:
                lines.append(f'UPSTASH_REDIS_REST_URL={url}')
            if not token_found:
                lines.append(f'UPSTASH_REDIS_REST_TOKEN={token}')
            
            # Write back
            with open(env_file, 'w') as f:
                f.write('\n'.join(lines))
            
            print(f"[OK] Updated {env_file}")
            
        except Exception as e:
            print(f"[ERROR] Could not update .env file: {e}")
    
    # Print export commands
    print()
    print("=" * 60)
    print("  Setup Complete!")
    print("=" * 60)
    print()
    print("To set these variables in your current terminal session:")
    print()
    print(f"  export UPSTASH_REDIS_REST_URL='{url}'")
    print(f"  export UPSTASH_REDIS_REST_TOKEN='{token}'")
    print()
    print("Or add them to your shell profile (~/.bashrc or ~/.zshrc).")
    print()
    print("Then restart your Flask server to enable caching.")
    print()
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
