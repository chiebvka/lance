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
