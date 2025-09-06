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
import { resetPasswordAction } from '@/actions/auth/reset';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';


const initialState: Message | undefined = undefined;

type Props = {}

export default function ResetForm({
    className,
    ...props
  }: React.ComponentProps<"form">) {
    const [state, formAction] = useActionState(resetPasswordAction, initialState);
    const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const router = useRouter();
  
    useEffect(() => {
      if (state && "success" in state && state.success) {
        toast.success(state.success);
      }
      if (state && "error" in state && state.error) {
        toast.error(state.error);
      }
      // Potentially clear state here if desired, e.g., by calling a reset function passed from useFormState or setting a local state
    }, [state]);


  const handleGoBack = () => {
    router.back();
  };

  return (
    <form  action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors self-start mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm text-balance">
            Enter your new password below 
        </p>
        </div>
        <div className="grid gap-6">
        <div className="grid gap-3">
            <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            </div>
            <Input id="password" name="password" placeholder="Password" required type={showPassword ? "text" : "password"} />
        </div>
        <div className="grid gap-3">
            <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            </div>
            <Input id="confirmPassword" name="confirmPassword" placeholder="Confirm Password" required type={showPassword ? "text" : "password"} />
        </div>
        <div onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:underline">
            <p className='text-xs'>Show password</p>
        </div>
        <SubmitButton 
            className="w-full" 
            pendingText="Resetting Password..."
        >
            Reset Password
        </SubmitButton>
    
        </div>
    </form>
  )
}