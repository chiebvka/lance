import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createWallSchema } from "@/validation/wall"
import IssueWall from "@/emails/IssueWall"
import slugify from "slugify"
import { baseUrl } from "@/utils/universal";
import { ratelimit } from "@/utils/rateLimit";

import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
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
    const { data: recentWalls } = await supabase
      .from("walls")
      .select("id")
      .eq("createdBy", user.id)
      .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Last minute
    
    if (recentWalls && recentWalls.length > 10) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const { error, data } = createWallSchema.safeParse(body)

    if (error) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.format() 
      }, { status: 400 })
    }

    const {
      action,
      name,
      description,
      notes,
      content,
      customerId,
      projectId,
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

    // Generate slug and token
    let slug = null
    let token = null
    const nowIso = new Date().toISOString()

    // Temporarily disable slug generation for public walls
    // if (action === "publish" && !protect) {
    //   // Only slugify if publishing and not protected
    //   slug = slugify(name, { lower: true, strict: true })
    //   
    //   // Check for slug uniqueness
    //   const { data: existingWall } = await supabase
    //     .from("walls")
    //     .select("id")
    //     .eq("slug", slug)
    //     .eq("organizationId", organization.id)
    //     .single()

    //   if (existingWall) {
    //     slug = `${slug}-${Date.now()}`
    //   }
    // }

    // Get customer details if customerId is provided
    let finalRecipientEmail = recipientEmail;
    let finalRecipientName = recepientName;

    if (customerId) {
      const customerDetails = await getCustomerDetails(supabase, customerId);
      finalRecipientEmail = customerDetails.email;
      finalRecipientName = customerDetails.name;
    }

    // Generate token if protect is true, sending to customer, or has recipient email
    if (protect || action === "send_wall" || customerId || recipientEmail) {
      token = crypto.randomUUID()
    }

    // Determine state (draft or published)
    let state = "draft"
    if (action === "publish" || action === "send_wall") {
      state = "published"
    }

    // Determine type (private or public based on token/protect)
    let type = "public"
    if (protect || token) {
      type = "private"
    }

    // Process content to ensure Cloudflare URLs are properly stored
    let processedContent = content
    if (content?.blocks) {
      processedContent = {
        ...content,
        blocks: content.blocks.map((block: any) => {
          // For image blocks, ensure the fileId contains the Cloudflare URL
          if (block.type === "image" && block.props?.fileId) {
            return {
              ...block,
              props: {
                ...block.props,
                // Store the Cloudflare URL for frontend display
                cloudflareUrl: block.props.fileId,
                fileId: block.props.fileId
              }
            }
          }
          // For video blocks, ensure the fileId contains the Cloudflare URL
          if (block.type === "video" && block.props?.fileId) {
            return {
              ...block,
              props: {
                ...block.props,
                // Store the Cloudflare URL for frontend display
                cloudflareUrl: block.props.fileId,
                fileId: block.props.fileId
              }
            }
          }
          // For file blocks, ensure the fileId contains the Cloudflare URL
          if (block.type === "file" && block.props?.fileId) {
            return {
              ...block,
              props: {
                ...block.props,
                // Store the Cloudflare URL for frontend display
                cloudflareUrl: block.props.fileId,
                fileId: block.props.fileId
              }
            }
          }
          return block
        })
      }
    }

    const insertPayload = {
      name,
      description: description || null,
      notes: notes || null,
      content: processedContent ?? { version: 1, blocks: [] },
      customerId: customerId || null,
      projectId: projectId || null,
      slug,
      state,
      type,
      token,
      private: type === "private", // Keep for backward compatibility if needed
      createdBy: user.id,
      organizationId: organization.id,
      organizationName,
      organizationLogo: organizationLogoUrl,
      organizationEmail,
      recepientEmail: finalRecipientEmail || null,
      recepientName: finalRecipientName || null,
      created_at: nowIso,
      issueDate: state === "published" ? nowIso : null,
    }

    const { data: wall, error: insertError } = await supabase
      .from("walls")
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error("Wall insert error:", insertError)
      return NextResponse.json({ error: "Failed to create wall" }, { status: 500 })
    }

    // Send email if requested
    if (action === "send_wall" && finalRecipientEmail) {
      try {
        const wallUrl = protect 
          ? `${baseUrl}/w/${wall.id}?token=${token}`
          : `${baseUrl}/w/${wall.id}`

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!finalRecipientEmail || !emailRegex.test(finalRecipientEmail) || !validator.isEmail(finalRecipientEmail)) {
            return NextResponse.json({ 
                success: false, 
                error: "Invalid email address. Please provide a valid email format." 
            }, { status: 400 });
        }

        // For now, just log the email details since we're not implementing the full email system
        console.log('Would send wall email:', {
          to: finalRecipientEmail,
          wallName: name,
          wallUrl,
          organizationName,
          notes: notes || undefined,
          customerName: finalRecipientName || undefined,
        })
        
        await sendWallEmail(supabase, user, wall, finalRecipientEmail, organizationName, finalRecipientName || "", name, token || "", organizationLogoUrl);
      } catch (emailError) {
        console.error("Email send error:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      wall,
      message: action === "send_wall" ? "Wall created and email sent" : 
               action === "publish" ? "Wall published" : "Draft saved"
    })

  } catch (error) {
    console.error("Wall creation error:", error)
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

async function getCustomerEmail(supabase: any, customerId: string): Promise<string | null> {
  const { data: customer } = await supabase
    .from("customers")
    .select("email")
    .eq("id", customerId)
    .single()
  
  return customer?.email || null
}


async function sendWallEmail(supabase: any, user: any, wall: any, recipientEmailToUse: string | null,  organizationName: string, recepientName: string, wallName: string, token: string, logoUrl: string) {

  try {




    const fromEmail = 'no_reply@notifications.bexforte.com';

    const fromName = 'Bexbot';
    const senderName = organizationName || 'Bexforte';

    const finalLogoUrl = logoUrl || "https://www.bexoni.com/favicon.ico";

    const emailHtml = await render(IssueWall({
      wallId: wall.id,
      clientName: recepientName || "Valued Customer",
      wallName: wallName || "Wall",
      senderName: senderName,
      logoUrl: finalLogoUrl,
      wallLink: `${baseUrl}/w/${wall.id}?token=${token}`,
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