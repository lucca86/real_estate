import { getCurrentUser } from "@/lib/auth"
import { debugWordPressProperty } from "@/lib/wordpress-debug"

/**
 * GET /api/wordpress/debug-property?id={wordpress_post_id}
 *
 * Inspecciona una propiedad en WordPress para ver exactamente qué meta keys
 * de dirección están guardados y los compara con nuestro mapeo actual.
 *
 * Solo accesible por ADMIN.
 */
export async function GET(req: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const rawId = searchParams.get("id")

  if (!rawId || isNaN(Number(rawId))) {
    return Response.json(
      { error: "Provide a valid WordPress post ID as ?id=123" },
      { status: 400 }
    )
  }

  try {
    const result = await debugWordPressProperty(Number(rawId))
    return Response.json({ success: true, result })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
