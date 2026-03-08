import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

console.log('📋 Variables de entorno encontradas:')
console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No encontrada')
console.log('   SUPABASE_KEY:', supabaseKey ? '✅ Configurada' : '❌ No encontrada')
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
  console.log('🔍 Verificando schema REAL de Supabase...\n')

  // Test table names (lowercase vs PascalCase)
  const tableTests = [
    { name: 'users', displayName: 'users (lowercase)' },
    { name: 'User', displayName: 'User (PascalCase)' },
    { name: 'properties', displayName: 'properties (lowercase)' },
    { name: 'Property', displayName: 'Property (PascalCase)' },
    { name: 'owners', displayName: 'owners (lowercase)' },
    { name: 'Owner', displayName: 'Owner (PascalCase)' },
  ]

  console.log('📊 PRUEBA 1: Nombres de tablas\n')
  for (const table of tableTests) {
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ ${table.displayName}: NO existe`)
      console.log(`   Error: ${error.message}\n`)
    } else {
      console.log(`✅ ${table.displayName}: EXISTE ✅`)
      if (data && data.length > 0) {
        console.log(`   Columnas: ${Object.keys(data[0]).join(', ')}\n`)
      } else {
        console.log(`   (Tabla vacía)\n`)
      }
    }
  }

  // Test column names on users table
  console.log('\n📊 PRUEBA 2: Nombres de columnas\n')
  
  const columnTests = [
    { table: 'users', column: 'is_active', displayName: 'users.is_active (snake_case)' },
    { table: 'users', column: 'isActive', displayName: 'users.isActive (camelCase)' },
    { table: 'User', column: 'is_active', displayName: 'User.is_active (snake_case)' },
    { table: 'User', column: 'isActive', displayName: 'User.isActive (camelCase)' },
  ]

  for (const test of columnTests) {
    const { data, error } = await supabase
      .from(test.table)
      .select(test.column)
      .limit(1)

    if (error) {
      console.log(`❌ ${test.displayName}: NO funciona - ${error.message}`)
    } else {
      console.log(`✅ ${test.displayName}: FUNCIONA ✅`)
    }
  }

  console.log('\n✅ Verificación completada!\n')
  console.log('📝 CONCLUSIÓN: Usa los nombres marcados con ✅ en tu código.')
}

verifySchema().catch((err) => {
  console.error('❌ Error ejecutando verificación:', err)
  process.exit(1)
})
