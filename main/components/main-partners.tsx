import React from 'react'
import {  BadgeCent, Diameter, DoorOpen, Factory, FileSignature, FolderPlus, MoveRight,  ReceiptText,  RectangleHorizontal,  TableRowsSplit,  TicketCheck,  UtilityPole } from "lucide-react";
import Link from 'next/link'
import Image from 'next/image'


type Props = {}

export default function MainParnters({}: Props) {
  return (
    <div className='w-full'>
      <main className='w-full mx-auto px-4 py-12 text-left md:text-center'>
        {/* <h2 className="text-indigo-600 text-center font-semibold mb-4">SAVE HUNDREDS OF HOURS</h2> */}
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-6 text-center ">
          We're here to help
          <span className="relative">
            <span className="absolute bottom-1 left-0 w-full h-2 bg-red-200 rounded-full"></span>
          </span>
        </h1>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-12">
          We know what it's like operating as a creative or freelancer in this part of the world and we're hoping to help you serve and manage any type of client you might have to serve
        </p>
        <div className='w-full'>
          <div className=" w-full space-y-8">
            <div className="mt-16 grid border divide-x divide-y rounded-xl gap-2 overflow-hidden sm:grid-cols-2 lg:divide-y-0 lg:grid-cols-3 xl:grid-cols-4">
                <div className="relative group bg-lightCard dark:bg-darkCard transition hover:z-[1] text-left hover:shadow-2xl">
                    <div className="relative p-8 space-y-8">
                        <BadgeCent  size={32} className="text-primary" />                 
                        <div className="space-y-2 ">
                            <h5 className="text-xl text-primary font-medium transition group-hover:text-purple-800">Billings</h5>
                            <p className="text-sm text-muted-foreground">Issue professioanl billings to your clients with intuitive invoices and receipts</p>
                        </div>
                        <Link href="/invoices" className="flex justify-between items-center group-hover:text-primary">
                            <span className="text-sm text-muted-foreground group-hover:text-primary">Read more</span>
                            <span className="-translate-x-4 opacity-0 text-2xl transition duration-300 group-hover:opacity-100 group-hover:translate-x-0"><MoveRight /></span>
                        </Link>
                    </div>
                </div>
                <div className="relative group bg-lightCard dark:bg-darkCard transition hover:z-[1] text-left hover:shadow-2xl">
                    <div className="relative p-8 space-y-8">
                        <TableRowsSplit  size={32} className="text-primary" />
                        
                        <div className="space-y-2">
                            <h5 className="text-xl text-primary font-medium transition group-hover:text-purple-800">Canvases</h5>
                            <p className="text-sm text-muted-foreground ">Manage public, private walls and paths for information, content and updates with canavas sub features</p>
                        </div>
                        <Link href="/walls" className="flex justify-between items-center group-hover:text-primary">
                            <span className="text-sm text-muted-foreground group-hover:text-primary">Read more</span>
                            <span className="-translate-x-4 opacity-0 text-2xl transition duration-300 group-hover:opacity-100 group-hover:translate-x-0"><MoveRight /></span>
                        </Link>
                    </div>
                </div>
                <div className="relative group bg-lightCard dark:bg-darkCard transition hover:z-[1 text-left hover:shadow-2xl">
                    <div className="relative p-8 space-y-8">
                    
                        <FileSignature size={32} className="text-primary" />                        
                        <div className="space-y-2">
                            <h5 className="text-xl text-primary font-medium transition group-hover:text-purple-800">Agreements</h5>
                            <p className="text-sm text-muted-foreground">Give your clients a link to get project details, a contract to sign off on an avenue to track project progress </p>
                        </div>
                        <Link href="/projects" className="flex justify-between items-center group-hover:text-primary">
                            <span className="text-sm text-muted-foreground group-hover:text-primary">Read more</span>
                            <span className="-translate-x-4 opacity-0 text-2xl transition duration-300 group-hover:opacity-100 group-hover:translate-x-0"><MoveRight /></span>
                        </Link>
                    </div>
                </div>
                <div className="relative group bg-lightCard dark:bg-darkCard transition hover:z-[1] text-left hover:shadow-2xl lg:hidden xl:block">
                    <div className="relative p-8 space-y-8 border-dashed border-primary rounded-none transition duration-300 group-hover:bg-lightCard group-hover:dark:bg-darkCard group-hover:border group-hover:scale-90">
                        <FolderPlus size={32} className="text-primary"  />
                        {/* <img src="https://tailus.io/sources/blocks/stacked/preview/images/avatars/metal.png" className="w-10" width="512" height="512" alt="burger illustration" /> */}
                     
                        <div className="space-y-2">
                            <h5 className="text-xl text-primary font-medium transition group-hover:text-purple-800">More features</h5>
                            <p className="text-sm text-muted-foreground">Discover more features and improvements coming to lancefortes and when to expect them </p>
                        </div>
                        <Link href="/features#upcoming" className="flex justify-between items-center group-hover:text-primary">
                            <span className="text-sm text-muted-foreground group-hover:text-primary">Read more</span>
                            <span className="-translate-x-4 opacity-0 text-2xl transition duration-300 group-hover:opacity-100 group-hover:translate-x-0"><MoveRight /></span>
                        </Link>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}