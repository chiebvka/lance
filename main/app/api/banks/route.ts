import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';

export async function GET(request: NextRequest) {
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

    // Fetch all banks for the organization
    const { data: banks, error } = await supabase
      .from('banks')
      .select('*')
      .eq('organizationId', profile.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching banks:', error);
      return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      banks: banks || []
    });
  } catch (error) {
    console.error('Banks fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
