"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { baseUrl } from "@/utils/universal";
import { Message } from "@/components/form-message";
import { authRateLimit } from "@/utils/rateLimit";

export const forgotPasswordAction = async (prevState: Message | undefined, formData: FormData): Promise<Message> => {
    // Get client IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? 
      headersList.get('x-real-ip') ?? 
      '127.0.0.1';
    
    // Apply rate limiting for forgot password (both hourly and daily limits)
    const hourlyLimit = await authRateLimit.forgotPassword.limit(ip);
    const dailyLimit = await authRateLimit.forgotPasswordDaily.limit(ip);
    
    if (!hourlyLimit.success) {
      return { error: "Too many password reset attempts. Please try again later." };
    }
    
    if (!dailyLimit.success) {
      return { error: "Daily password reset limit reached. Please try again tomorrow." };
    }
    
    const email = formData.get("email")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
  
    if (!email) {
      return { error: "Email is required" };
    }
  
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset`,
    });
  
    if (error) {
      console.error(error.message);
      return { error: "Could not reset password. " + error.message };
    }
  
    return { success: "Check your email for a link to reset your password." };
  };