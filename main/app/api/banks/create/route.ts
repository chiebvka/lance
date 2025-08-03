import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      accountName,
      accountNumber,
      routingNumber,
      institutionNumber,
      transitNumber,
      iban,
      swiftCode,
      sortCode,
      bankName,
      bankAddress,
      country,
      currency,
      isDefault,
      stripePaymentLink,
      paypalPaymentLink
    } = body;

    // If this is the first bank account or isDefault is true, unset other defaults
    if (isDefault) {
      await supabase
        .from('banks')
        .update({ isDefault: false })
        .eq('organizationId', profile.organizationId);
    }

    // Create the new bank account
    const { data: newBank, error } = await supabase
      .from('banks')
      .insert({
        organizationId: profile.organizationId,
        createdBy: user.id,
        accountName,
        accountNumber,
        routingNumber,
        institutionNumber,
        transitNumber,
        iban,
        swiftCode,
        sortCode,
        bankName,
        bankAddress,
        country,
        currency,
        isDefault: isDefault || false,
        stripePaymentLink,
        paypalPaymentLink,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bank:', error);
      return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      bank: newBank
    });
  } catch (error) {
    console.error('Bank creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
