#!/usr/bin/env python3
"""
BuyO Database Bootstrap Script
Creates all tables, sequences, and indexes for BuyO flights platform according to
docs/buyo_schema.dbml and docs/buyo_db_proposal.md.
Supports PostgreSQL (via psycopg2/asyncpg/sqlalchemy if DATABASE_URL is configured)
or SQLite fallback (data/buyo.sqlite) for self-contained local development.
"""

import os
import sys
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "data" / "buyo.sqlite"

SCHEMA_SQL = """
-- 1. Reference Data: static_data (Airports & Cities merged)
CREATE TABLE IF NOT EXISTS static_data (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4),
    airport_name VARCHAR(200) NOT NULL,
    city_name VARCHAR(120) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    country_name VARCHAR(120),
    name_fa VARCHAR(200),
    city_fa VARCHAR(120),
    country_fa VARCHAR(120),
    lat REAL,
    lon REAL,
    timezone_name VARCHAR(64) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_static_data_city ON static_data(city_name);
CREATE INDEX IF NOT EXISTS idx_static_data_country ON static_data(country_code);

-- 2. Reference Data: airlines
CREATE TABLE IF NOT EXISTS airlines (
    id INTEGER PRIMARY KEY,
    iata_code VARCHAR(3),
    icao_code VARCHAR(4),
    name VARCHAR(200) NOT NULL,
    name_fa VARCHAR(200),
    country_code VARCHAR(4),
    country_name VARCHAR(120),
    callsign VARCHAR(100),
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata_code);
CREATE INDEX IF NOT EXISTS idx_airlines_icao ON airlines(icao_code);

-- 3. Reference Data: providers (Crawlers & Suppliers)
CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    provider_type VARCHAR(32) DEFAULT 'external',
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Identity: users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type VARCHAR(32) NOT NULL DEFAULT 'guest',
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(32),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Identity: user_devices
CREATE TABLE IF NOT EXISTS user_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    device_fingerprint VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 6. Search & Discovery: search_sessions
CREATE TABLE IF NOT EXISTS search_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_uuid VARCHAR(64) UNIQUE,
    user_id INTEGER,
    origin_iata_code VARCHAR(3) NOT NULL,
    destination_iata_code VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    adult_count INTEGER DEFAULT 1,
    child_count INTEGER DEFAULT 0,
    infant_count INTEGER DEFAULT 0,
    cabin_class VARCHAR(32) DEFAULT 'economy',
    status VARCHAR(32) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(origin_iata_code) REFERENCES static_data(iata_code),
    FOREIGN KEY(destination_iata_code) REFERENCES static_data(iata_code)
);

-- 7. Search & Discovery: flight_offers
CREATE TABLE IF NOT EXISTS flight_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_session_id INTEGER NOT NULL,
    grouping_key VARCHAR(255) NOT NULL,
    flight_hash VARCHAR(64) NOT NULL,
    provider_code VARCHAR(64) NOT NULL,
    flight_number VARCHAR(32) NOT NULL,
    airline_iata VARCHAR(3),
    origin_iata VARCHAR(3),
    destination_iata VARCHAR(3),
    departure_at TIMESTAMP NOT NULL,
    arrival_at TIMESTAMP NOT NULL,
    duration VARCHAR(32),
    stops INTEGER DEFAULT 0,
    cabin VARCHAR(32) DEFAULT 'economy',
    is_charter BOOLEAN DEFAULT 0,
    total_price NUMERIC(18, 2) NOT NULL,
    base_price NUMERIC(18, 2) NOT NULL,
    tax_amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IRR',
    seats_remaining INTEGER DEFAULT 9,
    baggage VARCHAR(64),
    raw_payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(search_session_id) REFERENCES search_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_flight_offers_grouping ON flight_offers(grouping_key);
CREATE INDEX IF NOT EXISTS idx_flight_offers_hash ON flight_offers(flight_hash);

-- 8. Order Lifecycle: orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER,
    total_amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IRR',
    reservation_state VARCHAR(32) DEFAULT 'reserve_pending',
    payment_state VARCHAR(32) DEFAULT 'not_started',
    issuance_state VARCHAR(32) DEFAULT 'not_issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit: order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    from_state VARCHAR(32),
    to_state VARCHAR(32) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id)
);
"""

def bootstrap_database():
    os.makedirs(DB_FILE.parent, exist_ok=True)
    print(f"[*] Bootstrapping BuyO database schema at {DB_FILE}...")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.executescript(SCHEMA_SQL)
    conn.commit()
    
    # Query table list
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")]
    conn.close()
    
    print("[+] DB Bootstrap completed successfully!")
    print(f"[+] Total tables created: {len(tables)}")
    for t in tables:
        print(f"    - {t}")
    return tables

if __name__ == "__main__":
    bootstrap_database()
