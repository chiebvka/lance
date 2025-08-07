import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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

    // Get invoices for the organization with organization data
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        organization:organizationId (
          logoUrl,
          name,
          email
        )
      `)
      .eq('organizationId', profile.organizationId)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Process invoices to ensure JSON fields are properly serialized
    const processedInvoices = (invoices || []).map(invoice => {
      const processJsonField = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (error) {
            console.warn('Failed to parse JSON field:', field);
            return field;
          }
        }
        return field;
      };

      return {
        ...invoice,
        invoiceDetails: processJsonField(invoice.invoiceDetails),
        paymentDetails: processJsonField(invoice.paymentDetails),
        paymentInfo: processJsonField(invoice.paymentInfo),
        // Flatten organization data for easier access
        organizationLogoUrl: invoice.organization?.logoUrl || null,
        organizationNameFromOrg: invoice.organization?.name || null,
        organizationEmailFromOrg: invoice.organization?.email || null,
      };
    });

    return NextResponse.json({ 
      success: true, 
      invoices: processedInvoices 
    });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
