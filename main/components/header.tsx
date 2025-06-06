"use client"
import React, { useState } from 'react'
import Logo from './logo'
import Link from 'next/link'
import { Home } from 'lucide-react';
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from 'next/image'

type Props = {}

export default function Header({}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div>
      <nav className="flex fixed top-0 left-0 right-0 z-40 justify-center p-4 md:p-6 text-foreground">
        <div className="md:w-[85%] w-full flex justify-between items-center bg-background/80 backdrop-blur-md  border-2 border-foreground  px-6 py-2">
          <Logo  />

          <div className="hidden md:flex items-center bg-secondary/80 dark:bg-white/10 backdrop-blur-sm border border-foreground  px-1 py-1">
            <Link
              href="/"
              className="nav-item flex items-center justify-center w-10 h-10 rounded-full bg-secondary dark:bg-white/10 mx-1 hover:bounce-x"
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link href="/about" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              About
            </Link>
            <Link href="/works" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              Works
            </Link>
            <Link href="/blog" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              Blog
            </Link>
            <Link href="/testimonials" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              Testimonials
            </Link>
          </div>


           {/* Mobile Navigation with Sheet */}
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
             <SheetTrigger asChild>
               <button className="md:hidden  p-2">
                 <Menu size={24} />
               </button>
             </SheetTrigger>
             <SheetContent
               side="right"
               className="border-r-primary-dark w-[85vw] sm:w-[400px] p-0"
             >
               <div className="h-full flex flex-col">
                 <SheetHeader className="p-6 border-b border-white/10">
                   <SheetTitle className=" flex items-center gap-3">
                     <div className="relative h-10 w-10 rounded-full p-1">
                       <Image
                         src="/logo.jpeg"
                         alt="Organization Logo"
                         width={60}
                         height={60}
                         className="object-contain"
                       />
                     </div>
                     {/* <span>Organization Name</span> */}
                   </SheetTitle>
                 </SheetHeader>
 
                 <div className="flex-1 overflow-y-auto">
                   <div className="p-6">
                 
 
                     <nav className="flex flex-col space-y-1">
                       <MobileNavLink href="/" label="Home" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/board" label="Executive Members" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/about" label="About" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/gallery" label="Media Gallery" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/blog" label="Projects & News" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/members" label="Membership" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/events" label="Events" onClick={() => setIsSheetOpen(false)} />
                       <MobileNavLink href="/donation" label="Donate" onClick={() => setIsSheetOpen(false)} />

                     </nav>
                   </div>
                 </div>
 
               </div>
             </SheetContent>
           </Sheet>
        </div>

      </nav>


        

     
    </div>
  )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-3 px-2 rounded-md transition-colors"
      onClick={onClick}
    >
      <span>{label}</span>
    </Link>
  )
}