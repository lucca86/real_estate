const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@realestate.com' },
    update: {},
    create: {
      email: 'admin@realestate.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1 (809) 555-0100',
    },
  })

  console.log('✅ Admin user created:', admin.email)
  console.log('📧 Email: admin@realestate.com')
  console.log('🔑 Password: admin123')
  console.log('\n⚠️  Please change the password after first login!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
