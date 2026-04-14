import urllib.request
import json

headers = {"User-Agent": "GestionInmobiliariaRE/1.0"}

def fetch(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

base = "https://apis.datos.gob.ar/georef/api"

tests = [
    ("direcciones con provincia y max alto",
     f"{base}/direcciones?direccion=Uruguay+355&provincia=Corrientes&max=20"),
    ("calles Uruguay en Corrientes provincia",
     f"{base}/calles?nombre=Uruguay&provincia=Corrientes&max=10&campos=completo"),
    ("calles Uruguay localidad=Corrientes",
     f"{base}/calles?nombre=Uruguay&provincia=Corrientes&localidad=Corrientes&max=10&campos=completo"),
    ("calles Uruguay localidad=Capital",
     f"{base}/calles?nombre=Uruguay&provincia=Corrientes&localidad=Capital&max=10&campos=completo"),
]

for label, url in tests:
    print(f"\n=== {label} ===")
    try:
        data = fetch(url)
        for key, items in data.items():
            if not isinstance(items, list): continue
            print(f"  {key}: {len(items)} results")
            for i, r in enumerate(items[:5]):
                loc = r.get("localidad", r.get("localidad_censal", {}))
                ub  = r.get("ubicacion", r.get("centroide", {}))
                print(f"    [{i}] nombre={r.get('nombre','?')[:50]} | nomenclatura={r.get('nomenclatura','?')[:60]}")
                print(f"         localidad={loc.get('nombre','?')} | lat={ub.get('lat','?')} lon={ub.get('lon','?')}")
    except Exception as e:
        print(f"  ERROR: {e}")
