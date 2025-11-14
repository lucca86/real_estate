import bcrypt from 'bcryptjs'

async function generateAdminUser() {
  // Configura estos datos para tu nuevo usuario admin
  const adminData = {
    email: 'admin@realestate.com',
    password: 'Admin123!', // CAMBIA ESTA CONTRASEÑA
    name: 'Administrador',
    username: 'admin'
  }

  console.log('\n=== Generando usuario administrador ===\n')
  
  // Generar hash de la contraseña
  const passwordHash = await bcrypt.hash(adminData.password, 10)
  
  console.log('Datos del usuario:')
  console.log('Email:', adminData.email)
  console.log('Contraseña:', adminData.password)
  console.log('Hash generado:', passwordHash)
  console.log('\n--- SQL para insertar en Supabase ---\n')
  
  const sql = `
-- Insertar usuario administrador
INSERT INTO "User" (
  "id",
  "email", 
  "password",
  "name",
  "username",
  "role",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '${adminData.email}',
  '${passwordHash}',
  '${adminData.name}',
  '${adminData.username}',
  'ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "name" = EXCLUDED."name",
  "username" = EXCLUDED."username",
  "role" = EXCLUDED."role",
  "updatedAt" = NOW();

-- Verificar que el usuario se creó correctamente
SELECT "id", "email", "name", "username", "role", "isActive", "createdAt" 
FROM "User" 
WHERE "email" = '${adminData.email}';
`
  
  console.log(sql)
  console.log('\n=== Instrucciones ===')
  console.log('1. Copia el SQL de arriba')
  console.log('2. Ve a Supabase Dashboard → SQL Editor')
  console.log('3. Pega y ejecuta el SQL')
  console.log('4. Usa estos datos para login:')
  console.log('   Email:', adminData.email)
  console.log('   Contraseña:', adminData.password)
  console.log('\n')
}

generateAdminUser().catch(console.error)
