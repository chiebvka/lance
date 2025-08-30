"use server";

import { createClient } from "@/utils/supabase/server";
import { Message } from "@/components/form-message";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authRateLimit } from "@/utils/rateLimit";

export const signInAction = async (prevState: Message | undefined, formData: FormData): Promise<Message> => {
    // Get client IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? 
      headersList.get('x-real-ip') ?? 
      '127.0.0.1';
    
    // Apply rate limiting for login
    const { success, limit, reset, remaining } = await authRateLimit.login.limit(ip);
    
    if (!success) {
      return { error: "Too many login attempts. Please try again later." };
    }
    
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();
  
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      return { error: error.message };
    }
  
    return redirect("/protected");
  };