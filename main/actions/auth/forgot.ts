"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { baseUrl } from "@/utils/universal";
import { Message } from "@/components/form-message";
// import { encodedRedirect } from "@/utils/utils";
// import { redirect } from "next/navigation";

export const forgotPasswordAction = async (prevState: Message | undefined, formData: FormData): Promise<Message> => {
    const email = formData.get("email")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    // const callbackUrl = formData.get("callbackUrl")?.toString(); // We might not need this if we're not redirecting immediately
  
    if (!email) {
      // return encodedRedirect("error", "/forgot", "Email is required");
      return { error: "Email is required" };
    }
  
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset`,
    });
  
    if (error) {
      console.error(error.message);
      // return encodedRedirect(
      //   "error",
      //   "/forgot",
      //   "Could not reset password",
      // );
      return { error: "Could not reset password. " + error.message };
    }
  
    // if (callbackUrl) {
    //   return redirect(callbackUrl);
    // }
  
    // return encodedRedirect(
    //   "success",
    //   "/forgot",
    //   "Check your email for a link to reset your password.",
    // );
    return { success: "Check your email for a link to reset your password." };
  };