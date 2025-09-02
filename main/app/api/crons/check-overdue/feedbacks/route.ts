import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import sendgrid from "@sendgrid/mail";
import { render } from "@react-email/components";
import FeedbackReminder from "@/emails/FeedbackReminder";
import { baseUrl } from "@/utils/universal";
import crypto from "crypto";

var validator = require('validator');

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
    const { data: overdueFeedback, error: queryError } = await supabase
      .from("feedbacks")
      .select("*")
      .lt("dueDate", now.toISOString())
      .neq("state", "overdue")
      .eq("state", "sent")
      .eq("allowReminders", true);

    if (queryError) {
      console.error("Error querying overdue feedback:", queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    if (!overdueFeedback || overdueFeedback.length === 0) {
      console.log("No overdue feedback found.");
      return NextResponse.json({ success: true, message: "No overdue feedback" }, { status: 200 });
    }

    let processedCount = 0;
    for (const feedback of overdueFeedback) {
      try {
        // Check organization's feedback notification preference
        const { data: organization, error: orgError } = await supabase
          .from("organization")
          .select("feedbackNotifications")
          .eq("id", feedback.organizationId)
          .single();

        if (orgError) {
          console.error(`Error fetching organization settings for feedback ${feedback.id}:`, orgError);
          continue;
        }

        // Update feedback state to overdue (always do this)
        const { error: updateError } = await supabase
          .from("feedbacks")
          .update({ state: "overdue" })
          .eq("id", feedback.id);

        if (updateError) {
          console.error(`Error updating feedback ${feedback.id}:`, updateError);
          continue;
        }

        // Only send emails and create notifications if organization has feedbackNotifications enabled
        // Note: null values default to true (enabled), only false explicitly disables
        if (organization?.feedbackNotifications !== false) {
          // Create notification for the organization
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              organizationId: feedback.organizationId,
              title: "Feedback Overdue",
              message: `Feedback "${feedback.name}" for ${feedback.recepientName || feedback.recepientEmail} is overdue.`,
              type: "warning",
              actionUrl: `${baseUrl}/protected/feedback?feedbackId=${feedback.id}`,
              metadata: {
                feedbackName: feedback.name,
                recipientName: feedback.recepientName,
                recipientEmail: feedback.recepientEmail,
                dueDate: feedback.dueDate
              },
              tableName: "feedbacks",
              tableId: feedback.id,
              state: "active"
            });

          if (notificationError) {
            console.error(`Error creating notification for feedback ${feedback.id}:`, notificationError);
            continue;
          }

          // Send reminder emails to both customer and organization
          await sendReminderEmails(supabase, feedback, "feedback");
          console.log(`Feedback reminder emails sent for feedback ${feedback.id}`);
        } else {
          console.log(`Skipping email and notification for feedback ${feedback.id} - organization has feedbackNotifications explicitly disabled (value: ${organization?.feedbackNotifications})`);
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing feedback ${feedback.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} overdue feedbacks` 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in check-overdue-feedback:", error);
    return NextResponse.json({ success: false, error: "Failed to process overdue feedback" }, { status: 500 });
  }
}

async function sendReminderEmails(supabase: any, feedback: any, type: string) {
  try {
    // Get organization details with fallbacks
    let organizationName = 'Bexforte';
    let organizationEmail = null;
    let logoUrl = "https://www.bexforte.com/favicon.ico";
    
    if (feedback.organizationId) {
      const { data: organization } = await supabase
        .from('organization')
        .select('name, email, logoUrl')
        .eq('id', feedback.organizationId)
        .single();

      if (organization) {
        organizationName = organization.name || feedback.organizationName || 'Bexforte';
        organizationEmail = organization.email || feedback.organizationEmail;
        logoUrl = organization.logoUrl || feedback.organizationLogo || "https://www.bexforte.com/favicon.ico";
      }
    }

    // If no organization email, try to get from profiles table via createdBy
    if (!organizationEmail && feedback.createdBy) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('profile_id', feedback.createdBy)
        .single();
      
      if (profile?.email) {
        organizationEmail = profile.email;
      }
    }

    // Ensure feedback has a token
    let token = feedback.token; 
    if (!token) {
      token = crypto.randomUUID();
      await supabase.from("feedbacks").update({ token }).eq("id", feedback.id);
    }

    const feedbackLink = `${baseUrl}/f/${feedback.id}?token=${token}`;

    // Prepare email targets
    const sendTargets: Array<{ to: string; name?: string; type: 'customer' | 'organization' }> = [];
    
    // Add customer email if available
    if (feedback.recepientEmail) {
      sendTargets.push({ 
        to: feedback.recepientEmail, 
        name: feedback.recepientName || feedback.recepientEmail.split('@')[0], 
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
        const emailHtml = await render(FeedbackReminder({
          feedbackId: feedback.id,
          clientName: target.name || 'Customer',
          feedbackName: feedback.name,
          logoUrl: logoUrl,
          feedbackLink,
        }));

        const fromEmail = 'no_reply@feedback.bexforte.com';
        const fromName = 'Bexbot';

        await sendgrid.send({
          to: target.to,
          from: `${fromName} <${fromEmail}>`,
          subject: `Reminder: Overdue Feedback - ${feedback.name}`,
          html: emailHtml,
          customArgs: {
            feedbackId: feedback.id,
            feedbackName: feedback.name || '',
            customerId: feedback.customerId || '',
            customerName: feedback.recepientName || '',
            organizationId: feedback.organizationId || '',
            userId: feedback.createdBy || '',
            type: 'feedback_overdue',
            token: token,
            recipientType: target.type,
          },
        });
        
        console.log(`Feedback reminder email sent to ${target.type}: ${target.to}`);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${target.type} (${target.to}):`, emailError);
        // Continue with other emails even if one fails
      }
    }
    
    if (sendTargets.length === 0) {
      console.warn(`No valid email addresses found for feedback ${feedback.id}`);
    }
    
  } catch (emailError: any) {
    console.error("SendGrid Reminder Error:", emailError);
  }
}