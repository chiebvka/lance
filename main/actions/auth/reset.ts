"use server"

import { createClient } from "@/utils/supabase/server";
import { Message } from "@/components/form-message";
import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";

export const resetPasswordAction = async (prevState: Message | undefined, formData: FormData): Promise<Message> => {
    const supabase = await createClient();
  
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
  
    if (!password || !confirmPassword) {
      // encodedRedirect(
      //   "error",
      //   "/protected/reset",
      //   "Password and confirm password are required",
      // );
      return { error: "Password and confirm password are required" };
    }
  
    if (password !== confirmPassword) {
      // encodedRedirect(
      //   "error",
      //   "/protected/reset",
      //   "Passwords do not match",
      // );
      return { error: "Passwords do not match" };
    }
  
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
  
    if (error) {
      // encodedRedirect(
      //   "error",
      //   "/protected/reset",
      //   "Password update failed",
      // );
      return { error: "Password update failed: " + error.message };
    }
  
    // encodedRedirect("success", "/protected/reset", "Password updated");
    return { success: "Password updated successfully!" };
  };