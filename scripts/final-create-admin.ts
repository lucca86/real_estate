import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function createAdmin() {
  console.log('\n🔍 Step 1: Checking users table schema...')
  
  // Get one row to see the structure
  const { data: sample, error: sampleError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  
  if (sampleError && sampleError.code !== 'PGRST116') {
    console.error('Error checking schema:', sampleError)
  }
  
  console.log('Sample row structure:', sample?.[0] || 'No existing users')
  
  console.log('\n🗑️  Step 2: Deleting existing admin user...')
  
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('email', 'admin@realestate.com')
  
  if (deleteError) {
    console.log('No existing admin to delete or error:', deleteError.message)
  } else {
    console.log('Existing admin deleted')
  }
  
  console.log('\n🔐 Step 3: Creating password hash...')
  const password = 'Admin123!'
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log('Password hashed successfully')
  
  console.log('\n👤 Step 4: Creating admin user...')
  
  // Try with minimal required fields first
  const adminData = {
    id: randomUUID(),
    email: 'admin@realestate.com',
    password: hashedPassword,
    role: 'ADMIN',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  console.log('Attempting to insert with data:', { ...adminData, password: '[REDACTED]' })
  
  const { data, error } = await supabase
    .from('users')
    .insert(adminData)
    .select()
  
  if (error) {
    console.error('\n❌ Error creating user:', error)
    console.log('\n💡 Trying with name field...')
    
    // Try again with name field
    const adminDataWithName = {
      ...adminData,
      name: 'Administrator'
    }
    
    const { data: data2, error: error2 } = await supabase
      .from('users')
      .insert(adminDataWithName)
      .select()
    
    if (error2) {
      console.error('\n❌ Still failed:', error2)
      process.exit(1)
    }
    
    console.log('\n✅ Success! Admin user created with name field')
    console.log('User data:', data2)
  } else {
    console.log('\n✅ Success! Admin user created')
    console.log('User data:', data)
  }
  
  console.log('\n📧 Login credentials:')
  console.log('Email: admin@realestate.com')
  console.log('Password: Admin123!')
  console.log('\n🎉 You can now log in to your application!')
}

createAdmin().catch(console.error)
