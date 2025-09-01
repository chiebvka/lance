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
        customer:customerId (
          id,
          name,
          email
        ),
        token,
        organization:organizationId (
          id,
          name,
          email,
          logoUrl
        )
      `)
    .eq('createdBy', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Temporary debug logging to inspect shape and ensure token presence
  // eslint-disable-next-line no-console
  // console.log('[getProjectsWithDetails] Raw data:', data)

  // Turn null into [] so the rest of the code can assume an array
  const projects = data ?? []

  const projectsWithDetails = projects.map((project) => {
    const customer = (project as any).customer as { id: string; name: string; email: string } | null | undefined
    const organization = (project as any).organization as { id: string; name: string; email: string; logoUrl: string } | null | undefined
    return {
      id: project.id,
      name: project.name || 'Untitled Project',
      description: project.description || 'No description',
      type: project.type || 'General',
      customerName: customer?.name || 'No Customer Assigned',
      customerEmail: customer?.email || null,
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
      token: project.token ?? null,
      // Include relationship data
      customer,
      organization,
      // Format dates for display
      startDateFormatted: project.startDate 
        ? new Date(project.startDate).toLocaleDateString()
        : 'Not set',
      endDateFormatted: project.endDate 
        ? new Date(project.endDate).toLocaleDateString()
        : 'Unknown',
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