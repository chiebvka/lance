import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

import Link from 'next/link';
import Logo from './logo';
import Logofull from './logofull';

type Props = {}

export default function Footer({}: Props) {
    const shadowStyle = `shadow-[8px_8px_0px_0px_hsla(267,95.2%,63.3%,1),0_0_20px_hsla(267,95.2%,63.3%,0.15)]`; 
  return (
    <div className='w-full'>
        <footer className=" ">
            <div className="container mx-auto space-y-4 px-4 py-12">
                <div className={`  ${shadowStyle} my-12 p-10 md:p-16 bg-lightCard dark:bg-darkCard   text-center border border-bexoni mx-auto box-shadow-lg shadow-[0_10px_30px_-5px_hsla(278,29%,45%,0.25),0_5px_15px_-5px_hsla(278,29%,45%,0.2)]`}>
                <h1 className="text-lg sm:text-3xl md:text-4xl font-bold  mb-6">
                    Stress operations powered by Bexforte.
                </h1>
                <p className="text-sm md:text-lg  mb-10 max-w-3xl mx-auto">
                    Invoicing, Receipting, Project Management, Client Management, Wall & Canvas Management, as well as Path & Link Management to help you manage your operations.
                </p>
                <div className="flex mx-auto justify-center items-center gap-4">
                    <Button
                        asChild
                        className=""
                    >
                        <Link href="/login">
                        Try it for free
                        </Link>
             
                    </Button>
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3  gap-8">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                        <Logofull height={40} width={40} />
                        <span className="text-xl sr-only font-bold">Bexforte Logo</span>
                        </div>
                        <p className=" text-sm ">
                            One stop fort for managing your operations
                        </p>
                        {/* <div className="inline-block">
                        <div className="border border-red-100 bg-red-50 rounded-lg px-4 py-2">
                            <div className="text-sm text-gray-600">PRODUCT HUNT</div>
                            <div className="text-red-500 font-semibold">#4 Product of the Day</div>
                        </div>
                        </div> */}
                    </div>
                    {/* Column 2 */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                        <h3 className="font-semibold mb-4"> Features</h3>
                        <ul className="space-y-2">
                            <li className='text-sm'>
                                <Link href="/invoices" className=" hover:text-purple-600 hover:underline">
                                Invoices
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/receipts" className=" hover:text-purple-600 hover:underline">
                                Receipts
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/projects" className=" hover:text-purple-600 hover:underline">
                                Projects
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/feedbacks" className=" hover:text-purple-600 hover:underline">
                                Feedbacks
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/paths" className=" hover:text-purple-600 hover:underline">
                                Paths & Links
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/walls" className=" hover:text-purple-600 hover:underline">
                                Walls & Canvas
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/upcoming" className=" hover:text-purple-600 hover:underline">
                                Upcoming features
                                </Link>
                            </li>
                        </ul>
                        </div>
                        <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li className='text-sm'>
                                <Link href="/pricing" className=" hover:text-purple-600 hover:underline">
                                Pricing Plans
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <a href="mailto:support@bexoni.com?subject=Bexforte Support" className=" hover:text-purple-600 hover:underline">
                                Help & Support
                                </a>
                            </li>
                            <li className='text-sm'>
                                <Link href="/policy" className=" hover:text-purple-600 hover:underline">
                                Privacy Policy
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/terms" className=" hover:text-purple-600 hover:underline">
                                Terms of Service
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/refund" className=" hover:text-purple-600 hover:underline">
                                Refund Policy
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/#faqs" className=" hover:text-purple-600 hover:underline">
                                    FAQs
                                </Link>
                            </li>
                        </ul>
                        </div>
                    </div>

                    {/* Column 3 */}
                    <div>
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li className='text-sm'>
                                <Link href="https://post-bridge.com?atp=bexonilabs" target="_blank" className=" hover:text-purple-600 hover:underline">
                                 Content Scheduling  
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="https://www.bexoni.com/calculator" target="_blank" className=" hover:text-purple-600 hover:underline">
                                MVP Development
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/legal#privacy" className=" hover:text-purple-600 hover:underline">
                                Privacy Policy
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/legal#terms" className=" hover:text-purple-600 hover:underline">
                                Terms of Service
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/legal#refund" className=" hover:text-purple-600 hover:underline">
                                Refund Policy
                                </Link>
                            </li>
                            <li className='text-sm'>
                                <Link href="/faq" className=" hover:text-purple-600 hover:underline">
                                    FAQs
                                </Link>
                            </li>
                        </ul>
                    </div>
                    {/* <div>
                        <h3 className="font-semibold mb-4">Related</h3>
                        <p className=" text-sm mb-4">
                        Have any issues or want to get in touch?
                        </p>
                        <div className="flex flex-col space-y-2">
                            <a className=" block hover:text-purple-600 hover:underline text-xs" href="mailto:hello@lancefortes.com">hello@lancefortes.com</a>
                            <a className=" block hover:text-purple-600 hover:underline text-xs" href="tel:+2347046508959">+2347046508959</a>
                            <a className=" block hover:text-purple-600 hover:underline text-xs" href="/#">Lagos Nigeria</a>
                        </div>
                    </div> */}
                </div>
            </div>
        </footer>
    </div>
  )
}