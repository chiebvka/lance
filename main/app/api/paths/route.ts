import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getOrganizationPaths } from "@/lib/path"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const paths = await getOrganizationPaths(supabase)

    return NextResponse.json({ 
      success: true, 
      paths: paths 
    })

  } catch (error) {
    console.error("Paths fetch error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
