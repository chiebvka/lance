"use client"

import { AlignStartVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function MobileSidebarTrigger() {
  const { setOpenMobile } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 hover:bg-bexoni/10 transition-colors duration-200"
      onClick={() => setOpenMobile(true)}
    >
      <AlignStartVertical className="h-5 w-5" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  )
}
