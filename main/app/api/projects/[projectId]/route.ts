import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { projectEditSchema } from "@/validation/projects"
import { z } from "zod"
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueProject from '../../../../emails/IssueProject';
import crypto from "crypto";
import { baseUrl } from "@/utils/universal";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

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
  const { projectId } = params

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
  const { projectId } = params
  const body = await request.json()

  console.log('[API][PUT] Incoming body:', body);

  // Ensure user is tied to an organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organizationId, email')
    .eq('profile_id', user.id)
    .single();

  if (profileError || !profile?.organizationId) {
    return NextResponse.json({ error: 'You must be part of an organization to update projects.' }, { status: 403 });
  }

  // Load existing project to validate ownership/org and to compare fields
  const { data: existingProject, error: existingError } = await supabase
    .from('projects')
    .select('id, createdBy, organizationId, state, customerId, token, status')
    .eq('id', projectId)
    .single();

  if (existingError || !existingProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (existingProject.createdBy !== user.id || existingProject.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: 'Unauthorized to update this project' }, { status: 403 });
  }

  try {
    const validation = projectEditSchema.safeParse(body)
    if (!validation.success) {
      console.error('[API][PUT] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }
    console.log('[API][PUT] Validation success. Data:', validation.data);
    const {
      deliverables: deliverablesData = [],
      paymentMilestones: paymentMilestonesData = [],
      emailToCustomer = false,
      ...projectData
    } = validation.data

    // Decide on token rotation/deletion rules
    const prevState = existingProject.state as 'draft' | 'published'
    const prevCustomerId = existingProject.customerId as string | null
    const prevToken = existingProject.token as string | null
    const prevStatus = existingProject.status as string | null

    const nextState = (projectData.state ?? prevState) as 'draft' | 'published'
    const nextCustomerId = projectData.customerId !== undefined ? projectData.customerId : prevCustomerId
    const nextStatus = (projectData.status ?? prevStatus) as string | null

    const firstPublishWithCustomer = prevState === 'draft' && nextState === 'published' && !!nextCustomerId
    const customerChanged = (projectData.customerId !== undefined) && projectData.customerId !== prevCustomerId && !!nextCustomerId
    const cancelling = nextStatus === 'cancelled'

    let shouldRotateToken = false
    let newToken: string | null = null
    if (cancelling) {
      newToken = null
    } else if (firstPublishWithCustomer || customerChanged) {
      shouldRotateToken = true
      newToken = crypto.randomUUID()
    }

    // --- Update the project ---
    const updatePayload: any = {
      ...projectData,
      updatedOn: new Date().toISOString(),
    }

    if (cancelling) {
      updatePayload.token = null
    } else if (shouldRotateToken && newToken) {
      updatePayload.token = newToken
    }

    const { error: projectError, data: updatedProject } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", projectId)
      .eq("createdBy", user.id)
      .eq('organizationId', profile.organizationId)
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
    const deliverablesToUpsert = deliverablesData.map((d: any) => ({
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
    const newDeliverableIds = deliverablesData.map((d: any) => d.id);
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
    // Defensive cleanup: set deliverableId to null for type 'milestone'
    const paymentTermsToUpsert = paymentMilestonesData.map((p: any) => ({
      ...p,
      deliverableId: p.type === 'milestone' ? null : p.deliverableId,
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
    const newPaymentTermIds = paymentMilestonesData.map((p: any) => p.id);
    const paymentTermsToDelete = existingPaymentTermIds.filter(id => !newPaymentTermIds.includes(id));
    if (paymentTermsToDelete.length > 0) {
      const { error: paymentTermsDeleteError } = await supabase
        .from("paymentTerms")
        .delete()
        .in("id", paymentTermsToDelete);
      if (paymentTermsDeleteError) throw paymentTermsDeleteError;
    }

    // --- Email to customer if required ---
    if (
      updatedProject?.state === 'published' &&
      updatedProject?.customerId &&
      !cancelling &&
      (emailToCustomer || firstPublishWithCustomer || customerChanged)
    ) {
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
        let fromName = 'Bexbot';
       
        const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";

        const tokenForEmail = updatedProject.token as string | null;
        const projectLink = tokenForEmail ? `${baseUrl}/p/${updatedProject.id}?token=${tokenForEmail}` : undefined;

        const emailHtml = await render(IssueProject({
          projectId: updatedProject.id,
          clientName: customer.name || "",
          projectName: updatedProject.name,
          senderName: fromName,
          logoUrl: logoUrl,
          projectLink,
        }));

        const fromField = `${fromName} <${fromEmail}>`;

        try {
          await sendgrid.send({
            to: customer.email,
            from: fromField,
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
    console.error(`[API][PUT] Error updating project ${projectId}:`, error.message, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

  const { params } = context
  const { projectId } = params

  // Action payload schema
  const actionSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('cancel') }),
    z.object({ action: z.literal('unassign') }),
    z.object({ action: z.literal('assign'), customerId: z.string().uuid(), emailToCustomer: z.boolean().optional() }),
    z.object({ action: z.literal('mark_completed'), completedDate: z.string() }),
  ])

  try {
    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    // Ensure user tied to org
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId, email')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'You must be part of an organization.' }, { status: 403 })
    }

    // Load existing project
    const { data: existingProject, error: existingError } = await supabase
      .from('projects')
      .select('id, createdBy, organizationId, type, status, customerId, token, name, organizationName')
      .eq('id', projectId)
      .single()

    if (existingError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (existingProject.createdBy !== user.id || existingProject.organizationId !== profile.organizationId) {
      return NextResponse.json({ error: 'Unauthorized to update this project' }, { status: 403 })
    }

    const action = parsed.data.action

    if (action === 'cancel') {
      // Cancel the project: set status cancelled and delete token
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: 'cancelled', token: null, updatedOn: new Date().toISOString() })
        .eq('id', projectId)
        .eq('createdBy', user.id)
        .eq('organizationId', profile.organizationId)
      if (updateError) throw updateError
      return NextResponse.json({ success: true, message: 'Project cancelled' })
    }

    if (action === 'unassign') {
      // Only meaningful if currently customer-type
      const updatePayload: any = {
        updatedOn: new Date().toISOString(),
      }
      if ((existingProject.type || '').toLowerCase() === 'customer') {
        updatePayload.type = 'personal'
        updatePayload.customerId = null
        updatePayload.recepientName = null
        updatePayload.recepientEmail = null
        updatePayload.token = null
      }
      const { error: updateError } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', projectId)
        .eq('createdBy', user.id)
        .eq('organizationId', profile.organizationId)
      if (updateError) throw updateError
      return NextResponse.json({ success: true, message: 'Project unassigned' })
    }

    if (action === 'assign') {
      const { customerId, emailToCustomer } = parsed.data

      // Fetch customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', customerId)
        .single()
      if (customerError || !customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const newToken = crypto.randomUUID()

      const { error: updateError, data: updatedProject } = await supabase
        .from('projects')
        .update({
          type: 'customer',
          customerId,
          recepientName: customer.name,
          recepientEmail: customer.email,
          token: newToken,
          updatedOn: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('createdBy', user.id)
        .eq('organizationId', profile.organizationId)
        .select()
        .single()
      if (updateError) throw updateError

      // Email the customer immediately if requested
      if (emailToCustomer && updatedProject && customer.email) {
        const { data: organization } = await supabase
          .from('organization')
          .select('name, email, logoUrl')
          .eq('createdBy', user.id)
          .maybeSingle()

        const fromEmail = 'no_reply@projects.bexforte.com'
        let fromName = 'Bexforte Projects'
        if (organization?.name) {
          fromName = organization.name
        } else if (profile?.email) {
          fromName = profile.email.split('@')[0]
        }
        const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico"
        const projectLink = `${baseUrl}/p/${updatedProject.id}?token=${newToken}`

        const emailHtml = await render(IssueProject({
          projectId: updatedProject.id,
          clientName: customer.name || '',
          projectName: updatedProject.name,
          senderName: fromName,
          logoUrl: logoUrl,
          projectLink,
        }))

        try {
          await sendgrid.send({
            to: customer.email,
            from: { email: fromEmail, name: fromName },
            subject: `Project ${updatedProject.name} Updated`,
            html: emailHtml,
            customArgs: {
              projectId: updatedProject.id,
              customerId: updatedProject.customerId,
              userId: user.id,
              type: 'project_sent',
            },
          })
        } catch (emailError: any) {
          console.error('SendGrid Error:', emailError)
        }
      }

      return NextResponse.json({ success: true, message: 'Project assigned to customer' })
    }

    if (action === 'mark_completed') {
      const parsedDate = new Date(parsed.data.completedDate)
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date supplied' }, { status: 400 })
      }
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: 'completed', updatedOn: parsedDate.toISOString() })
        .eq('id', projectId)
        .eq('createdBy', user.id)
        .eq('organizationId', profile.organizationId)
      if (updateError) throw updateError
      return NextResponse.json({ success: true, message: 'Project marked as completed' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const error = e as Error
    console.error(`[API][PATCH] Error updating project ${projectId}:`, error.message, error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
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

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const { params } = context;
  const { projectId } = params

  try {
    // Ensure user is tied to an organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();
    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'You must be part of an organization to delete projects.' }, { status: 403 });
    }

    const { error: projectDeleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("createdBy", user?.id)
      .eq('organizationId', profile.organizationId)

    if (projectDeleteError) throw projectDeleteError

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (e) {
    const error = e as Error
    console.error(`Error deleting project ${projectId}:`, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}