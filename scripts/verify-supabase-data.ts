import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyData() {
  console.log('🔍 Verifying data in Supabase...\n')

  // Check countries
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('*')
  
  console.log(`Countries: ${countries?.length || 0} records`)
  if (countriesError) console.error('Error:', countriesError)
  else console.log(countries)

  // Check property_types
  const { data: propertyTypes, error: typesError } = await supabase
    .from('property_types')
    .select('*')
  
  console.log(`\nProperty Types: ${propertyTypes?.length || 0} records`)
  if (typesError) console.error('Error:', typesError)
  else console.log(propertyTypes)

  // Check users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
  
  console.log(`\nUsers: ${users?.length || 0} records`)
  if (usersError) console.error('Error:', usersError)
  else console.log(users)

  // Check owners
  const { data: owners, error: ownersError } = await supabase
    .from('owners')
    .select('*')
  
  console.log(`\nOwners: ${owners?.length || 0} records`)
  if (ownersError) console.error('Error:', ownersError)

  // Check clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
  
  console.log(`\nClients: ${clients?.length || 0} records`)
  if (clientsError) console.error('Error:', clientsError)

  // Check properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
  
  console.log(`\nProperties: ${properties?.length || 0} records`)
  if (propertiesError) console.error('Error:', propertiesError)

  console.log('\n✅ Verification complete!')
}

verifyData()
