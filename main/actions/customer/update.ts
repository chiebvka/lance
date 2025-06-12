"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import customerSchema from "@/validation/customer";
import { z } from "zod";

// Extend the schema to include the id for updates
const updateCustomerSchema = customerSchema.extend({
  id: z.string().uuid({ message: "Invalid customer ID" }),
});

type UpdateCustomerData = z.infer<typeof updateCustomerSchema>;

export async function updateCustomer(data: UpdateCustomerData) {
  try {
    // Validate the input data
    const validatedFields = updateCustomerSchema.safeParse(data);
    
    if (!validatedFields.success) {
      return {
        error: "Invalid fields!",
        details: validatedFields.error.flatten(),
      };
    }

    const { id, ...customerData } = validatedFields.data;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: "Unauthorized. Please log in." };
    }

    // First, check if the customer exists and belongs to the current user
    const { data: existingCustomer, error: fetchError } = await supabase
      .from("customers")
      .select("id, createdBy")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { error: "Customer not found." };
      }
      console.error("Error fetching customer:", fetchError.message);
      return { error: "Could not verify customer ownership." };
    }

    // Check if the user owns this customer
    if (existingCustomer.createdBy !== user.id) {
      return { error: "You can only update your own customers." };
    }

    // Update the customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from("customers")
      .update({
        ...customerData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("createdBy", user.id) // Double-check ownership in the update query
      .select()
      .single();

    if (updateError) {
      console.error("Supabase Update Error:", updateError.message);
      return { error: "Could not update customer in database." };
    }

    // Revalidate the customers page to reflect changes
    revalidatePath("/protected/customers");
    
    return { 
      success: "Customer updated successfully!", 
      customer: updatedCustomer 
    };

  } catch (error) {
    console.error("Update Customer Error:", error);
    return { error: "An unexpected error occurred while updating the customer." };
  }
}
