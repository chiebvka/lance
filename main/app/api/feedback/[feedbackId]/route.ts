import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { feedbackCreateSchema } from "@/validation/feedback";


export async function GET(
    request: NextRequest,
    context: any
  ) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    if (!user) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }
  
    const { params } = context;
    const { feedbackId } = params
  
    try {
      // Fetch the feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("id", feedbackId)
        .eq("createdBy", user.id)
        .single()
  
      if (feedbackError) throw feedbackError
      if (!feedback) throw new Error("feedback not found")
  
      // Fetch the customer
      let customer = null
      if (feedback.customerId) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id, name, email")
          .eq("id", feedback.customerId)
          .single()
        if (customerError) throw customerError
        customer = customerData
      }
  
   
  
      // Remap paymentTerms to paymentMilestones for frontend consistency
      const projectResponse = {
        ...feedback,
        customer
      }
  
      return NextResponse.json({ success: true, project: projectResponse })
    } catch (e) {
      const error = e as Error
      console.error(`Error fetching project ${context.params.projectId}:`, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
}

export async function PATCH(
    request: Request, 
    context: { params: Promise<{ feedbackId: string }> }
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId } = await context.params;
    
    if (!feedbackId) {
        return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
    }

    // Check if feedback exists and belongs to user
    const { data: existingFeedback, error: checkError } = await supabase
        .from("feedbacks")
        .select("createdBy, state")
        .eq("id", feedbackId)
        .single();

    if (checkError || !existingFeedback) {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (existingFeedback.createdBy !== user.id) {
        return NextResponse.json({ error: "Unauthorized to update this feedback" }, { status: 403 });
    }

    // Only allow updating drafts
    if (existingFeedback.state !== "draft") {
        return NextResponse.json({ error: "Only draft feedback can be updated" }, { status: 400 });
    }

    // Clean and validate the data - handle null values properly
    const cleanData = {
        ...body,
        // Handle optional fields - convert empty strings to undefined for email
        recipientEmail: body.recipientEmail === "" ? undefined : body.recipientEmail,
        // Keep null values for recepientName and message as they're now allowed
        recepientName: body.recepientName,
        message: body.message,
        templateId: body.templateId || undefined,
        // Determine the name: use provided name or fallback to first question
        name: body.name || (body.questions && body.questions.length > 0 ? body.questions[0].text : 'Untitled Feedback'),
    }

    const validatedFields = feedbackCreateSchema.safeParse(cleanData);

    if (!validatedFields.success) {
        console.error("Feedback Update Validation Errors:", JSON.stringify(validatedFields.error.flatten(), null, 2));
        return NextResponse.json(
            { error: "Invalid feedback fields!", details: validatedFields.error.flatten() }, 
            { status: 400 }
        );
    }

    const {
        name,
        customerId,
        projectId,
        templateId,
        dueDate,
        recipientEmail,
        recepientName,
        message,
        questions,
        answers = []
    } = validatedFields.data;

    // Get current timestamp
    const currentTimestamp = new Date().toISOString();

    try {
        const { data: updatedFeedback, error: updateError } = await supabase
            .from("feedbacks")
            .update({
                name,
                customerId,
                projectId,
                templateId,
                dueDate,
                recepientEmail: recipientEmail, // Note: matches DB column name
                recepientName, // This can now be null
                questions,
                answers,
                message, // This can now be null
                updated_at: currentTimestamp,
            })
            .eq("id", feedbackId)
            .eq("state", "draft") // Extra safety check
            .eq("state", "overdue") // Extra safety check
            .select()
            .single();

        if (updateError) {
            console.error("Supabase Feedback Update Error:", updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        if (!updatedFeedback) {
            return NextResponse.json({ success: false, error: "Failed to update feedback" }, { status: 500 });
        }

        console.log("Feedback updated successfully. Feedback ID:", updatedFeedback.id);

        return NextResponse.json({ 
            success: true, 
            data: updatedFeedback 
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating feedback:", error);
        return NextResponse.json({ success: false, error: "Failed to update feedback" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: any
  ) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    const { params } = context;
    const { feedbackId } = params
  
    try {
      const { error: feedbackDeleteError } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", feedbackId)
        .eq("createdBy", user?.id)
  
      if (feedbackDeleteError) throw feedbackDeleteError
  
      return NextResponse.json({ success: true, message: "Feedback deleted successfully" })
    } catch (e) {
      const error = e as Error
      console.error(`Error deleting feedback ${feedbackId}:`, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  }