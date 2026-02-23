# ⚠️ SOLUCIÓN URGENTE - JWT Token Inválido

## Problema
El token JWT de tu sesión actual no se puede verificar, causando que la aplicación se bloquee.

## Solución Inmediata

### Opción 1: Vía Navegador
1. Abre una nueva pestaña en tu navegador
2. Ve a: `http://localhost:3000/api/logout`
3. Esto eliminará la cookie de sesión inválida
4. Serás redirigido automáticamente al login
5. Inicia sesión nuevamente con tus credenciales

### Opción 2: Vía DevTools
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. En el menú lateral, selecciona "Cookies"
4. Encuentra y elimina la cookie llamada "session"
5. Recarga la página (F5)
6. Inicia sesión nuevamente

## ¿Por qué pasó esto?

El problema ocurre cuando el `JWT_SECRET` en tu archivo `.env` cambió después de que iniciaste sesión. El token JWT fue creado con una clave secreta diferente a la que ahora se está usando para verificarlo.

## Prevención Futura

Asegúrate de que tu archivo `.env` tenga un `JWT_SECRET` consistente:

\`\`\`env
JWT_SECRET="dev-secret-key-change-in-production-98765"
\`\`\`

No cambies este valor a menos que quieras invalidar todas las sesiones activas.

## Credenciales de Prueba

Para iniciar sesión después del logout:

- **Email:** admin@mahler.com
- **Password:** (tu contraseña de admin)
