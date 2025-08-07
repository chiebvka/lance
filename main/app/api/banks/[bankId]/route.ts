import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';
import { createBankSchema, getBankType } from '@/validation/banks';

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
    
    // If the request includes accountType, validate it with the full schema
    if (body.accountType) {
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

      // If setting this as default, unset other defaults
      if (validatedData.isDefault) {
        // Use a transaction to ensure consistency
        const { error: updateError } = await supabase.rpc('update_default_bank', {
          p_organization_id: profile.organizationId,
          p_bank_id: bankId
        });

        if (updateError) {
          console.error('Error updating default bank:', updateError);
          return NextResponse.json({ error: 'Failed to update default bank' }, { status: 500 });
        }
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

        // If turning off default, clear the organization's defaultBankId
        await supabase
          .from('organization')
          .update({ defaultBankId: null })
          .eq('id', profile.organizationId)
          .eq('defaultBankId', bankId);
      }

      // Prepare update data based on account type
      let updateData: any = {
        type: bankType,
        updatedAt: new Date().toISOString()
      };

      if (validatedData.isDefault !== undefined) updateData.isDefault = validatedData.isDefault;

      // Map data based on account type
      if (validatedData.accountType === 'bank') {
        if (validatedData.accountName !== undefined) updateData.accountName = validatedData.accountName;
        if (validatedData.accountNumber !== undefined) updateData.accountNumber = validatedData.accountNumber;
        if (validatedData.routingNumber !== undefined) updateData.routingNumber = validatedData.routingNumber;
        if (validatedData.institutionNumber !== undefined) updateData.institutionNumber = validatedData.institutionNumber;
        if (validatedData.transitNumber !== undefined) updateData.transitNumber = validatedData.transitNumber;
        if (validatedData.iban !== undefined) updateData.iban = validatedData.iban;
        if (validatedData.swiftCode !== undefined) updateData.swiftCode = validatedData.swiftCode;
        if (validatedData.sortCode !== undefined) updateData.sortCode = validatedData.sortCode;
        if (validatedData.bankName !== undefined) updateData.bankName = validatedData.bankName;
        if (validatedData.bankAddress !== undefined) updateData.bankAddress = validatedData.bankAddress;
        if (validatedData.country !== undefined) updateData.country = validatedData.country;
        if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
      } else if (validatedData.accountType === 'crypto') {
        updateData.accountName = validatedData.walletName;
        updateData.bankName = `${validatedData.cryptoType} Wallet`;
        updateData.country = 'CRYPTO';
        updateData.currency = 'USD';
        updateData.accountNumber = validatedData.walletAddress;
        updateData.routingNumber = validatedData.cryptoType;
        updateData.institutionNumber = validatedData.network;
      } else if (validatedData.accountType === 'stripe') {
        updateData.accountName = validatedData.accountName;
        updateData.bankName = 'Stripe Payment';
        updateData.country = 'US';
        updateData.currency = 'USD';
        updateData.stripePaymentLink = validatedData.paymentLink;
      } else if (validatedData.accountType === 'paypal') {
        updateData.accountName = validatedData.accountName;
        updateData.bankName = 'PayPal Payment';
        updateData.country = 'US';
        updateData.currency = 'USD';
        updateData.paypalPaymentLink = validatedData.paymentLink;
      }

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
    } else {
      // Handle simple updates (like isDefault changes) without full validation
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
        // Use a transaction to ensure consistency
        const { error: updateError } = await supabase.rpc('update_default_bank', {
          p_organization_id: profile.organizationId,
          p_bank_id: bankId
        });

        if (updateError) {
          console.error('Error updating default bank:', updateError);
          return NextResponse.json({ error: 'Failed to update default bank' }, { status: 500 });
        }
      } else if (isDefault === false) {
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

        // If turning off default, clear the organization's defaultBankId
        await supabase
          .from('organization')
          .update({ defaultBankId: null })
          .eq('id', profile.organizationId)
          .eq('defaultBankId', bankId);
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
    }
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

    // Check if this is the default bank
    const isDefaultBank = existingBank.isDefault;

    // Delete the bank account
    const { error: deleteError } = await supabase
      .from('banks')
      .delete()
      .eq('id', bankId);

    if (deleteError) {
      console.error('Error deleting bank:', deleteError);
      return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
    }

    // If the deleted bank was default, find another bank to set as default
    if (isDefaultBank) {
      const { data: remainingBanks, error: remainingError } = await supabase
        .from('banks')
        .select('id')
        .eq('organizationId', profile.organizationId)
        .limit(1);

      if (remainingError) {
        console.error('Error checking remaining banks:', remainingError);
        return NextResponse.json({ error: 'Failed to check remaining banks' }, { status: 500 });
      }

      if (remainingBanks && remainingBanks.length > 0) {
        // Set the first remaining bank as default
        await supabase
          .from('banks')
          .update({ isDefault: true })
          .eq('id', remainingBanks[0].id);

        await supabase
          .from('organization')
          .update({ defaultBankId: remainingBanks[0].id })
          .eq('id', profile.organizationId);
      } else {
        // No banks left, clear the default
        await supabase
          .from('organization')
          .update({ defaultBankId: null })
          .eq('id', profile.organizationId);
      }
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
