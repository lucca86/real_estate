import { execSync } from "child_process"

const run = (cmd) => {
  console.log(`\n>>> ${cmd}`)
  const result = execSync(cmd, { cwd: "/vercel/share/v0-project", encoding: "utf8" })
  console.log(result)
  return result
}

run("git status")
run("git add -A")
run(`git commit -m "fix: canDeleteImages siempre habilitado para ADMIN y SUPERVISOR

- Reemplaza checkPermission('images.delete') por comparación directa de user.role
- Agrega canDeleteImages a PropertyFormProps en property-form.tsx
- Limpia import checkPermission en edit/page.tsx y new/page.tsx
- Corrige createAdminClient para usar @supabase/supabase-js directamente

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"`)
run("git push origin Verificar-Propietarios")
console.log("\n=== Push completado exitosamente ===")
