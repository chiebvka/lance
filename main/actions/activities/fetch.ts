"use server"

import { createClient } from "@/utils/supabase/server"

import { CustomerActivityWithDetails } from "@/utils/activity-helpers"

export async function fetchRecentCustomerActivities(limit: number = 12): Promise<CustomerActivityWithDetails[]> {
  try {
    const supabase = await createClient()
    
    // First, fetch the activities with customer data
    const { data: activities, error: activitiesError } = await supabase
      .from("customer_activities")
      .select(`
        id,
        customerId,
        referenceId,
        referenceType,
        type,
        label,
        details,
        created_at,
        createdBy,
        amount,
        tagColor,
        customers (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (activitiesError) {
      console.error("Error fetching customer activities:", activitiesError)
      return []
    }

    if (!activities || activities.length === 0) {
      return []
    }

    // Now we need to fetch the reference data (project names, invoice numbers, etc.)
    const activitiesWithDetails: CustomerActivityWithDetails[] = []

    for (const activity of activities) {
      let reference = null

      // Extract the relevant ID from the details JSONB column
      const details = activity.details as any
      let referenceId = activity.referenceId

      // Get the specific ID from details column based on context
      if (details && activity.referenceType) {
        switch (activity.referenceType) {
          case "project":
            referenceId = details.projectId || activity.referenceId
            break
          case "invoice":
            referenceId = details.invoiceId || activity.referenceId
            break
          case "receipt":
            referenceId = details.receiptId || activity.referenceId
            break
          case "feedback":
            referenceId = details.feedbackId || activity.referenceId
            break
          case "agreement":
            referenceId = details.agreementId || activity.referenceId
            break
        }
      }

      if (referenceId && activity.referenceType) {
        try {
          switch (activity.referenceType) {
            case "project":
              const { data: project } = await supabase
                .from("projects")
                .select("name")
                .eq("id", referenceId)
                .single()
              
              if (project) {
                reference = {
                  name: project.name,
                  number: null,
                  context: "project"
                }
              }
              break

            case "invoice":
              const { data: invoice } = await supabase
                .from("invoices")
                .select("invoiceNumber")
                .eq("id", referenceId)
                .single()
              
              if (invoice) {
                reference = {
                  name: null,
                  number: invoice.invoiceNumber,
                  context: "invoice"
                }
              }
              break

            case "receipt":
              const { data: receipt } = await supabase
                .from("receipts")
                .select("receiptNumber")
                .eq("id", referenceId)
                .single()
              
              if (receipt) {
                reference = {
                  name: null,
                  number: receipt.receiptNumber,
                  context: "receipt"
                }
              }
              break

            case "feedback":
              // Since feedback table doesn't exist yet, we'll handle this when it's implemented
              // For now, we'll use a placeholder
              reference = {
                name: "Feedback Request",
                number: null,
                context: "feedback"
              }
              break

            case "agreement":
              // Since agreement table doesn't exist yet, we'll handle this when it's implemented
              // For now, we'll use a placeholder
              reference = {
                name: "Service Agreement",
                number: null,
                context: "agreement"
              }
              break
          }
        } catch (refError) {
          console.error(`Error fetching ${activity.referenceType} reference:`, refError)
          // Continue with null reference if there's an error
        }
      }

      activitiesWithDetails.push({
        ...activity,
        customer: activity.customers && !Array.isArray(activity.customers) ? {
          name: (activity.customers as any).name,
          email: (activity.customers as any).email
        } : null,
        reference
      })
    }

    return activitiesWithDetails
  } catch (error) {
    console.error("Error in fetchRecentCustomerActivities:", error)
    return []
  }
}
