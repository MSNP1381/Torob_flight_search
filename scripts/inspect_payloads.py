import json
import urllib.request

proxy_url = "http://127.0.0.1:2080"
proxy_handler = urllib.request.ProxyHandler({'http': proxy_url, 'https': proxy_url})
opener = urllib.request.build_opener(proxy_handler)

def inspect_flytoday():
    url = "https://www.flytoday.ir/api/gateway/V1/flight/search"
    payload = {
        "pricingSourceType": 0,
        "adultCount": 1,
        "childCount": 0,
        "infantCount": 0,
        "travelPreference": { "cabinType": "Y", "maxStopsQuantity": "All", "airTripType": "OneWay" },
        "originDestinationInformations": [
            { "departureDateTime": "2026-09-26T00:00:00", "destinationLocationCode": "MHD", "destinationType": "City", "originLocationCode": "THR", "originType": "City" }
        ],
        "isJalali": False
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json",
        "Origin": "https://www.flytoday.ir",
        "Referer": "https://www.flytoday.ir/"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    with opener.open(req, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        itins = data.get("pricedItineraries", [])
        if itins:
            print("FlyToday Sample item keys:", list(itins[0].keys()))
            print("FlyToday Sample airItineraryPricingInfo:", json.dumps(itins[0].get("airItineraryPricingInfo"), indent=2))
            print("FlyToday Sample flightSegments:", json.dumps(itins[0].get("originDestinationOptions", [{}])[0].get("flightSegments"), indent=2))

def inspect_safarmarket():
    url = "https://safarmarket.com/api/flight/v3/search"
    payload = {
        "platform": "WEB_DESKTOP",
        "uid": "",
        "limit": 5,
        "compress": False,
        "productType": "LFLI",
        "searchValidity": 2,
        "cid": 1,
        "checksum": 1,
        "IPInfo": {},
        "searchFilter": {
            "sourceAirportCode": "THR",
            "targetAirportCode": "MHD",
            "sourceIsCity": True,
            "targetIsCity": True,
            "leaveDate": "2026-09-26",
            "returnDate": "",
            "adultCount": 1,
            "childCount": 0,
            "infantCount": 0,
            "economy": True,
            "business": True,
            "maxStopsQuantity": "All",
            "isJalali": False
        }
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json",
        "Origin": "https://safarmarket.com",
        "Referer": "https://safarmarket.com/"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    with opener.open(req, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        flights = data.get("result", {}).get("flights", [])
        if flights:
            print("\nSafarMarket Sample item keys:", list(flights[0].keys()))
            print("SafarMarket Sample flight:", json.dumps(flights[0], indent=2, ensure_ascii=False))

inspect_flytoday()
inspect_safarmarket()
