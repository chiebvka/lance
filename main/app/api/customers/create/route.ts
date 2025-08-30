import { NextResponse } from "next/server";
import customerSchema from "@/validation/customer";
import { createClient } from "@/utils/supabase/server";
import { ratelimit } from '@/utils/rateLimit';

export async function POST(request: Request) {
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
    
    const body = await request.json();
    const validatedFields = customerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const customerData = {
      ...validatedFields.data,
      createdBy: user.id,
      organizationId: profile.organizationId,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json(
        { error: "Could not create customer in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: "Customer created successfully!", customer: data }, { status: 201 });
  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
