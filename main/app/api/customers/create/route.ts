import { NextResponse } from "next/server";
import customerSchema from "@/validation/customer";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedFields = customerSchema.safeParse(body);

    const profileId = user.id;

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const customerData = {
      ...validatedFields.data,
      createdBy: profileId, // Ensure updated_at is set if not provided
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
