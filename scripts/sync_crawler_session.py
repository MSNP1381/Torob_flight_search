#!/usr/bin/env python3
"""
Torob Crawler Session Sync Helper
Sends generated browser cookies, headers, and session tokens from local dev environment
or residential proxy machine to the Torob cloud backend / Firestore database.
Supports Iran proxy binding and automatic credential refresh.
"""

import sys
import json
import argparse
import urllib.request
import urllib.error

def sync_session(api_url: str, site_name: str, cookies: str, proxy_binding: str = "http://5.160.201.213:8080 (Iran)", session_id: str = None):
    endpoint = f"{api_url.rstrip('/')}/api/v1/integrations/sync-session"
    payload = {
        "site_name": site_name.lower(),
        "cookies": cookies,
        "proxy_binding": proxy_binding,
        "session_id": session_id or f"sess_{site_name}_{int(__import__('time').time())}",
        "status": "active"
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"✅ Successfully synced {site_name} session to Torob backend:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return True
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        print(f"❌ Failed to sync: {str(e)}")
        return False

def auto_refresh_all(api_url: str, site_name: str = None):
    endpoint = f"{api_url.rstrip('/')}/api/v1/integrations/auto-refresh-session"
    payload = {"provider": site_name} if site_name else {}
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("✅ Successfully triggered automatic session & Iran proxy credential refresh:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return True
    except Exception as e:
        print(f"❌ Failed to auto refresh: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Sync crawler session cookies to Torob cloud backend")
    parser.add_argument("--url", default="http://localhost:3000", help="Torob API base URL")
    parser.add_argument("--site", choices=["alibaba", "flytoday", "safarmarket"], help="Provider site name")
    parser.add_argument("--cookies", help="Cookie header string or JSON file path with cookies")
    parser.add_argument("--proxy", default="http://5.160.201.213:8080 (Iran)", help="Assigned residential or datacenter Iran proxy")
    parser.add_argument("--session-id", default=None, help="Optional session identifier")
    parser.add_argument("--auto-refresh", action="store_true", help="Auto refresh credentials via Iran proxy pool")

    args = parser.parse_args()

    if args.auto_refresh:
        auto_refresh_all(api_url=args.url, site_name=args.site)
        return

    if not args.site or not args.cookies:
        print("❌ Error: Both --site and --cookies are required (unless using --auto-refresh)")
        parser.print_help()
        sys.exit(1)

    cookies_content = args.cookies
    try:
        with open(args.cookies, "r", encoding="utf-8") as f:
            cookies_content = f.read().strip()
    except Exception:
        pass

    sync_session(
        api_url=args.url,
        site_name=args.site,
        cookies=cookies_content,
        proxy_binding=args.proxy,
        session_id=args.session_id
    )

if __name__ == "__main__":
    main()
