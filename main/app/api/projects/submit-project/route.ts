import { ratelimit } from "@/utils/rateLimit";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import ProjectSignoff from "@/emails/ProjectSignoff";
import { baseUrl } from "@/utils/universal";
import { isOrgSubscriptionActive, deriveInactiveReason } from "@/utils/subscription";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");



// Add GET route to fetch feedback data
export async function GET(request: Request) {
    // Use service role for token-gated, unauthenticated preview
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const token = searchParams.get('token');

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    try {
      // Fetch minimal project to determine type and subscription
      const { data: projectMeta, error: metaError } = await supabase
        .from('projects')
        .select(`
          id,
          type,
          state,
          token,
          organization:organizationId (
            id,
            logoUrl,
            name,
            email,
            subscriptionstatus,
            trialEndsAt
          )
        `)
        .eq('id', projectId)
        .maybeSingle();

      if (metaError || !projectMeta) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Gate by organization subscription (non-auth public preview)
      const orgStatus = (projectMeta as any)?.organization?.subscriptionstatus ?? null;
      const orgTrialEndsAt = (projectMeta as any)?.organization?.trialEndsAt ?? null;
      if (orgStatus !== undefined && orgStatus !== null) {
        if (!isOrgSubscriptionActive(orgStatus, orgTrialEndsAt)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Organization subscription inactive',
              reason: deriveInactiveReason(orgStatus, orgTrialEndsAt),
            },
            { status: 403 }
          );
        }
      }

      const isPersonal = (projectMeta as any)?.type === 'personal';

      // If personal, do not require token; otherwise require and validate
      if (!isPersonal) {
        if (!token) {
          return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }
        if ((projectMeta as any)?.token !== token) {
          return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
        }
      }

      // Fetch full project details
      const { data: project, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          state,
          status,
          description,
          customers:customers!projects_customerId_fkey(name,email),
          startDate,
          endDate,
          createdBy,
          organization:organization!projects_organizationId_fkey(id,name,logoUrl,email,subscriptionstatus,trialEndsAt),
          created_at,
          budget,
          currency,
          organizationName,
          organizationLogo,
          hasServiceAgreement,
          serviceAgreement,
          hasPaymentTerms,
          paymentStructure,
          signatureType,
          signatureDetails,
          signedOn,
          type,
          recepientEmail,
          recepientName
        `)
        .eq("id", projectId)
        .maybeSingle();

      console.log('[submit-project][GET] project:', project)

      if (error || !project) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
      }

      // If draft, do not allow viewing
      if ((project as any)?.state === 'draft') {
        return NextResponse.json({ error: 'Project is in draft mode' }, { status: 400 });
      }

      // Fetch related collections
      const { data: deliverables, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('id, name, description, dueDate, position, isPublished, status')
        .eq('projectId', projectId)
        .order('position', { ascending: true })

      if (deliverablesError) {
        console.error('[submit-project][GET] deliverables error:', deliverablesError)
      }

      const { data: paymentTerms, error: paymentTermsError } = await supabase
        .from('paymentTerms')
        .select('id, name, percentage, amount, dueDate, description, status, type')
        .eq('projectId', projectId)
        .order('created_at', { ascending: true })

      if (paymentTermsError) {
        console.error('[submit-project][GET] paymentTerms error:', paymentTermsError)
      }

      const response = {
        ...(project as any),
        deliverables: deliverables || [],
        paymentTerms: paymentTerms || [],
      }

      // Server-side log for terminal visibility
      // eslint-disable-next-line no-console
      console.log('[submit-project][GET] response:', JSON.stringify(response, null, 2))

      return NextResponse.json({ success: true, data: response }, { status: 200 });
    } catch (error) {
      console.error("Error fetching project:", error);
      return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
  }

export async function PATCH(request: Request) {
  // Use service role and constrain strictly by id + token
  const supabase = createServiceRoleClient();

  try {
    // Basic rate limit using IP (same approach as feedback submit)
    const ip = (request.headers as any).get?.("x-forwarded-for") || "anonymous";
    const { success: allowed } = await ratelimit.limit(ip);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json();
    const { projectId, token, signatureType, signatureDetails, serviceAgreement } = body as {
      projectId: string;
      token: string;
      signatureType: 'manual' | 'canvas';
      signatureDetails: any;
      serviceAgreement?: string;
    };

    if (!projectId || !token || !signatureType || !signatureDetails) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate link
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, state')
      .eq('id', projectId)
      .eq('token', token)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    if (project.state === 'draft') {
      return NextResponse.json({ success: false, error: 'Project is in draft mode' }, { status: 400 });
    }

    const signedOn = new Date().toISOString();
    const updatePayload: any = {
      signatureType,
      signatureDetails,
      signedOn,
      signedStatus: 'signed',
      status: 'signed',
    }
    if (serviceAgreement !== undefined) {
      updatePayload.serviceAgreement = serviceAgreement
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .eq('token', token);

    if (updateError) {
      console.error('Error updating project signature:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Fetch project + relations for notifications and email
    const { data: signedProject } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        token,
        organizationId,
        customerId,
        recepientEmail,
        recepientName,
        customers:customers!projects_customerId_fkey(name,email),
        organization:organization!projects_organizationId_fkey(name,email,logoUrl,projectNotifications)
      `)
      .eq('id', projectId)
      .maybeSingle();

    const customerRel: any = (signedProject as any)?.customers;
    const orgRel: any = (signedProject as any)?.organization;
    
    // Determine customer email with fallbacks
    const customerEmail = customerRel?.email || (signedProject as any)?.recepientEmail || null;
    const customerName = customerRel?.name || (signedProject as any)?.recepientName || 'Customer';
    
    // Determine organization email with fallbacks
    const organizationEmail = orgRel?.email || null;
    const organization = orgRel || null;
    const projectName = signedProject?.name || 'Project';

    // Create organization notification if enabled (default true unless explicitly false)
    if (organization && organization.projectNotifications !== false) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          organizationId: signedProject?.organizationId,
          title: 'Project Signed Off',
          message: `${customerName} signed off on ${projectName}.`,
          type: 'success',
          actionUrl: `${baseUrl}/protected/projects?projectId=${projectId}&type=details`,
          metadata: {
            projectId,
            projectName,
            customerName,
            signedOn,
            customerEmail,
            organizationEmail,
          },
          tableName: 'projects',
          tableId: projectId,
          state: 'active',
        });
      if (notifError) {
        console.error('Notification creation error:', notifError);
      }
    }

    // Send confirmation emails to customer and organization
    try {
      const logoUrl = organization?.logoUrl || 'https://www.bexoni.com/favicon.ico';
      const senderName = organization?.name || 'Bexforte';
      const projectLink = `${baseUrl}/p/${projectId}?token=${signedProject?.token || token}`;

      const emailHtml = await render(ProjectSignoff({
        senderName,
        clientName: customerName,
        projectName,
        projectId,
        logoUrl,
        projectLink,
      }));

      const fromEmail = 'no_reply@projects.bexforte.com';
      const fromName = senderName;

      // Prepare email targets with proper fallbacks
      const sendTargets: Array<{ to: string; name?: string; type: 'customer' | 'organization' }> = [];
      
      // Add customer email if available
      if (customerEmail) {
        sendTargets.push({ 
          to: customerEmail, 
          name: customerName, 
          type: 'customer' 
        });
      }
      
      // Add organization email if available
      if (organizationEmail) {
        sendTargets.push({ 
          to: organizationEmail, 
          name: organization?.name || 'Organization', 
          type: 'organization' 
        });
      }

      // Send emails to all targets
      for (const target of sendTargets) {
        try {
          await sendgrid.send({
            to: target.to,
            from: `${fromName} <${fromEmail}>`,
            subject: `Project Signed Off: ${projectName}`,
            html: emailHtml,
            customArgs: {
              projectId: signedProject?.id,
              projectName: projectName || '',
              customerId: signedProject?.customerId || "",
              customerName: customerName || '',
              organizationId: signedProject?.organizationId || '',
              userId: signedProject?.customerId || "",
              type: 'project_signed',
              recipientType: target.type,
            },
          });
          
          console.log(`[submit-project] Email sent successfully to ${target.type}: ${target.to}`);
        } catch (emailError: any) {
          console.error(`[submit-project] Failed to send email to ${target.type} (${target.to}):`, emailError);
          // Continue with other emails even if one fails
        }
      }
      
      if (sendTargets.length === 0) {
        console.warn('[submit-project] No valid email addresses found for customer or organization');
      }
      
    } catch (emailErr: any) {
      console.error('Project signoff email error:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Project signed successfully', signedOn }, { status: 200 });
  } catch (error) {
    console.error('Error in submit-project PATCH:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit project signature' }, { status: 500 });
  }
}
