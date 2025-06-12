"use server";

import { createClient } from "@/utils/supabase/server";
import customerSchema from "@/validation/customer";
import { z } from "zod";

export async function createCustomer(values: z.infer<typeof customerSchema>) {
  const validatedFields = customerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .insert([validatedFields.data]);

  if (error) {
    console.error("Supabase Error:", error.message);
    return {
      error: "Could not create customer in database.",
    };
  }

  return {
    success: "Customer created successfully!",
  };
}
