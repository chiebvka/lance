import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    // Get counts for all organization-related data
    const [
      { count: customerCount },
      { count: projectCount },
      { count: invoiceCount },
      { count: receiptCount },
      { count: feedbackCount },
      { count: wallCount },
      { count: pathCount }
    ] = await Promise.all([
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('walls')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('paths')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId)
    ]);

    return NextResponse.json({ 
      success: true,
      counts: {
        customerCount: customerCount || 0,
        projectCount: projectCount || 0,
        invoiceCount: invoiceCount || 0,
        receiptCount: receiptCount || 0,
        feedbackCount: feedbackCount || 0,
        wallCount: wallCount || 0,
        pathCount: pathCount || 0
      }
    });
  } catch (error) {
    console.error('Organization counts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
