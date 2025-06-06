"use server";

import { createClient } from "@/utils/supabase/server";
import { Message } from "@/components/form-message";
import { redirect } from "next/navigation";

export const signInAction = async (prevState: Message | undefined, formData: FormData): Promise<Message> => {
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