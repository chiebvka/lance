import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { projectCreateSchema } from "@/validation/projects"
import { z } from "zod"
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueProject from '../../../../emails/IssueProject';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const { projectId } = context.params

  try {
    // Fetch the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("createdBy", user.id)
      .single()

    if (projectError) throw projectError
    if (!project) throw new Error("Project not found")

    // Fetch the customer
    let customer = null
    if (project.customerId) {
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("id", project.customerId)
        .single()
      if (customerError) throw customerError
      customer = customerData
    }

    // Fetch deliverables
    const { data: deliverables, error: deliverablesError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("projectId", projectId)
      .order("position", { ascending: true })

    if (deliverablesError) throw deliverablesError

    // Fetch payment terms (milestones)
    const { data: paymentTerms, error: paymentTermsError } = await supabase
      .from("paymentTerms")
      .select("*")
      .eq("projectId", projectId)
      .order("created_at", { ascending: true })

    if (paymentTermsError) throw paymentTermsError

    // Remap paymentTerms to paymentMilestones for frontend consistency
    const projectResponse = {
      ...project,
      customer,
      deliverables,
      paymentMilestones: paymentTerms,
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

export async function PUT(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const { projectId } = context.params
  const body = await request.json()

  try {
    const validation = projectCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const {
      deliverables: deliverablesData = [],
      paymentMilestones: paymentMilestonesData = [],
      emailToCustomer = false,
      ...projectData
    } = validation.data

    // --- Update the project ---
    const { error: projectError, data: updatedProject } = await supabase
      .from("projects")
      .update({
        ...projectData,
        updatedOn: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("createdBy", user.id)
      .select()
      .single();

    if (projectError) throw projectError

    // --- Deliverables Upsert ---
    // 1. Get existing deliverables for this project
    const { data: existingDeliverables } = await supabase
      .from("deliverables")
      .select("id")
      .eq("projectId", projectId);

    const existingDeliverableIds = (existingDeliverables || []).map(d => d.id);

    // 2. Upsert new/updated deliverables
    const deliverablesToUpsert = deliverablesData.map(d => ({
      ...d,
      projectId,
      createdBy: user.id,
    }));

    if (deliverablesToUpsert.length > 0) {
      const { error: deliverablesUpsertError } = await supabase
        .from("deliverables")
        .upsert(deliverablesToUpsert, { onConflict: "id" });
      if (deliverablesUpsertError) throw deliverablesUpsertError;
    }

    // 3. Delete deliverables that are no longer present
    const newDeliverableIds = deliverablesData.map(d => d.id);
    const deliverablesToDelete = existingDeliverableIds.filter(id => !newDeliverableIds.includes(id));
    if (deliverablesToDelete.length > 0) {
      const { error: deliverablesDeleteError } = await supabase
        .from("deliverables")
        .delete()
        .in("id", deliverablesToDelete);
      if (deliverablesDeleteError) throw deliverablesDeleteError;
    }

    // --- Payment Terms Upsert ---
    // 1. Get existing payment terms for this project
    const { data: existingPaymentTerms } = await supabase
      .from("paymentTerms")
      .select("id")
      .eq("projectId", projectId);

    const existingPaymentTermIds = (existingPaymentTerms || []).map(p => p.id);

    // 2. Upsert new/updated payment terms
    const paymentTermsToUpsert = paymentMilestonesData.map(p => ({
      ...p,
      projectId,
      createdBy: user.id,
    }));

    if (paymentTermsToUpsert.length > 0) {
      const { error: paymentTermsUpsertError } = await supabase
        .from("paymentTerms")
        .upsert(paymentTermsToUpsert, { onConflict: "id" });
      if (paymentTermsUpsertError) throw paymentTermsUpsertError;
    }

    // 3. Delete payment terms that are no longer present
    const newPaymentTermIds = paymentMilestonesData.map(p => p.id);
    const paymentTermsToDelete = existingPaymentTermIds.filter(id => !newPaymentTermIds.includes(id));
    if (paymentTermsToDelete.length > 0) {
      const { error: paymentTermsDeleteError } = await supabase
        .from("paymentTerms")
        .delete()
        .in("id", paymentTermsToDelete);
      if (paymentTermsDeleteError) throw paymentTermsDeleteError;
    }

    // --- Email to customer if required ---
    if (projectData.isPublished && emailToCustomer && updatedProject?.customerId) {
      const { data: customer } = await supabase
        .from("customers")
        .select("name, email")
        .eq("id", updatedProject.customerId)
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
          fromName = organization?.name;
        } else if (profile?.email) {
          fromName = profile.email.split('@')[0];
        }
        const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";

        const emailHtml = await render(IssueProject({
          projectId: updatedProject.id,
          clientName: customer.name || "",
          projectName: updatedProject.name,
          senderName: fromName,
          logoUrl: logoUrl,
        }));

        try {
          await sendgrid.send({
            to: customer.email,
            from: {
              email: fromEmail,
              name: fromName
            },
            subject: `Project ${updatedProject.name} Updated`,
            html: emailHtml,
            customArgs: {
              projectId: updatedProject.id,
              customerId: updatedProject.customerId,
              userId: user.id,
              type: "project_sent",
            },
          });
        } catch (emailError: any) {
          console.error("SendGrid Error:", emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
    })
  } catch (e) {
    const error = e as Error
    console.error(`Error updating project ${projectId}:`, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}