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