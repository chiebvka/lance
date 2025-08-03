import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';

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

    // Get params for Next.js 15 compatibility
    const params = await context.params;
    const { bankId } = params;

    // Verify the bank belongs to the user's organization
    const { data: existingBank, error: fetchError } = await supabase
      .from('banks')
      .select('*')
      .eq('id', bankId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (fetchError || !existingBank) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
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

    // If setting this as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('banks')
        .update({ isDefault: false })
        .eq('organizationId', profile.organizationId)
        .neq('id', bankId);

        await supabase
        .from('organization')
        .update({ defaultBankId: bankId })
        .eq('id', profile.organizationId);
    } else {
      // If trying to turn off default, check if this is the only default
      const { data: defaultBanks, error: countError } = await supabase
        .from('banks')
        .select('id')
        .eq('organizationId', profile.organizationId)
        .eq('isDefault', true);

      if (countError) {
        console.error('Error checking default banks:', countError);
        return NextResponse.json({ error: 'Failed to check default banks' }, { status: 500 });
      }

      // If this is the only default and we're trying to turn it off, prevent it
      if (defaultBanks && defaultBanks.length === 1 && defaultBanks[0].id === bankId) {
        return NextResponse.json({ 
          error: 'Cannot remove default status',
          message: 'At least one payment method must remain as default.'
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (accountName !== undefined) updateData.accountName = accountName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (routingNumber !== undefined) updateData.routingNumber = routingNumber;
    if (institutionNumber !== undefined) updateData.institutionNumber = institutionNumber;
    if (transitNumber !== undefined) updateData.transitNumber = transitNumber;
    if (iban !== undefined) updateData.iban = iban;
    if (swiftCode !== undefined) updateData.swiftCode = swiftCode;
    if (sortCode !== undefined) updateData.sortCode = sortCode;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAddress !== undefined) updateData.bankAddress = bankAddress;
    if (country !== undefined) updateData.country = country;
    if (currency !== undefined) updateData.currency = currency;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (stripePaymentLink !== undefined) updateData.stripePaymentLink = stripePaymentLink;
    if (paypalPaymentLink !== undefined) updateData.paypalPaymentLink = paypalPaymentLink;

    // Update the bank account
    const { data: updatedBank, error } = await supabase
      .from('banks')
      .update(updateData)
      .eq('id', bankId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bank:', error);
      return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      bank: updatedBank
    });
  } catch (error) {
    console.error('Bank update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Get params for Next.js 15 compatibility
    const params = await context.params;
    const { bankId } = params;

    // Verify the bank belongs to the user's organization
    const { data: existingBank, error: fetchError } = await supabase
      .from('banks')
      .select('*')
      .eq('id', bankId)
      .eq('organizationId', profile.organizationId)
      .single();

    if (fetchError || !existingBank) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    // Delete the bank account
    const { error } = await supabase
      .from('banks')
      .delete()
      .eq('id', bankId);

    if (error) {
      console.error('Error deleting bank:', error);
      return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Bank account deleted successfully'
    });
  } catch (error) {
    console.error('Bank deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
