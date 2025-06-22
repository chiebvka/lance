"use server"

import { createClient } from "@/utils/supabase/server"

export async function getProjectNameById(projectId: string): Promise<string | null> {
  if (!projectId) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single()

  if (error) {
    console.error(`Error fetching project name for ID ${projectId}:`, error.message)
    return null
  }

  return data.name
} 