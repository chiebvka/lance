"use server";

import customerSchema from "@/validation/customer";
import { z } from "zod";

export async function createCustomer(values: z.infer<typeof customerSchema>) {
  const validatedFields = customerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }

  // In a real application, you would save the customer to a database here.
  console.log("Server Action: Creating customer with data:", validatedFields.data);

  return {
    success: "Customer created successfully!",
  };
}
