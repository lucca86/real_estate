import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Checking available tables in Supabase...\n')
  
  // Try different table name variations
  const tableVariations = [
    'User', 'users', 
    'Property', 'properties',
    'Owner', 'owners',
    'Client', 'clients'
  ]
  
  for (const tableName of tableVariations) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Table "${tableName}" - NOT FOUND`)
      console.log(`   Error: ${error.message}\n`)
    } else {
      console.log(`✅ Table "${tableName}" - EXISTS!`)
      if (data && data.length > 0) {
        console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`)
      }
      console.log('')
    }
  }
}

checkTables()
