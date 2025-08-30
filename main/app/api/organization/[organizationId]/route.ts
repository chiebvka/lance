import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromR2 } from '@/lib/r2';
import { ratelimit } from '@/utils/rateLimit';
import Stripe from 'stripe';

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // Await params for Next.js 15 compatibility
    const { params } = context;
    const { organizationId } = params;

    // Verify the organization ID matches the user's organization
    if (profile.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { logoUrl, name, email, country, baseCurrency, invoiceNotifications, projectNotifications, feedbackNotifications } = body;

    // Get current organization data to check if we need to delete the old logo
    const { data: currentOrg } = await supabase
      .from('organization')
      .select('logoUrl')
      .eq('id', profile.organizationId)
      .single();

    // If logoUrl is being set to null and there was a previous logo, delete it from R2
    if (logoUrl === null && currentOrg?.logoUrl) {
      try {
        // Extract the key from the URL
        const url = new URL(currentOrg.logoUrl);
        const key = url.pathname.substring(1); // Remove leading slash
        
        // Delete the file from R2
        await deleteFileFromR2(key);
      } catch (deleteError) {
        console.error('Error deleting old logo from R2:', deleteError);
        // Don't fail the update if R2 deletion fails
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };




    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (country !== undefined) updateData.country = country;
    if (baseCurrency !== undefined) updateData.baseCurrency = baseCurrency;
    if (invoiceNotifications !== undefined) updateData.invoiceNotifications = invoiceNotifications;
    if (projectNotifications !== undefined) updateData.projectNotifications = projectNotifications;
    if (feedbackNotifications !== undefined) updateData.feedbackNotifications = feedbackNotifications;

    console.log('⏳ supabase.update with:', updateData)

    console.log('⏳ PATCH /api/organization/:id body:', body)

    // Update the organization
    const { data, error } = await supabase
      .from('organization')
      .update(updateData)
      .eq('id', profile.organizationId)
      .select()
      .single();

      console.log('✅ supabase.update result:', { data, error })

    if (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Organization update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const supabase = await createClient();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    });
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // Get user's profile to check organization and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId, organizationRole')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user has creator role
    if (profile.organizationRole !== 'creator') {
      return NextResponse.json({ 
        error: 'Unauthorized to delete organization',
        message: 'Only organization creators can delete the organization.'
      }, { status: 403 });
    }

    // Await params for Next.js 15 compatibility
    const { params } = context;
    const { organizationId } = params;

    // Verify the organization ID matches the user's organization
    if (profile.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get current organization data to delete logo from R2 if it exists
    const { data: currentOrg } = await supabase
      .from('organization')
      .select('logoUrl')
      .eq('id', profile.organizationId)
      .single();

    // Delete logo from R2 if it exists
    if (currentOrg?.logoUrl) {
      try {
        // Extract the key from the URL
        const url = new URL(currentOrg.logoUrl);
        const key = url.pathname.substring(1); // Remove leading slash
        
        // Delete the file from R2
        await deleteFileFromR2(key);
      } catch (deleteError) {
        console.error('Error deleting logo from R2:', deleteError);
        // Continue with organization deletion even if R2 deletion fails
      }
    }

    // Get all walls for the organization to delete their assets from R2
    const { data: walls } = await supabase
      .from('walls')
      .select('content')
      .eq('organizationId', profile.organizationId);
    
    console.log(`Found ${walls?.length || 0} walls to process for R2 cleanup`);

    // Delete wall assets from R2
    let wallFilesDeleted = 0;
    if (walls && walls.length > 0) {
      for (const wall of walls) {
        if (wall.content) {
          try {
            // Parse content to find asset URLs
            const content = typeof wall.content === 'string' ? JSON.parse(wall.content) : wall.content;
            console.log('Wall content structure:', JSON.stringify(content, null, 2));
            
            // Look for image, video, or file URLs in the content
            if (content.blocks) {
              for (const block of content.blocks) {
                if (['image', 'video', 'file'].includes(block.type)) {
                  const fileId = block.props?.fileId || block.props?.cloudflareUrl;
                  if (fileId) {
                    try {
                      // Extract key from URL using the same logic as wall deletion
                      let fileKey = '';
                      if (fileId.includes('/')) {
                        // For URLs like https://domain.com/walls/images/file.jpg
                        const urlParts = fileId.split('/');
                        if (urlParts.length >= 4) {
                          // Find the domain part and get everything after it
                          const domainIndex = urlParts.findIndex((part: string) => 
                            part.includes('.r2.dev') || 
                            part.includes('.cloudflarestorage.com') ||
                            part === process.env.R2_CUSTOM_DOMAIN
                          );
                          if (domainIndex !== -1 && domainIndex < urlParts.length - 1) {
                            fileKey = urlParts.slice(domainIndex + 1).join('/');
                          }
                        }
                      }
                      
                      // If we couldn't extract the key from URL, treat the fileId as the key
                      if (!fileKey) {
                        fileKey = fileId;
                      }
                      
                      console.log(`Extracted wall fileKey: ${fileKey} from fileId: ${fileId}`);
                      
                      // Validate the key format
                      const allowedPrefixes = ['walls/', 'gallery/', 'organizations/'];
                      const isValidKey = allowedPrefixes.some(prefix => fileKey.startsWith(prefix));
                      
                      if (isValidKey && fileKey) {
                        await deleteFileFromR2(fileKey);
                        wallFilesDeleted++;
                        console.log(`Successfully deleted wall asset: ${fileId} (key: ${fileKey})`);
                      } else {
                        console.warn(`Skipping deletion of invalid file key: ${fileKey} from URL: ${fileId}`);
                      }
                    } catch (assetDeleteError) {
                      console.error('Error deleting wall asset from R2:', assetDeleteError);
                      // Continue with other assets even if one fails
                    }
                  }
                }
              }
            }
          } catch (parseError) {
            console.error('Error parsing wall content:', parseError);
            // Continue with other walls even if one fails to parse
          }
        }
      }
    }

    // Get all paths for the organization to delete their assets from R2
    const { data: paths } = await supabase
      .from('paths')
      .select('content')
      .eq('organizationId', profile.organizationId);
    
    console.log(`Found ${paths?.length || 0} paths to process for R2 cleanup`);

    // Delete path assets from R2
    let pathFilesDeleted = 0;
    if (paths && paths.length > 0) {
      for (const path of paths) {
        if (path.content) {
          try {
            // Parse content to find asset URLs
            const content = typeof path.content === 'string' ? JSON.parse(path.content) : path.content;
            console.log('Path content structure:', JSON.stringify(content, null, 2));
            
                        // Look for image, video, or file URLs in the content
            if (content.blocks) {
              console.log(`Processing ${content.blocks.length} blocks in path content`);
              for (const block of content.blocks) {
                console.log(`Processing path block type: ${block.type}, props:`, JSON.stringify(block.props || {}));
                if (['image', 'video', 'file'].includes(block.type)) {
                  const fileId = block.props?.fileId || block.props?.cloudflareUrl;
                  console.log(`Found path file block with fileId: ${fileId}`);
                  if (fileId) {
                    try {
                      // Extract key from URL using the same logic as wall deletion
                      let fileKey = '';
                      if (fileId.includes('/')) {
                        // For URLs like https://domain.com/paths/images/file.jpg
                        const urlParts = fileId.split('/');
                        if (urlParts.length >= 4) {
                          // Find the domain part and get everything after it
                          const domainIndex = urlParts.findIndex((part: string) => 
                            part.includes('.r2.dev') || 
                            part.includes('.cloudflarestorage.com') ||
                            part === process.env.R2_CUSTOM_DOMAIN
                          );
                          if (domainIndex !== -1 && domainIndex < urlParts.length - 1) {
                            fileKey = urlParts.slice(domainIndex + 1).join('/');
                          }
                        }
                      }
                      
                      // If we couldn't extract the key from URL, treat the fileId as the key
                      if (!fileKey) {
                        fileKey = fileId;
                      }
                      
                      console.log(`Extracted path fileKey: ${fileKey} from fileId: ${fileId}`);
                      
                      // Validate the key format
                      const allowedPrefixes = ['paths/', 'gallery/', 'organizations/'];
                      const isValidKey = allowedPrefixes.some(prefix => fileKey.startsWith(prefix));
                      
                      if (isValidKey && fileKey) {
                        await deleteFileFromR2(fileKey);
                        pathFilesDeleted++;
                        console.log(`Successfully deleted path asset: ${fileId} (key: ${fileKey})`);
                      } else {
                        console.warn(`Skipping deletion of invalid file key: ${fileKey} from URL: ${fileId}`);
                      }
                    } catch (assetDeleteError) {
                      console.error('Error deleting path asset from R2:', assetDeleteError);
                      // Continue with other assets even if one fails
                    }
                  }
                }
              }
            }
          } catch (parseError) {
            console.error('Error parsing path content:', parseError);
            // Continue with other paths even if one fails to parse
          }
        }
      }
    }

    // Clean up any other organization-related files from R2
    // This includes any files that might be stored in organizations/ folder
    try {
      // Note: R2 doesn't have a direct "list" operation in the S3 client
      // We'll rely on the content parsing above to catch most files
      // For any other files that might exist, they would need to be tracked
      // in the database or cleaned up through other means
      
      // Additional cleanup: Check if there are any other organization assets
      // that might not be referenced in walls/paths content
      // This could include files uploaded directly to organizations/assets/
      
      console.log('Organization R2 cleanup completed');
      console.log(`Deleted assets from ${walls?.length || 0} walls and ${paths?.length || 0} paths`);
      console.log(`Total files deleted: ${wallFilesDeleted + pathFilesDeleted} (${wallFilesDeleted} from walls, ${pathFilesDeleted} from paths)`);
    } catch (cleanupError) {
      console.error('Error during R2 cleanup:', cleanupError);
      // Continue with organization deletion even if R2 cleanup fails
    }

    // If there is a Stripe subscription, cancel it first (at period end)
    const { data: orgForCancel } = await supabase
      .from('organization')
      .select('subscriptionId')
      .eq('id', profile.organizationId)
      .single();

    if (orgForCancel?.subscriptionId) {
      try {
        await stripe.subscriptions.update(orgForCancel.subscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (e) {
        console.error('Error scheduling subscription cancellation:', e);
        // proceed with deletion; webhook will reconcile state if needed
      }
    }

    // Delete the organization
    const { error: deleteError } = await supabase
      .from('organization')
      .delete()
      .eq('id', profile.organizationId);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    // Update user profile to remove organization association
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
        organizationId: null,
        organizationRole: null
      })
      .eq('profile_id', user.id);

    if (profileUpdateError) {
      console.error('Error updating user profile:', profileUpdateError);
      // Don't fail the deletion if profile update fails
    }

    // Also delete the user from the authentication table (auth.users)
    try {
      const serviceClient = createServiceRoleClient();
      await serviceClient.auth.admin.deleteUser(user.id);
    } catch (e) {
      console.error('Error deleting user from auth.users:', e);
      // Do not fail the request if auth deletion fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Organization and user account deleted successfully'
    });
  } catch (error) {
    console.error('Organization deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
