"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb"
import { getProjectNameById } from "@/actions/project/fetch"
import SpotlightCommand from "./general/spotlight-command"

function ProjectNameCrumb({ projectId }: { projectId: string }) {
  const [name, setName] = useState("...") // Initial loading state

  useEffect(() => {
    const fetchName = async () => {
      const projectName = await getProjectNameById(projectId)
      setName(projectName || projectId) // Fallback to ID if not found or on error
    }
    fetchName()
  }, [projectId])

  return <>{name}</>
}

export default function Breadcrumbs({}: {}) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const transformLabel = (segment: string) => {
    if (segment === "protected") return "Dashboard"
    return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  if (segments.length === 0) return null

  return (
    <div className="flex items-center justify-between w-full">
      {/* Desktop Breadcrumbs */}
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const href = "/" + segments.slice(0, index + 1).join("/")
            const prevSegment = index > 0 ? segments[index - 1] : undefined

            let labelContent
            if (prevSegment === "projects" && isUUID(segment)) {
              labelContent = <ProjectNameCrumb projectId={segment} />
            } else {
              labelContent = transformLabel(segment)
            }

            return (
              <React.Fragment key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{labelContent}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{labelContent}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile Page Title */}
      {/* <div className="md:hidden flex-1">
        <h1 className="text-lg font-semibold truncate">
          {segments.length > 0 ? transformLabel(segments[segments.length - 1]) : 'Dashboard'}
        </h1>
      </div> */}
      
      {/* Spotlight Command integrated into breadcrumbs - positioned right */}
      <div className="flex-1 md:flex-none flex justify-end">
        <SpotlightCommand />
      </div>
    </div>
  )
}