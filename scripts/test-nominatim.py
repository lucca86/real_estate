import urllib.request
import json

headers = {"User-Agent": "GestionInmobiliariaRE/1.0"}

def fetch(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# Test 1: Nominatim searching just the city centroid
print("=== Nominatim: ciudad capital Corrientes (centroide) ===")
url = "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=Corrientes,+Corrientes,+Argentina&countrycodes=ar"
data = fetch(url)
for i, r in enumerate(data[:5]):
    addr = r.get("address", {})
    print(f"  [{i}] lat={r['lat']} lon={r['lon']} type={r.get('type')}")
    print(f"       display={r['display_name'][:100]}")

# Test 2: GeoRef localidades - find the centroid of city Corrientes Capital
print("\n=== GeoRef: localidades de Corrientes ===")
url2 = "https://apis.datos.gob.ar/georef/api/localidades?nombre=Corrientes&provincia=Corrientes&max=5&campos=completo"
data2 = fetch(url2)
locs = data2.get("localidades", [])
for i, r in enumerate(locs):
    ub = r.get("centroide", {})
    print(f"  [{i}] lat={ub.get('lat')} lon={ub.get('lon')}")
    print(f"       nombre={r.get('nombre')} | prov={r.get('provincia',{}).get('nombre')}")
