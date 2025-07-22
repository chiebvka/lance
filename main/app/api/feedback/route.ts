import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch feedback templates
    const { data: templates, error: templatesError } = await supabase
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
      .or(`createdBy.eq.${user.id},isDefault.eq.true`)
      .order("created_at", { ascending: false });

    // Fetch feedback drafts
    const { data: drafts, error: draftsError } = await supabase
      .from("feedbacks")
      .select(`
        id,
        name,
        customerId,
        projectId,
        questions,
        dueDate,
        state,
        recepientEmail,
        created_at,
        createdBy,
        customers (
          id,
          name,
          email
        ),
        projects (
          id,
          name
        )
      `)
      .eq("createdBy", user.id)
      .eq("state", "draft")
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error("Error fetching feedback templates:", templatesError);
      return NextResponse.json(
        { error: "Could not fetch feedback templates from database." },
        { status: 500 }
      );
    }

    if (draftsError) {
      console.error("Error fetching feedback drafts:", draftsError);
      return NextResponse.json(
        { error: "Could not fetch feedback drafts from database." },
        { status: 500 }
      );
    }

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

    return NextResponse.json({ 
      success: true, 
      templates: templatesWithDetails,
      drafts: draftsWithDetails
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

    const { templateId, name, questions } = await request.json();

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
      return NextResponse.json({ error: "Unauthorized to update this template" }, { status: 403 });
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
