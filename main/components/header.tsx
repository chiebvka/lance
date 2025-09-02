"use client"
import React, { useState } from 'react'
import Logo from './logo'
import Link from 'next/link'
import { Home, ChevronDown } from 'lucide-react';
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from 'next/image'
import Logofull from './logofull';
import { Button } from './ui/button';
import { useTheme } from 'next-themes'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  FolderKanban,
  Receipt,
  ReceiptText,
  MessagesSquare,
  BrickWall,
  Split,
} from "lucide-react"

type Props = {}

export default function Header({}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  const features = [
    {
      title: "Projects",
      href: "/projects",
      description: "Plan, track, and deliver projects on time with intuitive project management tools."
    },
    {
      title: "Invoices",
      href: "/invoices",
      description: "Create, send, and track professional invoices with automated reminders and payment processing."
    },
    {
      title: "Receipts",
      href: "/receipts",
      description: "Capture, categorize, and store receipts automatically with AI-powered expense tracking."
    },
    {
      title: "Feedbacks",
      href: "/feedbacks",
      description: "Collect and manage customer feedback with comprehensive analysis and actionable insights."
    },
    {
      title: "Paths",
      href: "/paths",
      description: "Create structured links and workflows that guide clients through your processes."
    },
    {
      title: "Walls",
      href: "/walls",
      description: "Create collaborative digital spaces to organize and share project content."
    }
  ]

  return (
    <div>
      <nav className="flex fixed top-0 left-0 right-0 z-40 justify-center p-4 md:p-6 text-foreground">
        <div className="md:w-[85%] w-full flex justify-between items-center bg-background/80 backdrop-blur-md  border border-primary  px-6 py-2">
          <Logo height={40} width={40} />

          <div className="hidden md:flex items-center bg-secondary/80 dark:bg-white/10 backdrop-blur-sm   px-1 py-1">
            <Link
              href="/"
              className="nav-item flex items-center justify-center w-10 h-10 rounded-none bg-secondary dark:bg-white/10 mx-1 hover:bounce-x"
            >
              <Home className="w-5 h-5" />
            </Link>
            
            {/* Features Navigation Menu with better positioning */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem className='relative'>
                  <NavigationMenuTrigger className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x bg-transparent border-none shadow-none">
                    Features
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="left-0 top-0 data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52">
                    <ul className="grid w-[500px] gap-4 p-4 md:w-[600px] lg:w-[700px] grid-cols-[2fr_1fr]">
                      {/* Left Panel - Large Promotional Section (Non-clickable) */}
                      <li className="row-span-1">
                        <div className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md  p-6 no-underline outline-hidden select-none">
                          <div className="mt-4 mb-2 text-lg text-primary font-medium">
                            Bexforte Features
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Comprehensive tools to manage your business operations in one place.
                          </p>
                          <div className="mt-4">
                            <Image
                              src={resolvedTheme === 'dark' ? '/navigationdark.png' : '/navigationlight.png'}
                              alt="Bexforte Features"
                              width={200}
                              height={120}
                              className="object-cover rounded-none"
                            />
                          </div>
                        </div>
                      </li>
                      
                      {/* Right Panel - Features List (Just Titles) */}
                      <li className="row-span-1">
                        <div className="space-y-2">
                          {features.map((feature) => {
                            // Map feature titles to their corresponding icons
                            const getIcon = (title: string) => {
                              switch (title) {
                                case 'Projects': return <FolderKanban className="w-4 h-4" />;
                                case 'Invoices': return <Receipt className="w-4 h-4" />;
                                case 'Receipts': return <ReceiptText className="w-4 h-4" />;
                                case 'Feedbacks': return <MessagesSquare className="w-4 h-4" />;
                                case 'Walls': return <BrickWall className="w-4 h-4" />;
                                case 'Paths': return <Split className="w-4 h-4" />;
                                default: return null;
                              }
                            };

                            return (
                              <NavigationMenuLink key={feature.title} asChild>
                                <Link href={feature.href} className="flex items-center gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:text-primary focus:text-primary">
                                  {getIcon(feature.title)}
                                  <div className="text-sm font-medium leading-none">{feature.title}</div>
                                </Link>
                              </NavigationMenuLink>
                            );
                          })}
                        </div>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link href="/works" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              Works
            </Link>
            <Link href="/blog" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              Blog
            </Link>
            <Link href="/testimonials" className="nav-item px-4 py-2 hover:text-primary transition-colors hover:bounce-x">
              Testimonials
            </Link>
            <Button>
              <Link href="/login">
                Start for free
              </Link>
            </Button>
          </div>

          {/* Mobile Navigation with Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2">
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
                        src={resolvedTheme === 'dark' ? '/bexlights.png' : '/bexdarks.png'}
                        alt="Organization Logo"
                        width={60}
                        height={60}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-lg font-semibold">Bexforte</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <nav className="flex flex-col space-y-1">
                      <MobileNavLink href="/" label="Home" onClick={() => setIsSheetOpen(false)} />
                      
                      {/* Features Dropdown for Mobile */}
                      <div className="py-3 px-2">
                        <button 
                          onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                          className="flex items-center justify-between w-full py-3 px-2 rounded-md transition-colors hover:text-primary"
                        >
                          <span className="text-sm font-medium">Features</span>
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isFeaturesOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isFeaturesOpen && (
                          <div className="pl-4 space-y-2 mt-2">
                            <MobileNavLink href="/projects" label="Projects" onClick={() => setIsSheetOpen(false)} />
                            <MobileNavLink href="/invoices" label="Invoices" onClick={() => setIsSheetOpen(false)} />
                            <MobileNavLink href="/receipts" label="Receipts" onClick={() => setIsSheetOpen(false)} />
                            <MobileNavLink href="/feedbacks" label="Feedbacks" onClick={() => setIsSheetOpen(false)} />
                            <MobileNavLink href="/paths" label="Paths" onClick={() => setIsSheetOpen(false)} />
                            <MobileNavLink href="/walls" label="Walls" onClick={() => setIsSheetOpen(false)} />
                          </div>
                        )}
                      </div>
                      
                      <MobileNavLink href="/board" label="Executive Members" onClick={() => setIsSheetOpen(false)} />
                      <MobileNavLink href="/about" label="About" onClick={() => setIsSheetOpen(false)} />
                      <MobileNavLink href="/gallery" label="Media Gallery" onClick={() => setIsSheetOpen(false)} />
                      <MobileNavLink href="/blog" label="Projects & News" onClick={() => setIsSheetOpen(false)} />
                      <MobileNavLink href="/members" label="Membership" onClick={() => setIsSheetOpen(false)} />
                      <MobileNavLink href="/events" label="Events" onClick={() => setIsSheetOpen(false)} />
                      <MobileNavLink href="/donation" label="Donate" onClick={() => setIsSheetOpen(false)} />
                      <Button>
                        <Link href="/login">
                          Start for free
                        </Link>
                      </Button>
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