import { NextResponse } from "next/server";
import customerSchema from "@/validation/customer";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedFields = customerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert([validatedFields.data])
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
