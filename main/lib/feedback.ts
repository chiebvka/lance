import { Feedbacks } from '@/hooks/feedbacks/use-feedbacks'
import Feedback from '@/validation/forms/feedback'
import type { SupabaseClient } from '@supabase/supabase-js'


export async function getFeedbacks(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('feedbacks')
    .select(`
        id,
        name,
        filledOn,
        token,
        questions,
        answers,
        recepientName,
        recepientEmail,
        state,
        dueDate,
        created_at,
        updated_at,
        projectId (
            id,
            name
        ),
        customerId(
            id,
            name,
            email
        ),
        templateId(
            id,
            name
        )
    `)
    .eq('createdBy', userId)
    .order('created_at', { ascending: false })

  if (error)  throw error
  const feedbacks = data ?? []

  const feedbacksWithDetails = feedbacks.map((feedback) => {
    return {
      id: feedback.id || '',
      name: feedback?.name || 'Untitled Feedback',
      filledOn: feedback?.filledOn || '',
      recepientName: feedback?.recepientName || '',
      questions: feedback?.questions || [],
      answers: feedback?.answers || [],
      recepientEmail: feedback?.recepientEmail || '',
      state: feedback?.state || 'active',
      token: feedback?.token || '',
      dueDate: feedback?.dueDate || '',
      created_at: feedback?.created_at || '',
      updated_at: feedback?.updated_at || '',
      projectId: feedback?.projectId?.[0]?.id ?? null,
      customerId: feedback?.customerId?.[0]?.id ?? null,
      templateId: feedback?.templateId?.[0]?.id ?? null,
      // Optionally, for display:
      projectName: feedback?.projectId?.[0]?.name ?? null,
      customerName: feedback?.customerId?.[0]?.name ?? null,
      customerEmail: feedback?.customerId?.[0]?.email ?? null,
      templateName: feedback?.templateId?.[0]?.name ?? null,
    }
  })
 
  return feedbacksWithDetails
}

export async function getFeedbackById(supabase: SupabaseClient, feedbackId: string, userId: string) {
  const { data, error } = await supabase
    .from('feedbacks')
    .select(`
        id,
        name,
        questions,
        answers,
        recepientName,
        recepientEmail,
        state,
        dueDate,
        message,
        token,
        customerId,
        projectId,
        templateId,
        created_at,
        updated_at,
        customerId(
            id,
            name,
            email
        )
    `)
    .eq('id', feedbackId)
    .eq('createdBy', userId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Feedback not found')

  return {
    id: data.id,
    name: data.name || 'Untitled Feedback',
    questions: data.questions || [],
    answers: data.answers || [],
    recepientName: data.recepientName,
    recepientEmail: data.recepientEmail,
    state: data.state,
    dueDate: data.dueDate,
    message: data.message,
    token: data.token,
    customerId: data.customerId,
    projectId: data.projectId,
    templateId: data.templateId,
    created_at: data.created_at,
    updated_at: data.updated_at,
    customer: data.customerId?.[0] || null
  }
}

export async function getOrganizationFeedback(supabase: SupabaseClient): Promise<Feedbacks[]> {

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's profile to find their organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organizationId')
    .eq('profile_id', user.id)
    .single();
    
    if (profileError || !profile?.organizationId) {
        throw new Error('Organization not found');
  }

  // Select feedbacks for the organization with related entities
  const { data, error } = await supabase
    .from('feedbacks')
    .select(`
        id,
        name,
        filledOn,
        token,
        questions,
        answers,
        recepientName,
        recepientEmail,
        state,
        dueDate,
        created_at,
        updated_at,
        createdBy,
        organizationId,
        organizationName,
        organizationLogo,
        organizationEmail,
        projectId,
        customerId,
        templateId,
        project:projectId (id, name),
        customer:customerId (id, name, email),
        org:organizationId (id, name, email, logoUrl)
    `)
    .eq('organizationId', profile.organizationId)
    .order('created_at', { ascending: false });

    console.log(`here is the data`, data)
  if (error) {
    throw error;
  }

  // Ensure JSON fields are properly parsed
  const processJsonField = (field: any) => {
    if (typeof field === 'string' && (field.trim().startsWith('{') || field.trim().startsWith('['))) {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('Failed to parse JSON field in feedbacks:', field);
        return field;
      }
    }
    return field;
  };

  const feedbacks: Feedbacks[] = (data || []).map((fb: any): Feedbacks => ({
    id: fb.id,
    name: fb.name || 'Untitled Feedback',
    questions: processJsonField(fb.questions) || [],
    answers: processJsonField(fb.answers) || [],
    state: fb.state || 'draft',
    filledOn: fb.filledOn || null,
    token: fb.token || null,
    projectId: fb.projectId || null,
    customerId: fb.customerId || null,
    organizationId: fb.organizationId || null,
    createdBy: fb.createdBy || null,
    created_at: fb.created_at || null,
    updated_at: fb.updated_at || null,
    organizationName: fb.organizationName || null,
    organizationLogo: fb.organizationLogo || null,
    organizationLogoUrl: fb.org?.[0]?.logoUrl || null,
    organizationNameFromOrg: fb.org?.[0]?.name || null,
    organizationEmailFromOrg: fb.org?.[0]?.email || null,
    organizationEmail: fb.organizationEmail || null,
    recepientName: fb.recepientName || null,
    recepientEmail: fb.recepientEmail || null,
    templateId: fb.templateId || null,
    dueDate: fb.dueDate || null,
    projectNameFromProject: fb.project?.[0]?.name || null,
    customerName: fb.customer?.[0]?.name || null,
    customerEmail: fb.customer?.[0]?.email || null,
  }));
console.log(feedbacks)
  return feedbacks;
}

export async function getOrganizationFeedbackTemplates(supabase: SupabaseClient): Promise<any[]> {


  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

          // Get user's profile to find their organization
  const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('organizationId')
  .eq('profile_id', user.id)
  .single();
  
  if (profileError || !profile?.organizationId) {
      throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from("feedback_templates")
    .select(`
      id,
      name,
      questions,
      isDefault,
      created_at,
      organizationId,
      createdBy
    `)
    .eq('organizationId', profile?.organizationId)
    .or(`createdBy.eq.${user.id},isDefault.eq.true`)
    .order("created_at", { ascending: false });

  if (error) throw error
  return data
}

export async function getUserDraftFeedbacks(supabase: SupabaseClient): Promise<any[]> {
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }
    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organizationId')
    .eq('profile_id', user.id)
    .single();
    
    if (profileError || !profile?.organizationId) {
        throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('feedbacks')
    .select(`
      id,
      name,
      customerId,
      projectId,
      questions,
      dueDate,
      answers,
      token,
      state,
      recepientEmail,
      created_at,
      createdBy,
      project:projectId (id, name),
      customer:customerId (id, name, email),
      org:organizationId (id, name, email, logoUrl)
    `)
    .eq('organizationId', profile.organizationId)
    .eq('state', 'draft')
    .order('created_at', { ascending: false });

  if (error) throw error
  return data ?? []
}