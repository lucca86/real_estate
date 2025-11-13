import { NextResponse } from "next/server"
import { testNeonConnection } from "@/lib/db-neon"

export async function GET() {
  console.log("[v0] Waking up Neon database...")

  try {
    const result = await testNeonConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database is awake and responding",
        data: result.data,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to database",
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error testing connection",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
