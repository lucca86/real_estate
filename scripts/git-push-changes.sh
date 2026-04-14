#!/bin/bash
set -e

cd /vercel/share/v0-project

echo "=== Git status ==="
git status

echo "=== Staging all changes ==="
git add -A

echo "=== Committing ==="
git commit -m "fix: canDeleteImages siempre habilitado para ADMIN y SUPERVISOR

- Reemplaza checkPermission('images.delete') por comparación directa de user.role
- Agrega canDeleteImages a PropertyFormProps en property-form.tsx
- Limpia import checkPermission en edit/page.tsx y new/page.tsx
- Corrige createAdminClient para usar @supabase/supabase-js directamente (bypasea RLS)

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

echo "=== Pushing ==="
git push origin Verificar-Propietarios

echo "=== Done ==="
