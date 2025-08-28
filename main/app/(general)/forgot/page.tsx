import React from 'react';
import { Bubbles, GalleryVerticalEnd } from 'lucide-react';
// import { Toaster } from "sonner";
import Link from 'next/link';
import ForgotForm from './_components/ForgotForm';
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="border border-bexoni">
        {/* <Toaster richColors /> */}
        <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
            <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-none">
                <Bubbles className="size-4" />
                </div>
                Acme Inc.
            </Link>
            </div>
            <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
                <ForgotForm />
            </div>
            </div>
        </div>
        <div className=" relative hidden bg-primary/50 text-white backdrop-blur-md lg:block">

                {/* Image with purple overlay */}
                <div className="absolute inset-0">
            <img
            src="https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalbomoQPlplS6xJwfnDrFWdsIHeh7XLYzK42T0"
            alt="Image"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
            {/* Purple overlay */}
            <div className="absolute inset-0 bg-purple-500/20"></div>
        </div>

        {/* Frosted glass quote component */}
        <div className="absolute bottom-0  w-full p-6  backdrop-blur-md bg-white/20 border border-white/30 shadow-lg">
        <blockquote >
                <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and
                helped me deliver stunning designs to my clients faster than
                ever before.&rdquo;
                </p>
                <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
        </div>

        </div>
        </div>
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Reset password',
  description: 'Request a password reset link for your BexForte account.',
  path: '/forgot',
});