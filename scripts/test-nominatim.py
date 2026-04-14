import urllib.request
import json

headers = {"User-Agent": "GestionInmobiliariaRE/1.0"}
base = "https://nominatim.openstreetmap.org/search?format=json&limit=10&countrycodes=ar&addressdetails=1"

tests = [
    # Structured
    f"{base}&street=Uruguay+355&city=Corrientes&state=Corrientes&country=Argentina",
    # Free text full
    f"{base}&q=Uruguay+355,+Corrientes,+Corrientes,+Argentina",
]

for url in tests:
    print(f"\n--- URL: {url[:120]}...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    print(f"Total results: {len(data)}")
    for i, r in enumerate(data[:5]):
        addr = r.get("address", {})
        city_field = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or "N/A"
        state_field = addr.get("state", "N/A")
        print(f"  [{i}] lat={r['lat']} lon={r['lon']}")
        print(f"       type={r.get('type')} class={r.get('class')}")
        print(f"       addr.city/town={city_field} | addr.state={state_field}")
        print(f"       display={r['display_name'][:80]}")
