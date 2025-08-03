import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import { baseUrl } from "@/utils/universal";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(request: NextRequest) {
  // 1. Secret token check
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();

  try {
    // Find overdue projects that haven't been signed and haven't been marked as overdue yet
    const { data: overdueProjects, error: queryError } = await supabase
      .from("projects")
      .select(`
        *,
        customers!inner(name, email)
      `)
      .lt("endDate", now.toISOString())
      .neq("signedStatus", "signed")
      .neq("status", "overdue")
      .eq("allowReminders", true)
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
        // Update project status to overdue
        const { error: updateError } = await supabase
          .from("projects")
          .update({ status: "overdue" })
          .eq("id", project.id);

        if (updateError) {
          console.error(`Error updating project ${project.id}:`, updateError);
          continue;
        }

        // Create notification for the organization
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            organizationId: project.organizationId,
            title: "Project Overdue",
            message: `Project "${project.name}" for ${project.customers?.name || 'Unknown Customer'} is overdue for signoff.`,
            type: "warning",
            actionUrl: `${baseUrl}/protected/projects/${project.id}`,
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
          continue;
        }

        // Send email reminder if customer email exists
        if (project.customers?.email) {
          await sendProjectReminderEmail(project);
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

async function sendProjectReminderEmail(project: any) {
  try {
    const fromEmail = 'no_reply@bexforte.com';
    const fromName = 'Bexforte';
    
    const emailHtml = `
      <h2>Project Overdue Reminder</h2>
      <p>Dear ${project.customers?.name},</p>
      <p>This is a reminder that project "${project.name}" is overdue for signoff.</p>
      <p><strong>End Date:</strong> ${new Date(project.endDate).toLocaleDateString()}</p>
      ${project.budget ? `<p><strong>Budget:</strong> ${project.currency} ${project.budget}</p>` : ''}
      <p>Please review and sign off on this project as soon as possible.</p>
    `;

    await sendgrid.send({
      to: project.customers.email,
      from: `${fromName} <${fromEmail}>`,
      subject: `Project Overdue - ${project.name}`,
      html: emailHtml,
    });

    console.log("Project reminder email sent to:", project.customers.email);
  } catch (emailError: any) {
    console.error("SendGrid Project Reminder Error:", emailError);
  }
} 