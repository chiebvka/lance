"use client"


import React, { useState, useEffect, useActionState } from 'react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { signUpAction } from "@/actions/auth/signup";
import { Message } from "@/components/form-message";
import Link from "next/link";
import { forgotPasswordAction } from '@/actions/auth/forgot';


const initialState: Message | undefined = undefined;

export default function ForgotForm({
    className,
    ...props
  }: React.ComponentProps<"form">) {
    const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  
    useEffect(() => {
      if (state && "success" in state && state.success) {
        toast.success(state.success);
      }
      if (state && "error" in state && state.error) {
        toast.error(state.error);
      }
      // Potentially clear state here if desired, e.g., by calling a reset function passed from useFormState or setting a local state
    }, [state]);


  return (
    <form  action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to reset your password
        </p>
        </div>
        <div className="grid gap-6">
        <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="hello@example.com" required />
        </div>
        <SubmitButton 
            className="w-full" 
            pendingText="Resetting Password..."
        >
            Reset Password
        </SubmitButton>
        </div>
        <div className="text-center text-sm">
        Got an account?{" "}
        <Link href="/login" className="underline hover:text-primary underline-offset-4">
          Login 
        </Link>
      </div>
    </form>
  )
}