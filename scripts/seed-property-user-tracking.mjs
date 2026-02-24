import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("[v0] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  // Get first admin user
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, role")
    .order("created_at", { ascending: true })
    .limit(5)

  if (usersError || !users?.length) {
    console.error("[v0] Error fetching users:", usersError)
    process.exit(1)
  }

  const adminUser = users.find(u => u.role === "ADMIN") ?? users[0]
  console.log("[v0] Using user:", adminUser.name, adminUser.id)

  // Check what columns exist in the properties view
  const { data: sample, error: sampleError } = await supabase
    .from("properties")
    .select("*")
    .limit(1)
    .single()

  if (sampleError) {
    console.error("[v0] Error fetching sample property:", sampleError)
    process.exit(1)
  }

  const keys = Object.keys(sample)
  console.log("[v0] Property columns with 'by'/'user':", keys.filter(k => k.toLowerCase().includes("by") || k.toLowerCase().includes("user")))
  console.log("[v0] createdById:", sample.createdById)
  console.log("[v0] updatedById:", sample.updatedById)
  console.log("[v0] created_by_id:", sample.created_by_id)
  console.log("[v0] updated_by_id:", sample.updated_by_id)

  // Update properties that have null in both possible field names
  // Try camelCase first (direct table)
  const { error: updateError, count } = await supabase
    .from("properties")
    .update({ 
      updatedById: adminUser.id, 
      createdById: adminUser.id 
    })
    .or("updatedById.is.null,createdById.is.null")
    .select("id", { count: "exact" })

  if (updateError) {
    console.log("[v0] camelCase update failed:", updateError.message, "- trying snake_case...")

    const { error: updateError2, count: count2 } = await supabase
      .from("properties")
      .update({ 
        updated_by_id: adminUser.id, 
        created_by_id: adminUser.id 
      })
      .or("updated_by_id.is.null,created_by_id.is.null")
      .select("id", { count: "exact" })

    if (updateError2) {
      console.error("[v0] Both updates failed:", updateError2)
    } else {
      console.log("[v0] Updated", count2, "properties with snake_case fields")
    }
  } else {
    console.log("[v0] Updated", count, "properties with camelCase fields")
  }
}

seed()
