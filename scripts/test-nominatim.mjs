// Test what Nominatim actually returns for Corrientes addresses
const BASE = "https://nominatim.openstreetmap.org/search?format=json&limit=10&countrycodes=ar&addressdetails=1"
const HEADERS = { "User-Agent": "GestionInmobiliariaRE/1.0" }

async function test(label, url) {
  console.log(`\n=== ${label} ===`)
  console.log("URL:", url)
  const res = await fetch(url, { headers: HEADERS })
  const data = await res.json()
  if (!data.length) {
    console.log("NO RESULTS")
    return
  }
  data.forEach((r, i) => {
    const a = r.address || {}
    console.log(`[${i}] lat=${r.lat} lon=${r.lon} type=${r.type} importance=${r.importance?.toFixed(3)}`)
    console.log(`     display_name=${r.display_name}`)
    console.log(`     addr.city="${a.city}" addr.town="${a.town}" addr.municipality="${a.municipality}" addr.village="${a.village}" addr.suburb="${a.suburb}" addr.county="${a.county}" addr.state="${a.state}"`)
  })
}

// Strategy 1: structured params
const params1 = new URLSearchParams({ street: "Uruguay 355", city: "Corrientes", state: "Corrientes", country: "Argentina" })
await test("Structured: street+city+state", `${BASE}&${params1}`)

await new Promise(r => setTimeout(r, 1000))

// Strategy 2: free text full
const q2 = encodeURIComponent("Uruguay 355, Corrientes, Corrientes, Argentina")
await test("Free text: street+city+state+country", `${BASE}&q=${q2}`)

await new Promise(r => setTimeout(r, 1000))

// Strategy 3: free text city only
const q3 = encodeURIComponent("Uruguay 355, Corrientes, Argentina")
await test("Free text: street+city+country", `${BASE}&q=${q3}`)
