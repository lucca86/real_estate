/**
 * Safe server-side logger.
 * React RSC serializes every console.* call made on the server and sends
 * the arguments to the browser DevTools. When those arguments contain complex
 * Supabase/Prisma objects (with internal circular references or Proxy traps)
 * the JSON serializer recurses infinitely → "Maximum call stack size exceeded".
 *
 * This helper converts every argument to a plain string before logging,
 * which is always safe to serialize.
 */

function serialize(value: unknown): string {
  if (value === null || value === undefined) return String(value)
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return JSON.stringify(value, (_key, v) => {
      // Break circular refs and strip non-serializable values
      if (v instanceof Error) return `${v.name}: ${v.message}`
      if (typeof v === "function") return "[Function]"
      if (typeof v === "symbol") return v.toString()
      return v
    })
  } catch {
    return String(value)
  }
}

function format(label: string, args: unknown[]): string {
  return [label, ...args.map(serialize)].join(" ")
}

export const serverLog = {
  info: (...args: unknown[]) => console.info(format("[info]", args)),
  warn: (...args: unknown[]) => console.warn(format("[warn]", args)),
  error: (...args: unknown[]) => console.error(format("[error]", args)),
}
