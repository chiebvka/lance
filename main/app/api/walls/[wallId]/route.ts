import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createWallSchema } from '@/validation/wall';
import { deleteFileFromR2 } from '@/lib/r2';
import { render } from "@react-email/components";
import { baseUrl } from '@/utils/universal';
import sendgrid from "@sendgrid/mail";
import IssueWall from '@/emails/IssueWall';
import { ratelimit } from '@/utils/rateLimit';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

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

// Helper function to get customer details
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

// Helper function to get customer email
async function getCustomerEmail(supabase: any, customerId: string): Promise<string | null> {
  const { data: customer } = await supabase
    .from("customers")
    .select("email")
    .eq("id", customerId)
    .single()
  
  return customer?.email || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  const { wallId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get wall with all related data
    const { data: wall, error: wallError } = await supabase
      .from('walls')
      .select(`
        id,
        name,
        description,
        state,
        slug,
        token,
        type,
        issueDate,
        created_at,
        updatedAt,
        createdBy,
        recepientName,
        recepientEmail,
        notes,
        content,
        private,
        organizationName,
        organizationLogo,
        organizationEmail,
        customerId,
        projectId,
        organizationId,
        project:projectId (id, name),
        customer:customerId (id, name),
        org:organizationId (id, name, email, logoUrl)
      `)
      .eq('id', wallId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (wallError || !wall) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    // Process JSON fields and flatten relations
    const processJsonField = (field: any) => {
      if (typeof field === 'string' && (field.trim().startsWith('{') || field.trim().startsWith('['))) {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.warn('Failed to parse JSON field:', field);
          return field;
        }
      }
      return field;
    };

    const processedWall = {
      id: wall.id,
      name: wall.name,
      description: wall.description,
      state: wall.state,
      slug: wall.slug,
      token: wall.token,
      type: wall.type,
      issueDate: wall.issueDate,
      updatedAt: wall.updatedAt,
      created_at: wall.created_at,
      notes: wall.notes,
      content: processJsonField(wall.content),
      private: wall.private,
      customerId: wall.customerId,
      projectId: wall.projectId || null,
      organizationId: wall.organizationId,
      projectNameFromProject: wall.project?.[0]?.name || null,
      organizationName: wall.organizationName,
      organizationLogo: wall.organizationLogo,
      organizationEmail: wall.organizationEmail,
      organizationLogoUrl: wall.org?.[0]?.logoUrl || null,
      organizationNameFromOrg: wall.org?.[0]?.name || null,
      organizationEmailFromOrg: wall.org?.[0]?.email || null,
      recepientName: wall.recepientName,
      recepientEmail: wall.recepientEmail,
    };

    return NextResponse.json({ success: true, wall: processedWall });
  } catch (error) {
    console.error('Wall fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  const { wallId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify wall exists and belongs to user's organization
    const { data: existingWall, error: wallError } = await supabase
      .from('walls')
      .select('id, content, state, token, issueDate')
      .eq('id', wallId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (wallError || !existingWall) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log("=== WALL UPDATE DEBUG ===");
    console.log("Wall ID:", wallId);
    console.log("Request body received:", JSON.stringify(body, null, 2));
    
    const { error, data } = createWallSchema.safeParse(body);

    if (error) {
      console.log("Validation error details:", JSON.stringify(error.format(), null, 2));
      console.log("Validation error issues:", JSON.stringify(error.issues, null, 2));
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.format(),
        issues: error.issues
      }, { status: 400 });
    }
    
    console.log("Validation passed, parsed data:", JSON.stringify(data, null, 2));

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
    } = data;

    // Get organization details
    const { data: organization } = await supabase
      .from("organization")
      .select("id, name, email, logoUrl")
      .eq("id", profile.organizationId)
      .single();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get customer details if customerId is provided
    let finalRecipientEmail = recipientEmail;
    let finalRecipientName = recepientName;

    if (customerId) {
      const customerDetails = await getCustomerDetails(supabase, customerId);
      finalRecipientEmail = customerDetails.email;
      finalRecipientName = customerDetails.name;
    }

    // Handle file deletions - compare old content with new content
    if (existingWall.content && content) {
      try {
        const oldContent = typeof existingWall.content === 'string' 
          ? JSON.parse(existingWall.content) 
          : existingWall.content;
        
        const oldBlocks = oldContent?.blocks || [];
        const newBlocks = content?.blocks || [];
        
        // Find blocks that were removed or had their fileId changed
        const deletedFiles: string[] = [];
        
        oldBlocks.forEach((oldBlock: any) => {
          if (oldBlock.type === 'image' || oldBlock.type === 'video' || oldBlock.type === 'file') {
            const oldFileId = oldBlock.props?.fileId || oldBlock.props?.cloudflareUrl;
            if (oldFileId) {
              // Check if this block still exists with the same fileId in new content
              const stillExists = newBlocks.some((newBlock: any) => {
                if (newBlock.id === oldBlock.id && newBlock.type === oldBlock.type) {
                  const newFileId = newBlock.props?.fileId || newBlock.props?.cloudflareUrl;
                  return newFileId === oldFileId;
                }
                return false;
              });
              
              if (!stillExists) {
                deletedFiles.push(oldFileId);
              }
            }
          }
        });

        // Delete files from Cloudflare if any were removed
        if (deletedFiles.length > 0) {
          try {
            for (const fileUrl of deletedFiles) {
              try {
                // Extract key from URL
                let fileKey = '';
                if (fileUrl.includes('/')) {
                  // For URLs like https://domain.com/walls/images/file.jpg
                  const urlParts = fileUrl.split('/');
                  if (urlParts.length >= 4) {
                    // Find the domain part and get everything after it
                    const domainIndex = urlParts.findIndex(part => 
                      part.includes('.r2.dev') || 
                      part.includes('.cloudflarestorage.com') ||
                      part === process.env.R2_CUSTOM_DOMAIN
                    );
                    if (domainIndex !== -1 && domainIndex < urlParts.length - 1) {
                      fileKey = urlParts.slice(domainIndex + 1).join('/');
                    }
                  }
                }
                
                // If we couldn't extract the key from URL, treat the fileUrl as the key
                if (!fileKey) {
                  fileKey = fileUrl;
                }
                
                // Validate the key format
                const allowedPrefixes = ['walls/', 'gallery/', 'organizations/'];
                const isValidKey = allowedPrefixes.some(prefix => fileKey.startsWith(prefix));
                
                if (isValidKey && fileKey) {
                  await deleteFileFromR2(fileKey);
                  console.log(`Successfully deleted file: ${fileUrl} (key: ${fileKey})`);
                } else {
                  console.warn(`Skipping deletion of invalid file key: ${fileKey} from URL: ${fileUrl}`);
                }
              } catch (fileDeleteError) {
                console.error(`Error deleting individual file ${fileUrl}:`, fileDeleteError);
                // Continue with other files
              }
            }
            console.log('Processed file deletions from Cloudflare:', deletedFiles);
          } catch (deleteError) {
            console.error('Error deleting files from Cloudflare:', deleteError);
            // Don't fail the update if file deletion fails
          }
        }
      } catch (contentParseError) {
        console.error('Error parsing content for file deletion:', contentParseError);
      }
    }

    // Determine state and type
    let state = existingWall.state || "draft";
    if (action === "publish" || action === "send_wall") {
      state = "published";
    }

    let type = protect || customerId || recipientEmail ? "private" : "public";
    
    // Generate token if needed
    let token = existingWall.token;
    if ((protect || action === "send_wall" || customerId || recipientEmail) && !token) {
      token = crypto.randomUUID();
    }

    // Process content to ensure URLs are properly stored
    let processedContent = content;
    if (content?.blocks) {
      processedContent = {
        ...content,
        blocks: content.blocks.map((block: any) => {
          if (['image', 'video', 'file'].includes(block.type) && block.props?.fileId) {
            return {
              ...block,
              props: {
                ...block.props,
                cloudflareUrl: block.props.fileId,
                fileId: block.props.fileId
              }
            };
          }
          return block;
        })
      };
    }

    // Note: We're not updating slug for public walls as we're using ID-based routing
    const updatePayload = {
      name,
      description: description || null,
      notes: notes || null,
      content: processedContent ?? { version: 1, blocks: [] },
      customerId: customerId || null,
      projectId: projectId || null,
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
      issueDate: state === "published" && existingWall.state === "draft" ? new Date().toISOString() : existingWall.issueDate,
    };

    const { data: updatedWall, error: updateError } = await supabase
      .from('walls')
      .update(updatePayload)
      .eq('id', wallId)
      .eq('organizationId', profile.organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Wall update error:', updateError);
      return NextResponse.json({ error: 'Failed to update wall' }, { status: 500 });
    }

    // Send email if required (when sending to customer or has recipient email)
    if (action === "send_wall" || customerId || recipientEmail) {
      try {
        if (finalRecipientEmail) {
          await sendWallEmail(
            supabase, 
            user, 
            updatedWall, 
            finalRecipientEmail, 
            organization.name, 
            finalRecipientName || "Valued Customer", 
            updatedWall.name, 
            token || updatedWall.token, 
            organization.logoUrl
          );
          console.log('Wall update email sent successfully to:', finalRecipientEmail);
        }
      } catch (emailError) {
        console.error('Email send error during wall update:', emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      wall: updatedWall,
      message: action === "send_wall" ? "Wall updated and email sent" : 
               action === "publish" ? "Wall published" : "Wall updated"
    });

  } catch (error) {
    console.error('Wall update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  const { wallId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get user's profile to find their organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get wall content to delete associated files
    const { data: wall, error: wallError } = await supabase
      .from('walls')
      .select('id, content')
      .eq('id', wallId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (wallError || !wall) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    // Delete associated files from Cloudflare
    if (wall.content) {
      try {
        const content = typeof wall.content === 'string' ? JSON.parse(wall.content) : wall.content;
        const blocks = content?.blocks || [];
        
        const filesToDelete: string[] = [];
        blocks.forEach((block: any) => {
          if (['image', 'video', 'file'].includes(block.type)) {
            const fileId = block.props?.fileId || block.props?.cloudflareUrl;
            if (fileId) {
              filesToDelete.push(fileId);
            }
          }
        });

        // Delete files from Cloudflare
        for (const fileUrl of filesToDelete) {
          try {
            // Extract key from URL
            let fileKey = '';
            if (fileUrl.includes('/')) {
              // For URLs like https://domain.com/walls/images/file.jpg
              const urlParts = fileUrl.split('/');
              if (urlParts.length >= 4) {
                // Find the domain part and get everything after it
                const domainIndex = urlParts.findIndex(part => 
                  part.includes('.r2.dev') || 
                  part.includes('.cloudflarestorage.com') ||
                  part === process.env.R2_CUSTOM_DOMAIN
                );
                if (domainIndex !== -1 && domainIndex < urlParts.length - 1) {
                  fileKey = urlParts.slice(domainIndex + 1).join('/');
                }
              }
            }
            
            // If we couldn't extract the key from URL, treat the fileUrl as the key
            if (!fileKey) {
              fileKey = fileUrl;
            }
            
            // Validate the key format
            const allowedPrefixes = ['walls/', 'gallery/', 'organizations/'];
            const isValidKey = allowedPrefixes.some(prefix => fileKey.startsWith(prefix));
            
            if (isValidKey && fileKey) {
              await deleteFileFromR2(fileKey);
              console.log(`Successfully deleted file: ${fileUrl} (key: ${fileKey})`);
            } else {
              console.warn(`Skipping deletion of invalid file key: ${fileKey} from URL: ${fileUrl}`);
            }
          } catch (deleteError) {
            console.error('Error deleting file from Cloudflare:', deleteError);
            // Continue with other files even if one fails
          }
        }
      } catch (contentParseError) {
        console.error('Error parsing content for file deletion:', contentParseError);
      }
    }

    // Delete the wall
    const { error: deleteError } = await supabase
      .from('walls')
      .delete()
      .eq('id', wallId)
      .eq('organizationId', profile.organizationId);

    if (deleteError) {
      console.error('Wall delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete wall' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Wall deleted successfully' });

  } catch (error) {
    console.error('Wall deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
