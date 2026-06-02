import { getCurrentUser } from "@/lib/auth"
import { debugWordPressProperty } from "@/lib/wordpress-debug"

/**
 * GET /api/wordpress/debug-property?id=123
 * 
 * Inspecciona una propiedad en WordPress para ver exactamente qué datos de dirección
 * están guardados y compara con nuestro mapeo.
 * 
 * Solo ADMIN puede usar este endpoint.
 */

export async function GET(req: Request) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const wpPostId = searchParams.get("id")

  if (!wpPostId || isNaN(Number(wpPostId))) {
    return Response.json(
      { error: "Missing or invalid 'id' query parameter" },
      { status: 400 }
    )
  }

  try {
    const result = await debugWordPressProperty(Number(wpPostId))
    
    return Response.json({
      success: true,
      debug: result,
      summary: {
        hasIssues: result.analysis.issues.length > 0,
        issueCount: result.analysis.issues.length,
        locationFieldsComplete: result.analysis.mappingMatch,
      },
    })
  } catch (error) {
    console.error("[DEBUG] Error:", error)
    return Response.json(
      { 
        error: "Failed to debug property",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
