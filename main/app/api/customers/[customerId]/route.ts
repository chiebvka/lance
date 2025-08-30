import { NextResponse } from "next/server";
import customerSchema from "@/validation/customer";
import { createClient } from "@/utils/supabase/server";
import { ratelimit } from '@/utils/rateLimit';

export async function PUT(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    const { customerId } = await context.params;
    const body = await request.json();
    const validatedFields = customerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Check if customer exists and belongs to user's organization
    const { data: existingCustomer, error: checkError } = await supabase
      .from("customers")
      .select("id, organizationId")
      .eq("id", customerId)
      .eq("organizationId", profile.organizationId)
      .single();

    if (checkError || !existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found or you don't have permission to edit it." },
        { status: 404 }
      );
    }

    const customerData = {
      ...validatedFields.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", customerId)
      .eq("organizationId", profile.organizationId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json(
        { error: "Could not update customer in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: "Customer updated successfully!", 
      customer: data 
    }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    const { customerId } = await context.params;

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("organizationId", profile.organizationId)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: "Customer not found or you don't have permission to view it." },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      customer 
    }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    const { customerId } = await context.params;

    // Check if customer exists and belongs to user's organization
    const { data: existingCustomer, error: checkError } = await supabase
      .from("customers")
      .select("id, organizationId")
      .eq("id", customerId)
      .eq("organizationId", profile.organizationId)
      .single();

    if (checkError || !existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found or you don't have permission to delete it." },
        { status: 404 }
      );
    }

    // Delete the customer - database will handle cascading deletes for related items
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("organizationId", profile.organizationId);

    if (deleteError) {
      console.error("Supabase Delete Error:", deleteError.message);
      return NextResponse.json(
        { error: "Could not delete customer from database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: "Customer deleted successfully!" 
    }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
