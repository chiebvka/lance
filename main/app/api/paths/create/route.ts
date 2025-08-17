import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createPathSchema } from "@/validation/paths"
import { ratelimit } from "@/utils/rateLimit";
import { baseUrl } from "@/utils/universal";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssuePath from "@/emails/IssuePath";
var validator = require('validator');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 
      request.headers.get('x-real-ip') ?? 
      '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          limit,
          reset,
          remaining
        }, 
        { status: 429 }
      );
    }

    // Simple rate limiting - check if user has made too many requests recently
    const { data: recentPaths } = await supabase
      .from("paths")
      .select("id")
      .eq("createdBy", user.id)
      .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Last minute
    
    if (recentPaths && recentPaths.length > 10) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const { error, data } = createPathSchema.safeParse(body)

    if (error) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.format() 
      }, { status: 400 })
    }

    const {
      action,
     
      description,
      content,
      customerId,
      name,
      protect = false,
      recipientEmail,
      recepientName,
    } = data

    // Get user profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organizationId, email")
      .eq("profile_id", user.id)
      .single()

    if (!profile?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    // Generate token if protect is true or sending to someone
    let token = null
    const nowIso = new Date().toISOString()

    if (protect || action === "send_path" || customerId || recipientEmail) {
      token = crypto.randomUUID()
    }

    // Determine state (draft or published)
    let state = "draft"
    if (action === "publish" || action === "send_path") {
      state = "published"
    }

    // Determine type (private or public based on token/protect)
    let type = "public"
    if (protect || token) {
      type = "private"
    }

    // Create default content if none provided
    const defaultContent = {
      version: 1,
      entries: []
    }

    // Get organization details
    const { data: organization } = await supabase
    .from("organization")
    .select("id, name, email, logoUrl")
    .eq("id", profile.organizationId)
    .single()

    if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const organizationLogoUrl = organization.logoUrl || null
    const organizationEmail = organization.email || profile.email
    const organizationName = organization.name

    // Get customer details if customerId is provided
    let finalRecipientEmail = recipientEmail;
    let finalRecipientName = recepientName;

    if (customerId) {
        const customerDetails = await getCustomerDetails(supabase, customerId);
        finalRecipientEmail = customerDetails.email;
        finalRecipientName = customerDetails.name;
    }

    const insertPayload = {
      name,
      description: description || null,
      content: content || defaultContent,
      customerId: customerId || null,
      state,
      type,
      token,
      private: type === "private",
      createdBy: user.id,
      organizationId: organization.id,
      organizationName,
      organizationLogo: organizationLogoUrl,
      organizationEmail,
      recepientEmail: finalRecipientEmail || null,
      recepientName: finalRecipientName || null,
      created_at: nowIso,
      analytics: null
    }

    const { data: path, error: insertError } = await supabase
      .from("paths")
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error("Path insert error:", insertError)
      return NextResponse.json({ error: "Failed to create path" }, { status: 500 })
    }

    // TODO: Implement email sending if needed
    if (action === "send_path" && finalRecipientEmail) {
        try {
            const pathUrl = protect 
            ? `${baseUrl}/p/${path.id}?token=${token}`
            : `${baseUrl}/p/${path.id}`

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!finalRecipientEmail || !emailRegex.test(finalRecipientEmail) || !validator.isEmail(finalRecipientEmail)) {
                return NextResponse.json({ 
                    success: false, 
                    error: "Invalid email address. Please provide a valid email format." 
                }, { status: 400 });
            }
            console.log('Would send path email:', {
              to: finalRecipientEmail,
              pathTitle: name,
              recipientName: recepientName,
            })
            await sendPathEmail(supabase, user, path, pathUrl, finalRecipientEmail, organizationName, finalRecipientName || "", name, token || "", organizationLogoUrl);
        } catch (emailError) {
            console.error("Email send error:", emailError)   
        }
    }

    return NextResponse.json({ 
      success: true, 
      path,
      message: action === "send_path" ? "Path created and email sent" : 
               action === "publish" ? "Path published" : "Draft saved"
    })

  } catch (error) {
    console.error("Path creation error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

async function getCustomerDetails(supabase: any, customerId: string): Promise<{ email: string | null; name: string | null }> {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, name")
      .eq("id", customerId)
      .single()
    
    return {
      email: customer?.email || null,
      name: customer?.name || null
    }
  }

async function sendPathEmail(supabase: any, user: any, path: any, pathUrl: string, recipientEmailToUse: string | null, organizationName: string, recepientName: string, pathName: string, token: string, logoUrl: string) {

try {




    const fromEmail = 'no_reply@notifications.bexforte.com';

    const fromName = 'Bexbot';
    const senderName = organizationName || 'Bexforte';

    const finalLogoUrl = logoUrl || "https://www.bexoni.com/favicon.ico";

    const emailHtml = await render(IssuePath({
    pathId: path.id,
    clientName: recepientName || "Valued Customer",
    pathName: pathName || "Path",
    senderName: senderName,
    logoUrl: finalLogoUrl,
    pathLink: `${baseUrl}/pa/${path.id}?token=${token}`,
    }));

    console.log(`Attempting to send wall email from: ${fromEmail} to: ${recipientEmailToUse}`);

    await sendgrid.send({
        to: recipientEmailToUse || "",
        from: `${fromName} <${fromEmail}>`,
        subject: `${senderName} sent you a wall`,
        html: emailHtml
    });

    console.log("Wall email sent to:", recipientEmailToUse);
    
} catch (error) {
    console.error("SendGrid Error:", error);
}

}
