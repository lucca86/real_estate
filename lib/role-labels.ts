// Mapeo de roles técnicos a nombres amigables para mostrar en la UI
export const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  VENDEDOR: "Agente Inmobiliario",
}

export const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  SUPERVISOR: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  VENDEDOR: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
}

export function getRoleLabel(role: string): string {
  return roleLabels[role] || role
}
