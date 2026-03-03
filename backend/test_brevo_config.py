#!/usr/bin/env python3
"""
Test script to diagnose Brevo email service issues.
Run this on your Render backend or locally to test Brevo configuration.
"""

import os
import requests
import sys

# Color codes for terminal output
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_status(status, message):
    """Print colored status messages"""
    if status == "ERROR":
        print(f"{RED}❌ {message}{RESET}")
    elif status == "SUCCESS":
        print(f"{GREEN}✅ {message}{RESET}")
    elif status == "WARNING":
        print(f"{YELLOW}⚠️ {message}{RESET}")
    elif status == "INFO":
        print(f"{BLUE}ℹ️ {message}{RESET}")

def test_brevo_configuration():
    """Test if Brevo is properly configured"""
    print(f"\n{BLUE}=== BREVO CONFIGURATION TEST ==={RESET}\n")
    
    # Check environment variables
    print("1. Checking environment variables...\n")
    
    brevo_api_key = os.environ.get('BREVO_API_KEY')
    brevo_sender_email = os.environ.get('BREVO_SENDER_EMAIL')
    brevo_sender_name = os.environ.get('BREVO_SENDER_NAME', 'MIZIZZI')
    
    if not brevo_api_key:
        print_status("ERROR", "BREVO_API_KEY not set in environment")
        return False
    else:
        print_status("SUCCESS", f"BREVO_API_KEY is set ({len(brevo_api_key)} chars)")
        print(f"  Last 10 chars: {brevo_api_key[-10:]}")
    
    if not brevo_sender_email:
        print_status("ERROR", "BREVO_SENDER_EMAIL not set in environment")
        return False
    else:
        print_status("SUCCESS", f"BREVO_SENDER_EMAIL: {brevo_sender_email}")
    
    print_status("SUCCESS", f"BREVO_SENDER_NAME: {brevo_sender_name}")
    
    # Test API key format
    print(f"\n2. Validating API key format...\n")
    
    if brevo_api_key.startswith('xkeysib-'):
        print_status("SUCCESS", "API key format looks correct (starts with 'xkeysib-')")
    else:
        print_status("WARNING", "API key doesn't start with 'xkeysib-' - may be incorrect")
    
    # Test email format
    print(f"\n3. Validating sender email format...\n")
    
    if '@' in brevo_sender_email and '.' in brevo_sender_email.split('@')[1]:
        print_status("SUCCESS", f"Email format is valid: {brevo_sender_email}")
    else:
        print_status("ERROR", f"Email format is invalid: {brevo_sender_email}")
        return False
    
    # Test API connectivity
    print(f"\n4. Testing Brevo API connectivity...\n")
    
    test_payload = {
        "sender": {
            "name": brevo_sender_name,
            "email": brevo_sender_email
        },
        "to": [{"email": "test@example.com"}],
        "subject": "MIZIZZI Test Email",
        "htmlContent": "<h1>Test</h1><p>This is a test email from MIZIZZI.</p>"
    }
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevo_api_key
    }
    
    try:
        print("Sending test request to Brevo API...")
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=test_payload,
            headers=headers,
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}\n")
        
        if response.status_code in [200, 201]:
            print_status("SUCCESS", "Brevo API accepted the test email!")
            try:
                data = response.json()
                if 'messageId' in data:
                    print(f"  Message ID: {data['messageId']}")
                print("\n✨ Your Brevo configuration is working correctly!")
                return True
            except:
                pass
        else:
            print_status("ERROR", f"Brevo API returned error {response.status_code}")
            
            try:
                error_data = response.json()
                print(f"\nError Response:")
                print(f"  {error_data}")
                
                # Provide specific troubleshooting tips
                if 'message' in error_data:
                    msg = error_data['message'].lower()
                    
                    if 'sender' in msg or 'from' in msg:
                        print_status("WARNING", "Issue with sender email:")
                        print(f"  • Verify '{brevo_sender_email}' is validated in Brevo")
                        print(f"  • Go to https://app.brevo.com/settings/senders")
                        print(f"  • Add the email if not present and verify it")
                    
                    elif 'api' in msg or 'key' in msg or 'unauthorized' in msg or '401' in msg:
                        print_status("WARNING", "Issue with API key:")
                        print(f"  • Check if API key is correct")
                        print(f"  • Verify API key hasn't been regenerated")
                        print(f"  • Go to https://app.brevo.com/account/api")
                    
                    elif 'invalid' in msg or 'malformed' in msg:
                        print_status("WARNING", "Invalid request format:")
                        print(f"  • Check email addresses are valid")
                        print(f"  • Verify API key format")
                    
            except:
                print(f"Response text: {response.text}")
            
            return False
    
    except requests.exceptions.ConnectionError as e:
        print_status("ERROR", f"Connection error: {str(e)}")
        print("  • Check your internet connection")
        print("  • Verify Brevo API is accessible from your server")
        return False
    
    except requests.exceptions.Timeout:
        print_status("ERROR", "Request timed out after 10 seconds")
        print("  • Brevo API may be slow or unreachable")
        return False
    
    except Exception as e:
        print_status("ERROR", f"Unexpected error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print(f"\n{BLUE}╔════════════════════════════════════════════╗{RESET}")
    print(f"{BLUE}║  MIZIZZI - Brevo Email Service Diagnostic  ║{RESET}")
    print(f"{BLUE}╚════════════════════════════════════════════╝{RESET}\n")
    
    success = test_brevo_configuration()
    
    if success:
        print(f"\n{GREEN}✅ All tests passed! Your Brevo setup is working.{RESET}\n")
        print("Next steps:")
        print("  1. Try resending verification email from your app")
        print("  2. Check user inbox for verification email")
        print("  3. Complete email verification")
        print("  4. Login should now work\n")
        return 0
    else:
        print(f"\n{RED}❌ Brevo configuration has issues. See details above.{RESET}\n")
        print("Next steps:")
        print("  1. Fix the issues identified above")
        print("  2. Update Render environment variables if needed")
        print("  3. Restart the Render service")
        print("  4. Run this test again\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
