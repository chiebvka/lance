"use client"
import React from 'react'
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Props = {}



const tabs = [
    { label: "General", href: "/protected/settings" },
    { label: "Finance", href: "/protected/settings/finance" },
    { label: "Notification", href: "/protected/settings/notifications" },
    { label: "Billing", href: "/protected/settings/billing" },
];


export default function SettingsNavigation({}: Props) {
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