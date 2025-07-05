import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { projectCreateSchema } from "@/validation/projects";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueProject from "../../../../emails/IssueProject";
import { NextRequest } from "next/server";
import { z } from "zod";
import deliverableSchema from "@/validation/deliverables";
import paymentTermSchema from "@/validation/payment";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  console.log("🔄 API Route GET: Starting project fetch");
  const { projectId } = await context.params;
  console.log("📤 API Route GET: Project ID:", projectId);

  try {
    const supabase = await createClient();
    console.log("🔗 API Route GET: Supabase client created");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("👤 API Route GET: Auth check - User ID:", user?.id);

    if (authError || !user) {
      console.error("❌ API Route GET: Authentication failed:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔍 API Route GET: Fetching project from database with related tables");

    // Fetch project core data
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        customers (
          id,
          name,
          email
        )
      `
      )
      .eq("id", projectId)
      .eq("createdBy", user.id)
      .single();

    if (projectError || !projectData) {
      console.error(
        "❌ API Route GET: Database error fetching project:",
        projectError
      );
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch deliverables
    const { data: deliverables, error: deliverablesError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("projectId", projectId)
      .order("position", { ascending: true });

    if (deliverablesError) {
      console.error(
        "❌ API Route GET: Database error fetching deliverables:",
        deliverablesError
      );
      return NextResponse.json(
        { success: false, error: "Failed to fetch deliverables" },
        { status: 500 }
      );
    }

    // Fetch payment terms
    const { data: paymentTerms, error: paymentTermsError } = await supabase
      .from("paymentTerms")
      .select("*")
      .eq("projectId", projectId)
      .order("dueDate", { ascending: true, nullsFirst: false });

    if (paymentTermsError) {
      console.error(
        "❌ API Route GET: Database error fetching payment terms:",
        paymentTermsError
      );
      return NextResponse.json(
        { success: false, error: "Failed to fetch payment terms" },
        { status: 500 }
      );
    }

    // Combine into a single project object
    const project = {
      ...projectData,
      deliverables,
      paymentMilestones: paymentTerms, // The form uses paymentMilestones, so we map it here
    };

    console.log("✅ API Route GET: Project and related data fetched successfully");

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("❌ API Route GET: Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  console.log("🔄 API Route PUT: Starting project update")
  const { projectId } = await context.params;
  console.log("📤 API Route PUT: Project ID:", projectId)

  try {
    const supabase = await createClient();
    console.log("🔗 API Route PUT: Supabase client created")

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("👤 API Route PUT: Auth check - User ID:", user?.id)
    
    if (authError || !user) {
      console.error("❌ API Route PUT: Authentication failed:", authError)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("📥 API Route PUT: Reading request body")
    const body = await request.json();
    console.log("📥 API Route PUT: Request body received:", JSON.stringify(body, null, 2))

    console.log("🔍 API Route PUT: Validating request data")
    
    // Define a more specific schema for validation now that we use tables
    const preprocessSchema = projectCreateSchema.extend({
      startDate: z.coerce.date().optional().nullable(),
      endDate: z.coerce.date().optional().nullable(),
      deliverables: z.array(deliverableSchema).optional(),
      paymentMilestones: z.array(paymentTermSchema).optional()
    });

    const validationResult = preprocessSchema.safeParse(body);
    console.log("📊 API Route PUT: Validation result success:", validationResult.success)
    
    if (!validationResult.success) {
      console.error("❌ API Route PUT: Validation failed")
      console.error("📊 API Route PUT: Validation errors:", validationResult.error.flatten())
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { deliverables, paymentMilestones, ...projectFields } = validationResult.data;
    console.log("✅ API Route PUT: Data validation successful")

    // 1. Update the main project table
    console.log("🔧 API Route PUT: Preparing project update data")
    const { error: projectUpdateError } = await supabase
      .from("projects")
      .update({ 
        ...projectFields, 
        updatedOn: new Date().toISOString(),
        updatedBy: user.id,
        // Set old JSON columns to null as they are deprecated
        deliverables: null,
        paymentMilestones: null,
      })
      .eq("id", projectId)
      .eq("createdBy", user.id);

    if (projectUpdateError) {
      console.error("❌ API Route PUT: Database update error for project:", projectUpdateError);
      return NextResponse.json(
        { success: false, error: "Failed to update project data", details: projectUpdateError },
        { status: 500 }
      );
    }
    console.log("✅ API Route PUT: Project core data updated successfully");


    // 2. Handle Deliverables (Upsert/Delete)
    console.log("🔧 API Route PUT: Processing deliverables");
    const { data: existingDeliverables } = await supabase.from('deliverables').select('id').eq('projectId', projectId);
    const existingDeliverableIds = existingDeliverables?.map(d => d.id) || [];
    const incomingDeliverableIds = deliverables?.map(d => d.id).filter(id => !!id) || [];

    const deliverablesToDelete = existingDeliverableIds.filter(id => !incomingDeliverableIds.includes(id));
    if (deliverablesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${deliverablesToDelete.length} deliverables`);
      const { error: deleteError } = await supabase.from('deliverables').delete().in('id', deliverablesToDelete);
      if (deleteError) {
        console.error("❌ API Route PUT: Error deleting deliverables:", deleteError);
        // Continue but maybe log this as a partial failure
      }
    }

    if (deliverables && deliverables.length > 0) {
      const deliverablesToUpsert = deliverables.map(d => ({
          ...d,
          projectId: projectId,
          createdBy: user.id,
      }));
      console.log(`💾 Upserting ${deliverablesToUpsert.length} deliverables`);
      const { error: deliverablesUpsertError } = await supabase.from('deliverables').upsert(deliverablesToUpsert);
      if (deliverablesUpsertError) {
          console.error("❌ API Route PUT: Error upserting deliverables:", deliverablesUpsertError);
          return NextResponse.json({ success: false, error: 'Failed to update deliverables.', details: deliverablesUpsertError }, { status: 500 });
      }
    }

    // 3. Handle Payment Terms (Upsert/Delete)
    console.log("🔧 API Route PUT: Processing payment terms");
    const { data: existingPaymentTerms } = await supabase.from('paymentTerms').select('id').eq('projectId', projectId);
    const existingPaymentTermIds = existingPaymentTerms?.map(pt => pt.id) || [];
    const incomingPaymentTermIds = paymentMilestones?.map(pm => pm.id).filter(id => !!id) || [];
    
    const paymentTermsToDelete = existingPaymentTermIds.filter(id => !incomingPaymentTermIds.includes(id));
    if (paymentTermsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${paymentTermsToDelete.length} payment terms`);
        const { error: deleteError } = await supabase.from('paymentTerms').delete().in('id', paymentTermsToDelete);
        if (deleteError) {
            console.error("❌ API Route PUT: Error deleting payment terms:", deleteError);
        }
    }
    
    if (paymentMilestones && paymentMilestones.length > 0) {
      const paymentTermsToUpsert = paymentMilestones.map(pm => ({
          ...pm,
          projectId: projectId,
          createdBy: user.id,
      }));
      console.log(`💾 Upserting ${paymentTermsToUpsert.length} payment terms`);
      const { error: paymentTermsUpsertError } = await supabase.from('paymentTerms').upsert(paymentTermsToUpsert);
      if (paymentTermsUpsertError) {
          console.error("❌ API Route PUT: Error upserting payment terms:", paymentTermsUpsertError);
          return NextResponse.json({ success: false, error: 'Failed to update payment terms.', details: paymentTermsUpsertError }, { status: 500 });
      }
    }

    // After all operations, fetch the complete project data to return
    const { data: finalProjectData } = await supabase.from("projects").select().eq("id", projectId).single();

    // Handle email sending if requested
    if (validationResult.data.emailToCustomer && validationResult.data.customerId) {
      console.log("📧 API Route PUT: Email to customer requested")
      try {
        console.log("📧 API Route PUT: Sending email to customer:", validationResult.data.customerId)
        const { data: customer } = await supabase
          .from("customers")
          .select("name, email")
          .eq("id", validationResult.data.customerId)
          .single();
        if (customer?.email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('profile_id', user.id)
            .single();

          const { data: organization } = await supabase
            .from('organization')
            .select('name, email, logoUrl')
            .eq('createdBy', user.id)
            .maybeSingle();

          const fromEmail = 'no_reply@projects.bexforte.com';
          
          let fromName = 'Bexforte Projects';
          if (organization?.name) {
            fromName = organization.name;
          } else if (profile?.email) {
            fromName = profile.email.split('@')[0];
          }

          const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";
          
          const emailHtml = await render(IssueProject({
            projectId: finalProjectData.id,
            clientName: customer.name || "",
            projectName: finalProjectData.name || "",
            senderName: fromName,
            logoUrl: logoUrl,
          }));

          await sendgrid.send({
            to: customer.email,
            from: { email: fromEmail, name: fromName },
            subject: `Update on Project: ${finalProjectData.name}`,
            html: emailHtml,
            customArgs: {
              projectId: finalProjectData.id,
              customerId: validationResult.data.customerId,
              userId: user.id,
              type: "project_sent",
            },
          });
          console.log("✅ API Route PUT: Email sent successfully")
        }
      } catch (emailError: any) {
        console.error("❌ API Route PUT: Email sending failed:", emailError)
        // Don't fail the whole request if email fails
      }
    }

    console.log("🏁 API Route PUT: Update process completed successfully")
    return NextResponse.json({ 
      success: true, 
      project: finalProjectData,
      message: "Project updated successfully" 
    });

  } catch (error) {
    console.error("❌ API Route PUT: Unexpected error occurred")
    console.error("📊 API Route PUT: Error details:", error)
    console.error("📊 API Route PUT: Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { success: false, error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}