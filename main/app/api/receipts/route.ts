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

        // Get receipts for the organization with organization data
        const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
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

    if (receiptsError) {
        console.error('Error fetching receipts:', receiptsError);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

       // Process receipts to ensure JSON fields are properly serialized
       const processedReceipts = (receipts || []).map(receipt => {
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
          ...receipt,
          receiptDetails: processJsonField(receipt.receiptDetails),
          paymentDetails: processJsonField(receipt.paymentDetails),
          paymentInfo: processJsonField(receipt.paymentInfo),
          // Flatten organization data for easier access
          organizationLogoUrl: receipt.organization?.logoUrl || null,
          organizationNameFromOrg: receipt.organization?.name || null,
          organizationEmailFromOrg: receipt.organization?.email || null,
        };
      });
  
      return NextResponse.json({ 
        success: true, 
        receipts: processedReceipts 
      });


    } catch (error) {
        console.error('Receipts fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}