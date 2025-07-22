// lib/projects.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getProjectsWithDetails(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('projects')
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
    .eq('createdBy', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

    // Turn null into [] so the rest of the code can assume an array
    const projects = data ?? []

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
  return projectsWithDetails
}