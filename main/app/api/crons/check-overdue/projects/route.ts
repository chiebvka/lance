import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { baseUrl } from "@/utils/universal";
import ProjectReminder from "@/emails/ProjectReminder";
import crypto from "crypto";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(request: NextRequest) {
  // 1. Secret token check
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();

  try {
    // Find overdue projects that haven't been signed and haven't been marked as overdue yet
    const { data: overdueProjects, error: queryError } = await supabase
      .from("projects")
      .select(`
        *,
        customers:customerId (name, email),
        organization:organizationId (name, logoUrl, projectNotifications)
      `)
      .lt("endDate", now.toISOString())
      .neq("signedStatus", "signed")
      .neq("status", "overdue")
      .eq("status", "pending")
      .eq("state", "published")
      .eq("type", "customer")
      .eq("isPublished", true); // Only check published projects

    if (queryError) {
      console.error("Error querying overdue projects:", queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (!overdueProjects || overdueProjects.length === 0) {
      console.log("No overdue projects found.");
      return NextResponse.json({ success: true, message: "No overdue projects" }, { status: 200 });
    }

    let processedCount = 0;
    for (const project of overdueProjects) {
      try {
        // Organization is joined in the initial query; avoid separate fetch to prevent null UUID errors
        const organization = (project as any).organization || null;

        // Update project status to overdue (always do this)
        const { error: updateError } = await supabase
          .from("projects")
          .update({ status: "overdue" })
          .eq("id", project.id);

        if (updateError) {
          console.error(`Error updating project ${project.id}:`, updateError);
          continue;
        }

        // Only send emails and create notifications if organization has projectNotifications enabled
        // Note: null defaults to enabled; only explicit false disables
        if (organization?.projectNotifications !== false) {
          // Create notification for the organization
          if (project.organizationId) {
            const { error: notificationError } = await supabase
              .from("notifications")
              .insert({
                organizationId: project.organizationId,
                title: "Project Overdue",
                message: `Project "${project.name}" for ${project.customers?.name || 'Unknown Customer'} is overdue for signoff.`,
                type: "warning",
                actionUrl: `${baseUrl}/protected/projects?projectId=${project.id}`,
                metadata: {
                  projectName: project.name,
                  customerName: project.customers?.name,
                  endDate: project.endDate,
                  budget: project.budget,
                  currency: project.currency
                },
                tableName: "projects",
                tableId: project.id,
                state: "active"
              });

            if (notificationError) {
              console.error(`Error creating notification for project ${project.id}:`, notificationError);
            }
          }

          // Send email reminders to both customer and organization
          await sendProjectReminderEmails(supabase, project, organization);
          console.log(`Project reminder emails sent for project ${project.id}`);
        } else {
          console.log(`Skipping email and notification for project ${project.id} - organization has projectNotifications disabled`);
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} overdue projects` 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in check-overdue-projects:", error);
    return NextResponse.json({ success: false, error: "Failed to process overdue projects" }, { status: 500 });
  }
}

async function sendProjectReminderEmails(supabase: any, project: any, organization: any) {
  try {
    // Get organization details with fallbacks
    let organizationName = 'Bexforte';
    let organizationEmail = null;
    let logoUrl = "https://www.bexforte.com/favicon.ico";
    
    if (organization) {
      organizationName = organization.name || project.organizationName || 'Bexforte';
      organizationEmail = organization.email || project.organizationEmail;
      logoUrl = organization.logoUrl || project.organizationLogo || "https://www.bexforte.com/favicon.ico";
    }

    // If no organization email, try to get from profiles table via createdBy
    if (!organizationEmail && project.createdBy) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('profile_id', project.createdBy)
        .single();
      
      if (profile?.email) {
        organizationEmail = profile.email;
      }
    }

    // Ensure project has a token; generate and persist if missing
    let token = project.token;
    if (!token) {
      token = crypto.randomUUID();
      await supabase.from('projects').update({ token }).eq('id', project.id);
    }

    // Prepare email targets
    const sendTargets: Array<{ to: string; name?: string; type: 'customer' | 'organization' }> = [];
    
    // Add customer email if available
    const customerEmail = project.customers?.email || project.recepientEmail;
    if (customerEmail) {
      sendTargets.push({ 
        to: customerEmail, 
        name: project.customers?.name || customerEmail.split('@')[0], 
        type: 'customer' 
      });
    }
    
    // Add organization email if available
    if (organizationEmail) {
      sendTargets.push({ 
        to: organizationEmail, 
        name: organizationName, 
        type: 'organization' 
      });
    }

    // Send emails to all targets
    for (const target of sendTargets) {
      try {
        const emailHtml = await render(ProjectReminder({
          projectId: project.id,
          clientName: target.name || 'Customer',
          projectName: project.name,
          logoUrl: logoUrl,
          // Use public preview link that requires token
          projectLink: `${baseUrl}/p/${project.id}?token=${token}`
        }));

        const fromEmail = 'no_reply@projects.bexforte.com';
        const fromName = 'Bexbot';

        await sendgrid.send({
          to: target.to,
          from: `${fromName} <${fromEmail}>`,
          subject: `Project Overdue - ${project.name}`,
          html: emailHtml,
          customArgs: {
            projectId: project.id,
            projectName: project.name || '',
            customerId: project.customerId || '',
            customerName: project.customers?.name || '',
            organizationId: project.organizationId || '',
            userId: project.createdBy || '',
            type: 'project_overdue',
            recipientType: target.type,
          },
        });
        
        console.log(`Project reminder email sent to ${target.type}: ${target.to}`);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${target.type} (${target.to}):`, emailError);
        // Continue with other emails even if one fails
      }
    }
    
    if (sendTargets.length === 0) {
      console.warn(`No valid email addresses found for project ${project.id}`);
    }
    
  } catch (emailError: any) {
    console.error("SendGrid Project Reminder Error:", emailError);
  }
} 