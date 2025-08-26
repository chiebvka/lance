import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { CustomerActivityWithDetails } from "@/utils/activity-helpers";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ success: false, error: "You must be part of an organization to view activities." }, { status: 403 });
    }

    // Get parameters from query params
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const useDateFilter = url.searchParams.get('useDateFilter') !== 'false'; // Default to true

    // Calculate date 3 months ago for better data filtering
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let query = supabase
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
        organizationId,
        customers (
          name,
          email
        )
      `)
      .eq('organizationId', profile.organizationId)
      .order("created_at", { ascending: false });

    // Use date filtering by default for better performance, fall back to limit
    if (useDateFilter) {
      query = query
        .gte('created_at', threeMonthsAgo.toISOString())
        .limit(Math.min(limit, 100)); // Safety limit to prevent excessive data
    } else {
      query = query.limit(limit);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      console.error("Error fetching customer activities:", activitiesError);
      return NextResponse.json({ success: false, error: "Failed to fetch activities" }, { status: 500 });
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ success: true, activities: [] });
    }

    // Now we need to fetch the reference data (project names, invoice numbers, etc.)
    const activitiesWithDetails: CustomerActivityWithDetails[] = [];

    for (const activity of activities) {
      let reference = null;

      // Extract the relevant ID from the details JSONB column
      const details = activity.details as any;
      let referenceId = activity.referenceId;

      // Get the specific ID from details column based on context
      if (details && activity.referenceType) {
        switch (activity.referenceType) {
          case "project":
            referenceId = details.projectId || activity.referenceId;
            break;
          case "invoice":
            referenceId = details.invoiceId || activity.referenceId;
            break;
          case "receipt":
            referenceId = details.receiptId || activity.referenceId;
            break;
          case "feedback":
            referenceId = details.feedbackId || activity.referenceId;
            break;
          case "agreement":
            referenceId = details.agreementId || activity.referenceId;
            break;
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
                .eq("organizationId", profile.organizationId)
                .single();

              if (project) {
                reference = {
                  name: project.name,
                  number: null,
                  context: "project"
                };
              }
              break;

            case "invoice":
              const { data: invoice } = await supabase
                .from("invoices")
                .select("invoiceNumber")
                .eq("id", referenceId)
                .eq("organizationId", profile.organizationId)
                .single();

              if (invoice) {
                reference = {
                  name: null,
                  number: invoice.invoiceNumber,
                  context: "invoice"
                };
              }
              break;

            case "receipt":
              const { data: receipt } = await supabase
                .from("receipts")
                .select("receiptNumber")
                .eq("id", referenceId)
                .eq("organizationId", profile.organizationId)
                .single();

              if (receipt) {
                reference = {
                  name: null,
                  number: receipt.receiptNumber,
                  context: "receipt"
                };
              }
              break;

            case "feedback":
              const { data: feedback } = await supabase
                .from("feedbacks")
                .select("name")
                .eq("id", referenceId)
                .eq("organizationId", profile.organizationId)
                .single();

              if (feedback) {
                reference = {
                  name: feedback.name,
                  number: null,
                  context: "feedback"
                };
              }
              break;

            case "agreement":
              // Since agreement table doesn't exist yet, we'll handle this when it's implemented
              // For now, we'll use a placeholder
              reference = {
                name: "Service Agreement",
                number: null,
                context: "agreement"
              };
              break;
          }
        } catch (refError) {
          console.error(`Error fetching ${activity.referenceType} reference:`, refError);
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
      });
    }

    return NextResponse.json({ success: true, activities: activitiesWithDetails });
  } catch (error) {
    console.error("Error in activities API route:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activities" }, { status: 500 });
  }
}
