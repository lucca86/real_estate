#!/bin/bash

# Script de configuración para producción
# Este script te ayuda a configurar el entorno de producción paso a paso

echo "==================================="
echo "Setup de Producción - Real Estate Manager"
echo "==================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Debes ejecutar este script desde la raíz del proyecto"
  exit 1
fi

echo "✅ Directorio del proyecto verificado"
echo ""

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI no está instalado"
  echo "   Instalando Vercel CLI globalmente..."
  npm install -g vercel
fi

echo "✅ Vercel CLI disponible"
echo ""

# Vincular proyecto con Vercel
echo "📦 Vinculando proyecto con Vercel..."
vercel link

echo ""
echo "🔑 Configurando variables de entorno..."
echo ""

# Pull de variables de entorno
vercel env pull .env.production

echo ""
echo "🗄️  Ejecutando migraciones de base de datos..."
echo ""

# Ejecutar migraciones
npx prisma migrate deploy

echo ""
echo "🔧 Generando cliente de Prisma..."
echo ""

npx prisma generate

echo ""
echo "✅ ¡Setup de producción completado!"
echo ""
echo "Próximos pasos:"
echo "1. Verifica las variables de entorno en Vercel Dashboard"
echo "2. Ejecuta el seed de datos iniciales (ver DEPLOYMENT.md)"
echo "3. Haz push a GitHub para desplegar: git push origin main"
echo ""
