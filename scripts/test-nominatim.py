import urllib.request
import json

headers = {"User-Agent": "GestionInmobiliariaRE/1.0"}

def fetch(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

base = "https://apis.datos.gob.ar/georef/api"

# Test GeoJSON format for street geometry
print("=== formato=geojson para URUGUAY en Capital, Corrientes ===")
url = f"{base}/calles?nombre=Uruguay&provincia=Corrientes&departamento=Capital&max=1"
print(f"URL: {url}")
try:
    data = fetch(url)
    calles2 = data.get("calles", [])
    if calles2:
        calle = calles2[0]
        # altura is NESTED: altura.inicio.derecha
        alt = calle.get("altura", {})
        alt_inicio = alt.get("inicio", {}).get("derecha", 0)
        alt_fin = alt.get("fin", {}).get("derecha", alt_inicio)
        numero = 355
        clamped = max(alt_inicio, min(alt_fin, numero))
        print(f"\n  alt_inicio={alt_inicio} alt_fin={alt_fin} numero={numero} → clamped={clamped}")
        
        url2 = f"{base}/direcciones?direccion=Uruguay+{clamped}&provincia=Corrientes&departamento=Capital&max=5"
        print(f"\n=== /direcciones con número clampeado {clamped} ===")
        print(f"URL: {url2}")
        try:
            data2 = fetch(url2)
            dirs = data2.get("direcciones", [])
            print(f"  {len(dirs)} resultados")
            for r in dirs:
                ub = r.get("ubicacion", {})
                loc = r.get("localidad", r.get("localidad_censal", {}))
                print(f"  nomenclatura={r.get('nomenclatura','?')}")
                print(f"  localidad={loc.get('nombre','?')} lat={ub.get('lat')} lon={ub.get('lon')}")
        except Exception as e:
            print(f"  ERROR: {e}")
except Exception as e:
    print(f"  ERROR: {e}")
