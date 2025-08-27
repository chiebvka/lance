import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationFeedback, getOrganizationFeedbackTemplates, getUserDraftFeedbacks } from "@/lib/feedback";
import { ratelimit } from "@/utils/rateLimit";

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch feedback templates via shared org-scoped getter
    let templates: any[] = []
    try {
      templates = await getOrganizationFeedbackTemplates(supabase)
    } catch (e) {
      console.error("Error fetching feedback templates:", e)
      return NextResponse.json(
        { error: "Could not fetch feedback templates from database." },
        { status: 500 }
      )
    }

    // Fetch feedback drafts
    // Fetch drafts via shared helper
    let drafts: any[] = []
    try {
      drafts = await getUserDraftFeedbacks(supabase)
    } catch (e) {
      console.error("Error fetching draft feedbacks:", e)
      return NextResponse.json(
        { error: "Could not fetch feedback drafts from database." },
        { status: 500 }
      )
    }

    // Fetch organization-scoped feedbacks using shared lib function
    let feedbacks = [] as any[]
    try {
      feedbacks = await getOrganizationFeedback(supabase)
    } catch (e) {
      console.error("Error fetching organization feedbacks:", e)
      return NextResponse.json({ success: false, error: "Could not fetch feedbacks" }, { status: 500 });
    }

    // templates already handled via try/catch above

    // drafts handled via try/catch above

    // Transform templates data
    const templatesWithDetails = (templates || []).map((template) => ({
      id: template.id,
      name: template.name || 'Untitled Template',
      questions: template.questions || [],
      isDefault: template.isDefault || false,
      questionCount: Array.isArray(template.questions) ? template.questions.length : 0,
      createdAt: template.created_at,
      isOwner: template.createdBy === user.id,
      createdAtFormatted: template.created_at 
        ? new Date(template.created_at).toLocaleDateString()
        : 'Unknown'
    }));

    // Transform drafts data - now using the name from the database
    const draftsWithDetails = (drafts || []).map((draft) => ({
      id: draft.id,
      name: draft.name || 'Untitled Draft', // Use the name from database
      questions: draft.questions || [],
      questionCount: Array.isArray(draft.questions) ? draft.questions.length : 0,
      createdAt: draft.created_at,
      recipientEmail: draft.recepientEmail,
      customerId: draft.customerId,
      projectId: draft.projectId,
      dueDate: draft.dueDate,
      customerName: draft.customers?.[0]?.name || null,
      projectName: draft.projects?.[0]?.name || null,
      createdAtFormatted: draft.created_at 
        ? new Date(draft.created_at).toLocaleDateString()
        : 'Unknown'
    }));

    const feedbacksWithDetails = feedbacks
    
    console.log(feedbacksWithDetails)
    return NextResponse.json({ 
      success: true, 
      templates: templatesWithDetails,
      drafts: draftsWithDetails,
      feedbacks: feedbacksWithDetails,
    }, { status: 200 });
    
  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const ip = (request.headers as any).get?.('x-forwarded-for') ??
      (request.headers as any).get?.('x-real-ip') ??
      '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          limit,
          reset,
          remaining
        },
        { status: 429 }
      );
    }

    const { templateId, name, questions } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Get user's organization to validate ownership by organizationId
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();
    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if template belongs to user's organization
    const { data: existingTemplate, error: checkError } = await supabase
      .from("feedback_templates")
      .select("id, organizationId")
      .eq("id", templateId)
      .eq("organizationId", profile.organizationId)
      .single();

    if (checkError || !existingTemplate) {
      return NextResponse.json({ error: "Template not found for your organization" }, { status: 404 });
    }

    // Update the template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from("feedback_templates")
      .update({
        name,
        questions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase Template Update Error:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    console.log("Template updated successfully. Template ID:", updatedTemplate.id);
    return NextResponse.json({ success: true, data: updatedTemplate }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Check if user owns this template
    const { data: existingTemplate, error: checkError } = await supabase
      .from("feedback_templates")
      .select("createdBy")
      .eq("id", templateId)
      .single();

    if (checkError || !existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (existingTemplate.createdBy !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this template" }, { status: 403 });
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from("feedback_templates")
      .delete()
      .eq("id", templateId);

    if (deleteError) {
      console.error("Supabase Template Delete Error:", deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    console.log("Template deleted successfully. Template ID:", templateId);
    return NextResponse.json({ success: true, message: "Template deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
