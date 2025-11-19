import { createClient } from '@supabase/supabase-js'

console.log('🔍 Verificando schema de Supabase...\n')

// Usar las variables de entorno del proyecto
const supabaseUrl = "https://qigyrivsmnmgignwluda.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZ3lyaXZzbW5tZ2lnbndsdWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEwNTI2MiwiZXhwIjoyMDc4NjgxMjYyfQ.1mFsgphrsDLE9ejjZ05U2o0BFXO39N1pXtmAZPHM0_Y"

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ No se encontraron credenciales de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('📊 Probando nombres de tablas...\n')
  
  // Probar tabla users
  const { data: usersLower, error: usersLowerError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  
  console.log('users (lowercase):', usersLowerError ? '❌' : '✅')
  
  // Probar tabla properties
  const { data: propsLower, error: propsLowerError } = await supabase
    .from('properties')
    .select('*')
    .limit(1)
  
  console.log('properties (lowercase):', propsLowerError ? '❌' : '✅')
  
  // Si lowercase funciona, probar columnas
  if (!usersLowerError) {
    console.log('\n📋 Probando nombres de columnas en users...\n')
    
    const { data: snakeCase, error: snakeCaseError } = await supabase
      .from('users')
      .select('id, email, is_active, created_at')
      .limit(1)
    
    console.log('is_active, created_at (snake_case):', snakeCaseError ? '❌' : '✅')
    if (snakeCaseError) console.log('Error:', snakeCaseError.message)
    
    const { data: camelCase, error: camelCaseError } = await supabase
      .from('users')
      .select('id, email, isActive, createdAt')
      .limit(1)
    
    console.log('isActive, createdAt (camelCase):', camelCaseError ? '❌' : '✅')
    if (camelCaseError) console.log('Error:', camelCaseError.message)
  }
  
  // Probar amenities en properties
  if (!propsLowerError) {
    console.log('\n📋 Probando columna amenities en properties...\n')
    
    const { data: amenities, error: amenitiesError } = await supabase
      .from('properties')
      .select('id, amenities')
      .limit(1)
    
    console.log('amenities:', amenitiesError ? '❌ No existe' : '✅ Existe')
    if (amenitiesError) console.log('Error:', amenitiesError.message)
  }
}

checkSchema().then(() => {
  console.log('\n✅ Verificación completa')
}).catch(err => {
  console.error('❌ Error:', err.message)
})
