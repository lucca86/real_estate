import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("[v0] Starting location seed...")

  // Create Argentina
  const argentina = await prisma.country.upsert({
    where: { code: "AR" },
    update: {},
    create: {
      name: "Argentina",
      code: "AR",
      isActive: true,
    },
  })

  console.log("[v0] Created country:", argentina.name)

  // Create Corrientes Province
  const corrientes = await prisma.province.upsert({
    where: {
      name_countryId: {
        name: "Corrientes",
        countryId: argentina.id,
      },
    },
    update: {},
    create: {
      name: "Corrientes",
      countryId: argentina.id,
      isActive: true,
    },
  })

  console.log("[v0] Created province:", corrientes.name)

  // Corrientes cities (top 15 most populated)
  const corrientesCities = [
    "Corrientes",
    "Goya",
    "Paso de los Libres",
    "Curuzú Cuatiá",
    "Mercedes",
    "Bella Vista",
    "Esquina",
    "Santo Tomé",
    "Monte Caseros",
    "Ituzaingó",
    "Saladas",
    "Alvear",
    "Sauce",
    "Empedrado",
    "San Luis del Palmar",
  ]

  for (const cityName of corrientesCities) {
    await prisma.city.upsert({
      where: {
        name_provinceId: {
          name: cityName,
          provinceId: corrientes.id,
        },
      },
      update: {},
      create: {
        name: cityName,
        provinceId: corrientes.id,
        isActive: true,
      },
    })
  }

  console.log(`[v0] Created ${corrientesCities.length} cities for Corrientes`)

  // Create Chaco Province
  const chaco = await prisma.province.upsert({
    where: {
      name_countryId: {
        name: "Chaco",
        countryId: argentina.id,
      },
    },
    update: {},
    create: {
      name: "Chaco",
      countryId: argentina.id,
      isActive: true,
    },
  })

  console.log("[v0] Created province:", chaco.name)

  // Chaco cities (main cities)
  const chacoCities = [
    "Resistencia",
    "Presidencia Roque Sáenz Peña",
    "Villa Ángela",
    "Charata",
    "General San Martín",
    "Quitilipi",
    "Las Breñas",
    "Machagai",
    "Juan José Castelli",
    "General Pinedo",
    "Fontana",
    "Barranqueras",
    "Puerto Vilelas",
    "Puerto Tirol",
    "Presidencia de la Plaza",
    "Tres Isletas",
    "Pampa del Infierno",
    "Corzuela",
    "Hermoso Campo",
    "La Leonesa",
  ]

  for (const cityName of chacoCities) {
    await prisma.city.upsert({
      where: {
        name_provinceId: {
          name: cityName,
          provinceId: chaco.id,
        },
      },
      update: {},
      create: {
        name: cityName,
        provinceId: chaco.id,
        isActive: true,
      },
    })
  }

  console.log(`[v0] Created ${chacoCities.length} cities for Chaco`)

  // Create some neighborhoods for Corrientes capital
  const corrientesCity = await prisma.city.findFirst({
    where: {
      name: "Corrientes",
      provinceId: corrientes.id,
    },
  })

  if (corrientesCity) {
    const corrientesNeighborhoods = [
      "Centro",
      "San Benito",
      "Yapeyú",
      "Laguna Brava",
      "Quinta Ferré",
      "Molina Punta",
      "Berón de Astrada",
      "Pirayuí",
      "Arazá",
      "Laguna Seca",
    ]

    for (const neighborhoodName of corrientesNeighborhoods) {
      await prisma.neighborhood.upsert({
        where: {
          name_cityId: {
            name: neighborhoodName,
            cityId: corrientesCity.id,
          },
        },
        update: {},
        create: {
          name: neighborhoodName,
          cityId: corrientesCity.id,
          isActive: true,
        },
      })
    }

    console.log(`[v0] Created ${corrientesNeighborhoods.length} neighborhoods for Corrientes city`)
  }

  // Create some neighborhoods for Resistencia
  const resistenciaCity = await prisma.city.findFirst({
    where: {
      name: "Resistencia",
      provinceId: chaco.id,
    },
  })

  if (resistenciaCity) {
    const resistenciaNeighborhoods = [
      "Centro",
      "Villa Don Andrés",
      "Villa Río Negro",
      "Villa Libertad",
      "Villa Facundo",
      "Villa Prosperidad",
      "Villa San Martín",
      "Barrio Güemes",
      "Barrio Toba",
      "Villa Forestación",
    ]

    for (const neighborhoodName of resistenciaNeighborhoods) {
      await prisma.neighborhood.upsert({
        where: {
          name_cityId: {
            name: neighborhoodName,
            cityId: resistenciaCity.id,
          },
        },
        update: {},
        create: {
          name: neighborhoodName,
          cityId: resistenciaCity.id,
          isActive: true,
        },
      })
    }

    console.log(`[v0] Created ${resistenciaNeighborhoods.length} neighborhoods for Resistencia`)
  }

  console.log("[v0] Location seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("[v0] Error seeding locations:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
