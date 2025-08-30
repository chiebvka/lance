"use client"

import React from 'react'
import { FileText, ExternalLink, VideoIcon, ImageIcon, Download, Calendar, BrickWall, HardDriveDownload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'



type BlockType = "heading" | "text" | "link" | "image" | "video" | "file"
interface Block {
  id: string
  type: BlockType
  props: any
  position: number
  visible?: boolean
}

interface WallContent {
  version: number
  blocks: Block[]
}

interface Wall {
  id: string
  name: string | null
  description?: string | null
  updatedAt?: string | null
  created_at?: string | null
  content: WallContent | null
  organizationName?: string | null
  organizationLogo?: string | null
  organizationEmail?: string | null
  organizationLogoUrl?: string | null
  organizationNameFromOrg?: string | null
  organizationEmailFromOrg?: string | null
}

interface Props {
  state: string
  wall: Wall
    /** set true to hide section headers entirely */
    hideSectionHeaders?: boolean
}


/** Map each block type to a section title (used once on first encounter) */
const SECTION_TITLES: Partial<Record<BlockType, string>> = {
  heading: "",
  text: "",
  image: "",
  video: "",
  file: " ",
  link: "",
  // heading: "Instructions & Information",
  // text: "Instructions & Information",
  // image: "Image Assets & Media",
  // video: "Video Assets & Media",
  // file: " Files",
  // link: "External Links & Resources",
}



export default function WallDisplay({ wall, hideSectionHeaders = false, state }: Props) {
  const renderBlock = (block: Block) => {
    if (!block.visible && block.visible !== undefined) return null

    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <h2 className="md:text-2xl text-lg font-bold ">
              {block.props?.text || 'Heading'}
            </h2>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            <div className="prose prose-gray max-w-none">
              <p className=" leading-relaxed md:text-base text-sm whitespace-pre-wrap">
                {block.props?.markdown || 'Text content'}
              </p>
            </div>
          </div>
        )

      case 'link':
        return (
          <Card className="border-l-4 border-purple-500 bg-purple-50">
            <CardContent className="p-4">
              <a
                href={block.props?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                {block.props?.title || 'Link'}
              </a>
              {block.props?.description && (
                <p className="text-sm text-primary mt-1">
                  {block.props.description}
                </p>
              )}
            </CardContent>
          </Card>
        )

      case 'image':
        const imageUrl = block.props?.fileId || block.props?.cloudflareUrl
        const imageAlt = block.props?.alt || 'Image'
        const imageFilename = imageUrl ? imageUrl.split('/').pop() || 'image' : 'image'
        
        const handleImageDownload = async () => {
          if (imageUrl) {
            try {
              // Fetch the file as a blob to force download
              const response = await fetch(imageUrl)
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              
              const link = document.createElement("a")
              link.href = url
              link.download = imageFilename
              link.style.display = "none"
              
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              // Clean up the blob URL
              window.URL.revokeObjectURL(url)
            } catch (error) {
              console.error('Download failed:', error)
              // Fallback: try direct download
              const link = document.createElement("a")
              link.href = imageUrl
              link.download = imageFilename
              link.target = "_blank"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          }
        }

        return (
          <div className="group">
            <div className="relative rounded-none overflow-hidden border border-primary bg-gray-100">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-64 flex items-center justify-center">
                          <div class="text-center ">
                            <svg class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p class="text-sm">Image failed to load</p>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center">
                  <div className="text-center ">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Minimal Strip Below */}
            <div className="mt-2 p-2 border  rounded-none bg-bexoni/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary truncate">{imageAlt}</span>
                </div>
                {imageUrl && (
                  <Button 
                    onClick={handleImageDownload}
                    variant="outline"
                    className="flex-shrink-0  text-xs px-2 py-1 rounded-none"
                  >
                    <HardDriveDownload className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        )

      case 'video':
        const videoUrl = block.props?.fileId || block.props?.cloudflareUrl || block.props?.url
        const isFileVideo = block.props?.provider === 'file' || videoUrl?.includes('/walls/videos/') || videoUrl?.match(/\.(mp4|avi|mov|mkv|webm)$/i)
        const videoTitle = block.props?.title || 'Video'
        const videoFilename = videoUrl ? videoUrl.split('/').pop() || 'video' : 'video'
        
        const handleVideoDownload = async () => {
          if (videoUrl && isFileVideo) {
            try {
              // Fetch the file as a blob to force download
              const response = await fetch(videoUrl)
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              
              const link = document.createElement("a")
              link.href = url
              link.download = videoFilename
              link.style.display = "none"
              
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              // Clean up the blob URL
              window.URL.revokeObjectURL(url)
            } catch (error) {
              console.error('Download failed:', error)
              // Fallback: try direct download
              const link = document.createElement("a")
              link.href = videoUrl
              link.download = videoFilename
              link.target = "_blank"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          }
        }

        return (
          <div className="group">
            {videoUrl && isFileVideo ? (
              <div className="relative rounded-none overflow-hidden border border-primary bg-gray-100">
                <video
                  controls
                  className="w-full h-64 object-cover"
                  src={videoUrl}
                  onError={(e) => {
                    console.error('Video failed to load:', videoUrl)
                    const target = e.target as HTMLVideoElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-64 flex items-center justify-center">
                          <div class="text-center ">
                            <svg class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p class="text-sm">Video failed to load</p>
                            <p class="text-xs  mt-1">URL: ${videoUrl}</p>
                          </div>
                        </div>
                      `
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : videoUrl ? (
              <Card className="border-l-4 border-primary bg-primary/10">
                <CardContent className="p-4">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                  >
                    <VideoIcon className="h-4 w-4" />
                    Watch Video
                  </a>
                  <p className="text-sm  mt-1">
                    External video link
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full h-64 bg-primary rounded-none border flex items-center justify-center">
                <div className="text-center">
                  <VideoIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">No video available</p>
                </div>
              </div>
            )}

            {/* Minimal Strip Below - Only show for file videos */}
            {videoUrl && isFileVideo && (
              <div className="mt-2 p-2 border border-primary rounded-none bg-bexoni/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
                    <VideoIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary truncate">{videoTitle}</span>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleVideoDownload}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded-none"
                  >
                    <HardDriveDownload className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        )

      case 'file':
        const fileUrl = block.props?.fileId || block.props?.cloudflareUrl
        const fileName = block.props?.label || 'Download File'
        const fileFilename = fileUrl ? fileUrl.split('/').pop() || fileName : fileName
        
        const handleFileDownload = async () => {
          if (fileUrl) {
            try {
              // Fetch the file as a blob to force download
              const response = await fetch(fileUrl)
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              
              const link = document.createElement("a")
              link.href = url
              link.download = fileFilename
              link.style.display = "none"
              
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              // Clean up the blob URL
              window.URL.revokeObjectURL(url)
            } catch (error) {
              console.error('Download failed:', error)
              // Fallback: try direct download
              const link = document.createElement("a")
              link.href = fileUrl
              link.download = fileFilename
              link.target = "_blank"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          }
        }

        return (
          <div className="group">
            <div className="relative rounded-none overflow-hidden border border-primary bg-gray-100">
              <div className="w-full h-64 flex items-center justify-center">
                <div className="text-center ">
                  <FileText className="h-16 w-16 mx-auto mb-2" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs ">File</p>
                </div>
              </div>
            </div>

            {/* Minimal Strip Below */}
            <div className="mt-2 p-2 border border-primary rounded-none ">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary truncate">{fileName}</span>
                </div>
                {fileUrl && (
                  <Button 
                    onClick={handleFileDownload}
                                        variant="outline"
                    className="flex-shrink-0  text-xs px-2 py-1 rounded-none"
                  >
                    <HardDriveDownload className="w-4 h-4 mr-1 inline" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 bg-gray-100 rounded border">
            <p className="text-sm ">
              Unknown block type: {block.type}
            </p>
          </div>
        )
    }
  }

  const blocks = wall.content?.blocks || []
  const sortedBlocks = blocks
    .filter(block => block.visible !== false)
    .sort((a, b) => (a.position || 0) - (b.position || 0))

  // Prioritize relation data over fallback fields
  const organizationName = wall.organizationNameFromOrg || wall.organizationName
  const organizationLogo = wall.organizationLogoUrl || wall.organizationLogo
  const organizationEmail = wall.organizationEmailFromOrg || wall.organizationEmail


  // ----- build a linear timeline with one-off section headers (no regrouping)
  type TimelineItem =
    | { kind: "header"; title: string; firstType: BlockType; key: string }
    | { kind: "block"; block: Block; key: string }

  const seenSectionFor: Partial<Record<BlockType, boolean>> = {}
  const timeline: TimelineItem[] = []

  for (const block of sortedBlocks) {
    const title = SECTION_TITLES[block.type]
    if (!hideSectionHeaders && title && !seenSectionFor[block.type]) {
      timeline.push({
        kind: "header",
        title,
        firstType: block.type,
        key: `section-${block.type}`,
      })
      seenSectionFor[block.type] = true
    }
    timeline.push({ kind: "block", block, key: block.id })
  }

  return (
    <div className="min-h-screen  md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl min-h-screen shadow-black/10 border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-bexoni/60 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div  className="flex items-center md:gap-3 gap-1">
                {organizationLogo ? (
                  <img 
                    src={organizationLogo} 
                    alt={organizationName || 'Organization'} 
                    className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain" />
                ) : (
                  <div className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-xs md:text-base">{organizationName}</h3>
                  <p className="text-blue-100 text-xs md:text-sm">Wall</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className= {`${state === 'draft' ? 'bg-yellow-500 text-yellow-100 border-yellow-300' : 'bg-green-500 text-green-100 border-green-300'} text-xs md:text-sm`}>
                  {state === 'draft' ? 'Draft' : 'Published'}
                </Badge>
                <Badge variant="secondary" className={`bg-white/20 text-white border-white/30 text-xs md:text-sm`}>
                  Updated: {wall?.updatedAt ? 
                    new Date(wall.updatedAt as string).toLocaleDateString() : 
                    new Date(wall.created_at as string).toLocaleDateString()
                  }
                </Badge>
              </div>
            </div>
            <h1 className="md:text-3xl text-xl font-bold">{wall.name || "Wall"}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">

              <div className="flex items-center gap-1">
                <BrickWall className="w-4 h-4" />
                <span className="text-xs md:text-sm">Display Wall</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs md:text-sm">Created: {new Date(wall.created_at as string).toLocaleDateString()}</span>
              </div>
            
            </div>
          </div>
          <CardContent className="md:p-8 p-4 space-y-6">
            <div>
              <h3 className="font-semibold text-primary mb-2">About Wall:</h3>
              <p className="md:text-base text-sm">{wall.description || "Collection of important links"}</p>
            </div>
            {timeline.length > 0 ? (
              <div className="space-y-6">
                {timeline.map((item) =>
                  item.kind === "header" ? (
                    <div key={item.key} className=" rounded-none p-6 border">
                      <h3 className="text-lg font-semibold text-primary">
                        {item.title}
                      </h3>
                    </div>
                  ) : (
                    <div
                      key={item.key}
                      className=" rounded-none border  p-4"
                    >
                      {renderBlock(item.block)}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className=" rounded-none p-8">
                  <BrickWall className="w-16 h-16 mx-auto mb-4 " />
                  <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
                  <p className="">
                    This wall doesn't have any content blocks yet. Content will appear here once it's added.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {/* Header */}
          {/* <div className="text-center mb-8 pb-8 border-b border-gray-200">
            {organizationLogo && (
              <div className="mb-4">
                <img
                  src={organizationLogo}
                  alt={organizationName || 'Organization'}
                  className="h-16 w-auto mx-auto"
                />
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {wall.name}
            </h1>
            {wall.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {wall.description}
              </p>
            )}
            {organizationName && (
              <p className="text-sm text-gray-500 mt-4">
                by {organizationName}
              </p>
            )}
          </div> */}

          {/* Content Blocks */}
          {/* <div className="space-y-8">
            {sortedBlocks.length > 0 ? (
              sortedBlocks.map((block) => (
                <div key={block.id} className="animate-fade-in">
                  {renderBlock(block)}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  This wall doesn't have any content yet.
                </p>
              </div>
            )}
          </div> */}
        </Card>

        {/* Footer */}
   
      </div>
    </div>
  )
}
