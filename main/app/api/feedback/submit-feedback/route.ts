import { ratelimit } from "@/utils/rateLimit";
import { createClient } from "@/utils/supabase/server";
import { feedbackAnswerSchema } from "@/validation/feedback";
import { NextResponse } from "next/server";
import { isOrgSubscriptionActive, deriveInactiveReason } from "@/utils/subscription";

interface Question {
  id: string;
  type: string;
  text: string;
  required?: boolean;
  options?: any;
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Rate limit check using IP address (for unauthenticated users)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ success: false, error: "Too Many Requests" }, { status: 429 });
  }

  const body = await request.json();

  // Validate the incoming data
  const validationResult = feedbackAnswerSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input data", details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  const { feedbackId, token, answers } = validationResult.data;

  try {
    // Set the token in the request context for RLS
    await supabase.rpc('set_feedback_token', { token_param: token });

    // Validate the token and check the feedback state
    const { data: feedback, error: fetchError } = await supabase
      .from("feedbacks")
      .select("id, token, state, questions, dueDate, filledOn")
      .eq("id", feedbackId)
      .eq("token", token)
      .single();

    if (fetchError || !feedback) {
      return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 400 });
    }

    if (feedback.state === "completed") {
      return NextResponse.json({ success: false, error: "Feedback already completed" }, { status: 400 });
    }

    // Verify that all questionIds in answers exist in the original questions
    const originalQuestions: Question[] = feedback.questions || [];
    const submittedQuestionIds = new Set(answers.map((a) => a.questionId));
    const validQuestionIds = new Set(originalQuestions.map((q: Question) => q.id));

    // Convert Set to Array for iteration compatibility
    const submittedIds = Array.from(submittedQuestionIds);
    if (!submittedIds.every((id) => validQuestionIds.has(id))) {
      return NextResponse.json(
        { success: false, error: "One or more question IDs are invalid" },
        { status: 400 }
      );
    }

    // Update the feedback with answers and state (RLS will now allow this for valid tokens)
    const currentTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("feedbacks")
      .update({
        answers: answers,
        state: "completed",
        filledOn: currentTimestamp,
        updated_at: currentTimestamp
      })
      .eq("id", feedbackId)
      .eq("token", token);

    if (updateError) {
      console.error("Error updating feedback:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Feedback submitted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in submit-feedback:", error);
    return NextResponse.json({ success: false, error: "Failed to submit feedback" }, { status: 500 });
  }
}

// Add GET route to fetch feedback data
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const feedbackId = searchParams.get('feedbackId');
  const token = searchParams.get('token');

  if (!feedbackId || !token) {
    return NextResponse.json({ error: "Missing feedbackId or token" }, { status: 400 });
  }

  try {
    const { data: feedback, error } = await supabase
      .from("feedbacks")
      .select(`
        id,
        name,
        state,
        questions,
        dueDate,
        filledOn,
        organizationName,
        organizationLogoUrl,
        organizationEmail,
        organization:organizationId (
          id,
          subscriptionstatus,
          trialEndsAt
        ),
        message,
        created_at
      `)
      .eq("id", feedbackId)
      .eq("token", token)
      .single();

    if (error || !feedback) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Gate by organization subscription (non-auth public preview)
    const orgStatus = (feedback as any)?.organization?.subscriptionstatus ?? null;
    const orgTrialEndsAt = (feedback as any)?.organization?.trialEndsAt ?? null;
    if (!isOrgSubscriptionActive(orgStatus, orgTrialEndsAt)) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization subscription inactive",
          reason: deriveInactiveReason(orgStatus, orgTrialEndsAt),
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: feedback }, { status: 200 });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
