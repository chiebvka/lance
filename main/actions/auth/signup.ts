"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { baseUrl } from "@/utils/universal";
import { Message } from "@/components/form-message";

export const signUpAction = async (prevState: Message | undefined, formData: FormData): Promise<Message> => {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const supabase = await createClient();
  
    if (!email || !password) {
      return { error: "Email and password are required" };
    }
  
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback?redirect_to=/protected`,
      },
    });
  
    if (error) {
      console.error(error.code + " " + error.message);
      return { error: error.message };
    } else {
      return { success: "Thanks for signing up! Please check your email for a verification link." };
    }
};