import { neon } from '@neondatabase/serverless'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const neonUrl = 
  process.env.DATABASE_URL || 
  process.env.real_estate_DATABASE_URL || 
  process.env.POSTGRES_URL ||
  process.env.real_estate_POSTGRES_URL

const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!neonUrl) {
  throw new Error('No Neon database URL found. Please set DATABASE_URL or real_estate_DATABASE_URL')
}

if (!supabaseUrl) {
  throw new Error('No Supabase URL found. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseKey) {
  throw new Error('No Supabase service role key found. Please set SUPABASE_SERVICE_ROLE_KEY')
}

console.log('Using Neon URL:', neonUrl.substring(0, 30) + '...')
console.log('Using Supabase URL:', supabaseUrl)

const neonSql = neon(neonUrl)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function migrateData() {
  console.log('Starting migration from Neon to Supabase...')

  try {
    
    // 1. Migrate Countries
    console.log('Migrating countries...')
    const countries = await neonSql`SELECT * FROM "Country"`
    for (const country of countries) {
      await supabase.from('Country').upsert(country)
    }
    console.log(`✓ Migrated ${countries.length} countries`)

    // 2. Migrate Provinces
    console.log('Migrating provinces...')
    const provinces = await neonSql`SELECT * FROM "Province"`
    for (const province of provinces) {
      await supabase.from('Province').upsert(province)
    }
    console.log(`✓ Migrated ${provinces.length} provinces`)

    // 3. Migrate Cities
    console.log('Migrating cities...')
    const cities = await neonSql`SELECT * FROM "City"`
    for (const city of cities) {
      await supabase.from('City').upsert(city)
    }
    console.log(`✓ Migrated ${cities.length} cities`)

    // 4. Migrate Neighborhoods
    console.log('Migrating neighborhoods...')
    const neighborhoods = await neonSql`SELECT * FROM "Neighborhood"`
    for (const neighborhood of neighborhoods) {
      await supabase.from('Neighborhood').upsert(neighborhood)
    }
    console.log(`✓ Migrated ${neighborhoods.length} neighborhoods`)

    // 5. Migrate Property Types
    console.log('Migrating property types...')
    const propertyTypes = await neonSql`SELECT * FROM "PropertyType"`
    for (const type of propertyTypes) {
      await supabase.from('PropertyType').upsert(type)
    }
    console.log(`✓ Migrated ${propertyTypes.length} property types`)

    // 6. Migrate Users
    console.log('Migrating users...')
    const users = await neonSql`SELECT * FROM "User"`
    for (const user of users) {
      await supabase.from('User').upsert(user)
    }
    console.log(`✓ Migrated ${users.length} users`)

    // 7. Migrate Owners
    console.log('Migrating owners...')
    const owners = await neonSql`SELECT * FROM "Owner"`
    for (const owner of owners) {
      await supabase.from('Owner').upsert(owner)
    }
    console.log(`✓ Migrated ${owners.length} owners`)

    // 8. Migrate Clients
    console.log('Migrating clients...')
    const clients = await neonSql`SELECT * FROM "Client"`
    for (const client of clients) {
      await supabase.from('Client').upsert(client)
    }
    console.log(`✓ Migrated ${clients.length} clients`)

    // 9. Migrate Properties
    console.log('Migrating properties...')
    const properties = await neonSql`SELECT * FROM "Property"`
    for (const property of properties) {
      await supabase.from('Property').upsert(property)
    }
    console.log(`✓ Migrated ${properties.length} properties`)

    // 10. Migrate Appointments
    console.log('Migrating appointments...')
    const appointments = await neonSql`SELECT * FROM "Appointment"`
    for (const appointment of appointments) {
      await supabase.from('Appointment').upsert(appointment)
    }
    console.log(`✓ Migrated ${appointments.length} appointments`)

    console.log('\\n✓✓✓ Migration completed successfully! ✓✓✓')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

migrateData()
