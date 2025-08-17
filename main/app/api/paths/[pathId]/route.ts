import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPathSchema } from '@/validation/paths'
import { render } from "@react-email/components"
import { baseUrl } from '@/utils/universal'
import sendgrid from "@sendgrid/mail"
import IssuePath from '@/emails/IssuePath'
import { ratelimit } from '@/utils/rateLimit'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

async function sendPathEmail(supabase: any, user: any, path: any, recipientEmailToUse: string | null,  organizationName: string, recepientName: string, pathName: string, token: string, logoUrl: string) {
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

    await sendgrid.send({
      to: recipientEmailToUse || "",
      from: `${fromName} <${fromEmail}>`,
      subject: `${senderName} sent you a path`,
      html: emailHtml
    });
    
  } catch (error) {
    console.error("SendGrid Error:", error);
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

export async function GET(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const { pathId } = params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: path, error: pathError } = await supabase
      .from('paths')
      .select(`*, project:projectId (id, name), customer:customerId (id, name), org:organizationId (id, name, email, logoUrl)`)
      .eq('id', pathId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const processJsonField = (field: any) => {
      if (typeof field === 'string' && (field.trim().startsWith('{') || field.trim().startsWith('['))) {
        try {
          return JSON.parse(field);
        } catch (error) {
          return field;
        }
      }
      return field;
    };

    const processedPath = {
      ...path,
      content: processJsonField(path.content),
      organizationLogoUrl: (path as any).org?.[0]?.logoUrl || null,
      organizationNameFromOrg: (path as any).org?.[0]?.name || null,
      organizationEmailFromOrg: (path as any).org?.[0]?.email || null,
    };

    return NextResponse.json({ success: true, path: processedPath });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const { pathId } = params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: existingPath, error: pathError } = await supabase
      .from('paths')
      .select('id, state, token')
      .eq('id', pathId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (pathError || !existingPath) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const body = await request.json();
    const { error, data } = createPathSchema.safeParse(body);

    if (error) {
      return NextResponse.json({ error: "Validation failed", details: error.format() }, { status: 400 });
    }
    
    const { action, name, description, content, customerId, protect = false, recipientEmail, recepientName } = data;

    const { data: organization } = await supabase
      .from("organization")
      .select("id, name, email, logoUrl")
      .eq("id", profile.organizationId)
      .single();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    let finalRecipientEmail = recipientEmail;
    let finalRecipientName = recepientName;

    if (customerId) {
      const customerDetails = await getCustomerDetails(supabase, customerId);
      finalRecipientEmail = customerDetails.email;
      finalRecipientName = customerDetails.name;
    }

    let state = existingPath.state || "draft";
    if (action === "publish" || action === "send_path") {
      state = "published";
    }

    let type = protect || customerId || recipientEmail ? "private" : "public";
    
    let token = existingPath.token;
    if ((protect || action === "send_path" || customerId || recipientEmail) && !token) {
      token = crypto.randomUUID();
    }

    const updatePayload = {
      name,
      description: description || null,
      content: content ?? { version: 1, entries: [] },
      customerId: customerId || null,
      state,
      type,
      token,
      private: type === "private",
      updatedAt: new Date().toISOString(),
      organizationName: organization.name,
      organizationLogo: organization.logoUrl,
      organizationEmail: organization.email,
      recepientEmail: finalRecipientEmail || null,
      recepientName: finalRecipientName || null,
    };

    const { data: updatedPath, error: updateError } = await supabase
      .from('paths')
      .update(updatePayload)
      .eq('id', pathId)
      .eq('organizationId', profile.organizationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update path' }, { status: 500 });
    }

    if (action === "send_path" && finalRecipientEmail) {
      await sendPathEmail(
        supabase, 
        user, 
        updatedPath, 
        finalRecipientEmail, 
        organization.name, 
        finalRecipientName || "Valued Customer", 
        updatedPath.name, 
        token || updatedPath.token, 
        organization.logoUrl
      );
    }

    return NextResponse.json({ 
      success: true, 
      path: updatedPath,
      message: action === "send_path" ? "Path updated and email sent" : 
               action === "publish" ? "Path published" : "Path updated"
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const { pathId } = params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organizationId")
      .eq("profile_id", user.id)
      .single();

    if (!profile?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("paths")
      .delete()
      .eq("id", pathId)
      .eq("organizationId", profile.organizationId);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete path" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
