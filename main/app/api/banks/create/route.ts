import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';
import { createBankSchema, getBankType } from '@/validation/banks';

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
    
    // Validate the request body
    const validationResult = createBankSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;
    
    // Determine the bank type based on account type and country
    const bankType = getBankType(validatedData.accountType, 
      validatedData.accountType === 'bank' ? validatedData.country : undefined
    );

    // Check if this is the first bank for the organization
    const { data: existingBanks, error: countError } = await supabase
      .from('banks')
      .select('id')
      .eq('organizationId', profile.organizationId);

    if (countError) {
      console.error('Error checking existing banks:', countError);
      return NextResponse.json({ error: 'Failed to check existing banks' }, { status: 500 });
    }

    // If this is the first bank, set it as default
    const isFirstBank = !existingBanks || existingBanks.length === 0;
    const shouldBeDefault = isFirstBank || validatedData.isDefault;

    // If setting this as default, unset other defaults
    if (shouldBeDefault) {
      await supabase
        .from('banks')
        .update({ isDefault: false })
        .eq('organizationId', profile.organizationId);
    }

    // Prepare bank data based on account type
    let bankData: any = {
      organizationId: profile.organizationId,
      createdBy: user.id,
      type: bankType,
      isDefault: shouldBeDefault,
      updatedAt: new Date().toISOString()
    };

    // Map data based on account type
    if (validatedData.accountType === 'bank') {
      bankData = {
        ...bankData,
        accountName: validatedData.accountName,
        accountNumber: validatedData.accountNumber,
        routingNumber: validatedData.routingNumber,
        institutionNumber: validatedData.institutionNumber,
        transitNumber: validatedData.transitNumber,
        iban: validatedData.iban,
        swiftCode: validatedData.swiftCode,
        sortCode: validatedData.sortCode,
        bankName: validatedData.bankName,
        bankAddress: validatedData.bankAddress,
        country: validatedData.country,
        currency: validatedData.currency,
      };
    } else if (validatedData.accountType === 'crypto') {
      bankData = {
        ...bankData,
        accountName: validatedData.walletName,
        bankName: `${validatedData.cryptoType} Wallet`,
        country: 'CRYPTO',
        currency: 'USD',
        accountNumber: validatedData.walletAddress,
        routingNumber: validatedData.cryptoType,
        institutionNumber: validatedData.network,
      };
    } else if (validatedData.accountType === 'stripe') {
      bankData = {
        ...bankData,
        accountName: validatedData.accountName,
        bankName: 'Stripe Payment',
        country: 'US',
        currency: 'USD',
        stripePaymentLink: validatedData.paymentLink,
      };
    } else if (validatedData.accountType === 'paypal') {
      bankData = {
        ...bankData,
        accountName: validatedData.accountName,
        bankName: 'PayPal Payment',
        country: 'US',
        currency: 'USD',
        paypalPaymentLink: validatedData.paymentLink,
      };
    }

    // Create the new bank account
    const { data: newBank, error } = await supabase
      .from('banks')
      .insert(bankData)
      .select()
      .single();

    if (error) {
      console.error('Error creating bank:', error);
      return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
    }

    // If this bank is default, update the organization's defaultBankId
    if (shouldBeDefault) {
      await supabase
        .from('organization')
        .update({ defaultBankId: newBank.id })
        .eq('id', profile.organizationId);
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
