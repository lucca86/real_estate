import { writeFileSync, mkdirSync, existsSync } from "fs"

const destDir = "/public/leaflet"

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true })
}

const BASE = "https://unpkg.com/leaflet@1.9.4/dist/images"
const icons = ["marker-icon.png", "marker-icon-2x.png", "marker-shadow.png"]

for (const icon of icons) {
  const url = `${BASE}/${icon}`
  const dest = resolve(destDir, icon)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  writeFileSync(dest, buffer)
  console.log(`Downloaded: ${icon} (${buffer.length} bytes)`)
}

console.log("Done — Leaflet icons saved to /public/leaflet/")
