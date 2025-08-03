"use client"

import React from 'react'
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Props = {}

const tabs = [
    { label: "General", href: "/protected/account" },
    { label: "Security", href: "/protected/account/security" },
    { label: "Billing", href: "/protected/account/billing" }
];


export default function AccountNavigation({}: Props) {
    const pathname = usePathname();
  return (
    <div className="border-b border-gray-200 flex space-x-6">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={clsx(
            "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
            pathname === tab.href
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}