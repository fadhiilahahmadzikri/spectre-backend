
import asyncio
import sys
from pathlib import Path

# Add src to sys.path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from spectre.config import get_settings
from spectre.infrastructure.email.smtp_mailer import SMTPMailer

async def verify_smtp():
    print("--- SMTP Infrastructure Audit ---")
    settings = get_settings()
    
    # Test Scenarios
    scenarios = [
        {"host": settings.smtp_host, "port": 587, "use_tls": False, "desc": "Port 587 (Explicit STARTTLS)"},
        {"host": settings.smtp_host, "port": 465, "use_tls": True, "desc": "Port 465 (Implicit TLS)"},
    ]
    
    for sc in scenarios:
        print(f"\n>>> Testing Scenario: {sc['desc']}")
        print(f"Host: {sc['host']}, Port: {sc['port']}, use_tls: {sc['use_tls']}")
        
        try:
            import aiosmtplib
            smtp = aiosmtplib.SMTP(
                hostname=sc['host'],
                port=sc['port'],
                use_tls=sc['use_tls']
            )
            await smtp.connect()
            print("[PASS] Connection successful.")
            
            print("Attempting login...")
            await smtp.login(settings.smtp_username, settings.smtp_password)
            print("[PASS] Login successful.")
            
            await smtp.quit()
            print(f"[SUCCESS] {sc['desc']} works with these credentials.")
            return # Stop after first success
            
        except Exception as e:
            print(f"[FAIL] {sc['desc']} failed: {str(e)}")

    print("\n[CRITICAL] All SMTP scenarios failed.")
    print("Check if you are using a GMAIL APP PASSWORD (16 chars) instead of your regular password.")


if __name__ == "__main__":
    asyncio.run(verify_smtp())
