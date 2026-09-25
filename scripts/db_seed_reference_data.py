#!/usr/bin/env python3
"""
Torob Reference Data Seed Script
Populates reference data tables (static_data, airlines, providers)
from JSON datasets (misc/airports.json, misc/airlines_complete.json).
Usage:
    python scripts/db_seed_reference_data.py --airports-file misc/airports.json --airlines-file misc/airlines_complete.json
"""

import os
import sys
import json
import argparse
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "data" / "torob.sqlite"
DEFAULT_AIRPORTS_FILE = BASE_DIR / "misc" / "airports.json"
DEFAULT_AIRLINES_FILE = BASE_DIR / "misc" / "airlines_complete.json"

def seed_providers(cursor):
    providers = [
        (1, "alibaba", "Alibaba (علی‌بابا)", "external", "https://alibaba.ir", 1),
        (2, "flytoday", "FlyToday (فلای‌تودی)", "external", "https://flytoday.ir", 1),
        (3, "safarmarket", "SafarMarket (سفرمارکت)", "external", "https://safarmarket.com", 1),
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO providers (id, code, name, provider_type, base_url, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    """, providers)
    print(f"[+] Seeded {len(providers)} providers (alibaba, flytoday, safarmarket)")

def seed_airports(cursor, file_path):
    if not os.path.exists(file_path):
        print(f"[-] Airports file not found: {file_path}")
        return 0

    print(f"[*] Reading airports from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    for item in data:
        iata = (item.get("iata_code") or "").strip().upper()
        if not iata:
            continue
        icao = (item.get("icao_code") or "")[:4]
        apt_name = item.get("name_en") or item.get("name_fa") or iata
        city_name = item.get("city_en") or item.get("city_fa") or apt_name
        country_code = (item.get("country_code") or "IR")[:2].upper()
        country_name = item.get("country_en") or item.get("country_fa") or ""
        name_fa = item.get("name_fa") or ""
        city_fa = item.get("city_fa") or ""
        country_fa = item.get("country_fa") or ""
        lat = item.get("lat")
        lon = item.get("lon")

        rows.append((
            iata, icao, apt_name, city_name, country_code, country_name,
            name_fa, city_fa, country_fa, lat, lon
        ))

    cursor.executemany("""
        INSERT OR REPLACE INTO static_data (
            iata_code, icao_code, airport_name, city_name, country_code,
            country_name, name_fa, city_fa, country_fa, lat, lon
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    print(f"[+] Successfully seeded {len(rows)} airports into static_data!")
    return len(rows)

def seed_airlines(cursor, file_path):
    if not os.path.exists(file_path):
        print(f"[-] Airlines file not found: {file_path}")
        return 0

    print(f"[*] Reading airlines from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    for item in data:
        aid = item.get("id")
        iata = (item.get("iata") or "")[:3].strip().upper()
        icao = (item.get("icao") or "")[:4].strip().upper()
        name_en = item.get("name_en") or item.get("name_fa") or "Unknown"
        name_fa = item.get("name_fa") or ""
        country_code = (item.get("country_code") or "")[:4]
        country_name = item.get("country_en") or item.get("country_fa") or ""
        callsign = item.get("callsign") or ""
        active = 1 if item.get("active", True) else 0

        rows.append((aid, iata, icao, name_en, name_fa, country_code, country_name, callsign, active))

    cursor.executemany("""
        INSERT OR REPLACE INTO airlines (
            id, iata_code, icao_code, name, name_fa, country_code,
            country_name, callsign, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    print(f"[+] Successfully seeded {len(rows)} airlines into airlines table!")
    return len(rows)

def main():
    parser = argparse.ArgumentParser(description="Seed Torob Reference Data")
    parser.add_argument("--airports-file", default=str(DEFAULT_AIRPORTS_FILE), help="Path to airports.json")
    parser.add_argument("--airlines-file", default=str(DEFAULT_AIRLINES_FILE), help="Path to airlines_complete.json")
    args = parser.parse_args()

    # Ensure DB exists
    if not os.path.exists(DB_FILE):
        print("[!] DB file does not exist, running bootstrap first...")
        from db_bootstrap import bootstrap_database
        bootstrap_database()

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    seed_providers(cursor)
    airports_count = seed_airports(cursor, args.airports_file)
    airlines_count = seed_airlines(cursor, args.airlines_file)

    conn.commit()
    conn.close()

    print("========================================")
    print(f"[✓] REFERENCE DATA SEEDING COMPLETE!")
    print(f"    - static_data (Airports): {airports_count} records")
    print(f"    - airlines:               {airlines_count} records")
    print(f"    - providers:              3 records (Alibaba, FlyToday, SafarMarket)")
    print("========================================")

if __name__ == "__main__":
    main()
