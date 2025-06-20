"use server"

import { createClient } from "@/utils/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function projectCustomerFetch() {
  noStore()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to fetch customers." }
  }

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("createdBy", user.id)

  if (error) {
    console.error("Error fetching customers:", error)
    return { error: "Failed to fetch customers from the database." }
  }

  return { customers }
}