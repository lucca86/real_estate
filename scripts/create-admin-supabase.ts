import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminUser() {
  console.log('Creating admin user in Supabase...\n')

  const email = 'admin@realestate.com'
  const password = 'Admin123!'
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // Crear nuevo usuario con SOLO las columnas que existen en la tabla
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: randomUUID(),
        name: 'Admin User', // Required field
        email,
        password: hashedPassword,
        role: 'ADMIN',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('❌ Error creating user:', error)
      process.exit(1)
    }

    console.log('✅ Admin user created successfully!')
    console.log('\n📋 Login credentials:')
    console.log('   Email:', email)
    console.log('   Password:', password)
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n')

    // Verificar que existe
    const { data: verification, error: verifyError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (verification) {
      console.log('✓ Verification: User exists in database')
      console.log('   ID:', verification.id)
      console.log('   Email:', verification.email)
      console.log('   Role:', verification.role)
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

createAdminUser()
