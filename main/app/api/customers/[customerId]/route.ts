import { NextResponse } from "next/server";
import customerSchema from "@/validation/customer";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = params;
    const body = await request.json();
    const validatedFields = customerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Check if customer exists and belongs to user
    const { data: existingCustomer, error: checkError } = await supabase
      .from("customers")
      .select("id, createdBy")
      .eq("id", customerId)
      .eq("createdBy", user.id)
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
      .eq("createdBy", user.id)
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
  { params }: { params: { customerId: string } }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = params;

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("createdBy", user.id)
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
