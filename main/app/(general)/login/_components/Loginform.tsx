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
import { signInAction } from '@/actions/auth/login';
import { Bubbles } from 'lucide-react';


const initialState: Message | undefined = undefined;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)

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
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="hello@example.com" required />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input id="password" name="password" placeholder="Password" required type={showPassword ? "text" : "password"} />
        </div>
        <div onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:underline">
          <p className='text-xs'>Show password</p>
        </div>
        <SubmitButton 
          className="w-full" 
          pendingText="Logging in..."
        >
          Login
        </SubmitButton>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button variant="outline" 
          type="button"      
          className='border text-primary border-lance'
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Bubbles className="mr-2 text-lance size-4 animate-spin [animation-duration:0.5s]" />
          ) : (
            <Icons.google className="mr-2 text-lance size-6" />
          )}{" "}
          Sign up with Google
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline hover:text-primary underline-offset-4">
          Sign Up
        </Link>
      </div>
    </form>
  )
}
