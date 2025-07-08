import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch projects with customer information
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        type,
        budget,
        currency,
        state,
        hasServiceAgreement,
        status,
        paymentStructure,
        startDate,
        endDate,
        created_at,
        customerId,
        customers (
          id,
          name,
          email
        )
      `)
      .eq("createdBy", user.id)
      .order("created_at", { ascending: false });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      return NextResponse.json(
        { error: "Could not fetch projects from database." },
        { status: 500 }
      );
    }

    // Transform the data to include customer name and format for frontend
    const projectsWithDetails = projects.map((project) => {
      return {
        id: project.id,
        name: project.name || 'Untitled Project',
        description: project.description || 'No description',
        type: project.type || 'General',
        customerName: project.customers?.[0]?.name || 'No Customer Assigned',
        customerId: project.customerId,
        budget: project.budget || 0,
        currency: project.currency || 'USD',
        state: project.state || 'draft',
        hasServiceAgreement: project.hasServiceAgreement || false,
        status: project.status || 'active',
        paymentType: project.paymentStructure || 'milestone',
        startDate: project.startDate,
        endDate: project.endDate,
        created_at: project.created_at,
        // Format dates for display
        startDateFormatted: project.startDate 
          ? new Date(project.startDate).toLocaleDateString()
          : 'Not set',
        endDateFormatted: project.endDate 
          ? new Date(project.endDate).toLocaleDateString()
          : 'Not set',
        createdAtFormatted: project.created_at 
          ? new Date(project.created_at).toLocaleDateString()
          : 'Unknown',
        // Format budget for display
        budgetFormatted: project.budget 
          ? `${project.currency || 'USD'} ${project.budget.toLocaleString()}`
          : 'Not set'
      };
    });

    return NextResponse.json({ 
      success: true, 
      projects: projectsWithDetails 
    }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
