"use client"

import React from 'react'
import { Path } from '@/hooks/paths/use-paths'
import { ExternalLink, Mail, Phone, Globe, FileText, Calendar, Split } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatISO } from 'date-fns';

interface PathEntryDisplay {
  id: string
  type: 'link' | 'website' | 'email' | 'phone'
  title: string
  url: string
  description?: string | null
  color?: string | null
  clickable?: boolean
}

interface PathDisplayProps {
  path: Path
}

export default function PathDisplay({ path }: PathDisplayProps) {
  const organizationLogoUrl = path.organizationLogoUrl || path.organizationLogo || "/placeholder.svg"
  const organizationName = path.organizationNameFromOrg || path.organizationName || "Organization"
  const entries = path.content?.entries || []

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "email": return <Mail className="h-5 w-5" />
      case "phone": return <Phone className="h-5 w-5" />
      case "website": return <Globe className="h-5 w-5" />
      default: return <ExternalLink className="h-5 w-5" />
    }
  }

  const handleLinkClick = (entry: PathEntryDisplay) => {
    if (entry.clickable && entry.url) {
      let url = entry.url
      if (entry.type === "email" && !url.startsWith("mailto:")) {
        url = `mailto:${url}`
      } else if (entry.type === "phone" && !url.startsWith("tel:")) {
        url = `tel:${url}`
      }
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="min-h-screen md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className='shadow-xl min-h-screen shadow-black/10 border-0 overflow-hidden'>
          <div className="bg-gradient-to-r from-primary to-bexoni/60 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div  className="flex items-center md:gap-3 gap-1">
              {organizationLogoUrl ? (
                      <img 
                        src={organizationLogoUrl} 
                        alt={`${organizationName} Logo`} 
                        className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain" />
                    )  : (
                      <div className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 flex items-center justify-center">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-xs md:text-base">{organizationName}</h3>
                      <p className="text-blue-100 text-xs md:text-sm">Paths</p>
                    </div>
              </div>
              <div className="flex items-center gap-2">
                  <Badge className= 'bg-green-500 text-green-100 border-green-300 text-xs md:text-sm'>
                    Active
                  </Badge>
                  <Badge variant="secondary" className={`bg-white/20 text-white border-white/30 text-xs md:text-sm`}>
                    Updated: {path?.updatedAt ? new Date(path?.updatedAt).toLocaleDateString() : new Date(path?.created_at).toLocaleDateString()}
                  </Badge>
              </div>
            </div>
            <h1 className="md:text-3xl text-xl font-bold">{path.name || "Links"}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">

              <div className="flex items-center gap-1">
                <Split className="w-4 h-4" />
                <span className="text-xs md:text-sm">Paths Directory</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs md:text-sm">Created: {new Date(path.created_at).toLocaleDateString()}</span>
              </div>
             
     
            
            </div>
          </div>
          <CardContent className="md:p-8 p-4 space-y-6">
            <div>
              <h3 className="font-semibold text-primary mb-2">About Path:</h3>
              <p className="md:text-base text-sm">{path.description || "Collection of important links"}</p>
            </div>
            <div className="space-y-3">
            {entries.map((entry: any) => (
              <button
                key={entry.id}
                className={`w-full h-auto p-4 text-white border-0 rounded-none transition-all duration-200 ${
                  entry.clickable ? "cursor-pointer hover:opacity-90 hover:scale-105" : "cursor-default"
                }`}
                style={{ backgroundColor: entry.color || "hsl(220, 70%, 50%)" }}
                onClick={() => handleLinkClick(entry)}
                disabled={!entry.clickable}
              >
                <div className="flex items-center gap-3 w-full">
                  {getIcon(entry.type)}
                  <div className="text-left flex-1">
                    <div className="font-medium">{entry.title}</div>
                    {entry.description && <div className="text-sm opacity-90">{entry.description}</div>}
                  </div>
                  {entry.clickable && <ExternalLink className="h-4 w-4 opacity-75" />}
                </div>
              </button>
            ))}
            
            {entries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No links available</p>
                <p className="text-sm">This path doesn't have any links yet.</p>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <img
              src={organizationLogoUrl}
              alt={`${organizationName} Logo`}
              className="w-20 h-20 rounded-full mx-auto border-4 border-white shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{path.name || "Links"}</h1>
              <p className="text-gray-600">{path.description || "Collection of important links"}</p>
            </div>
          </div>

          <div className="space-y-3">
            {entries.map((entry: any) => (
              <button
                key={entry.id}
                className={`w-full h-auto p-4 text-white border-0 rounded-lg transition-all duration-200 ${
                  entry.clickable ? "cursor-pointer hover:opacity-90 hover:scale-105" : "cursor-default"
                }`}
                style={{ backgroundColor: entry.color || "hsl(220, 70%, 50%)" }}
                onClick={() => handleLinkClick(entry)}
                disabled={!entry.clickable}
              >
                <div className="flex items-center gap-3 w-full">
                  {getIcon(entry.type)}
                  <div className="text-left flex-1">
                    <div className="font-medium">{entry.title}</div>
                    {entry.description && <div className="text-sm opacity-90">{entry.description}</div>}
                  </div>
                  {entry.clickable && <ExternalLink className="h-4 w-4 opacity-75" />}
                </div>
              </button>
            ))}
            
            {entries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No links available</p>
                <p className="text-sm">This path doesn't have any links yet.</p>
              </div>
            )}
          </div>

          <div className="text-center pt-8">
            <p className="text-sm text-gray-500">
              Powered by {organizationName}
            </p>
          </div>
        </div>
      </div> */}
    </div>
  )
}
