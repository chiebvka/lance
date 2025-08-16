"use client"

import React from 'react'
import { FileText, ExternalLink, VideoIcon, ImageIcon, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Block {
  id: string
  type: 'heading' | 'text' | 'link' | 'image' | 'video' | 'file'
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
  content: WallContent | null
  organizationName?: string | null
  organizationLogo?: string | null
  organizationEmail?: string | null
  organizationLogoUrl?: string | null
  organizationNameFromOrg?: string | null
  organizationEmailFromOrg?: string | null
}

interface Props {
  wall: Wall
}

export default function WallDisplay({ wall }: Props) {
  const renderBlock = (block: Block) => {
    if (!block.visible && block.visible !== undefined) return null

    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {block.props?.text || 'Heading'}
            </h2>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {block.props?.markdown || 'Text content'}
              </p>
            </div>
          </div>
        )

      case 'link':
        return (
          <Card className="border-l-4 border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <a
                href={block.props?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                {block.props?.title || 'Link'}
              </a>
              {block.props?.description && (
                <p className="text-sm text-gray-600 mt-1">
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
            <div className="relative rounded-none overflow-hidden border border-gray-200 bg-gray-100">
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
                          <div class="text-center text-gray-500">
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
                  <div className="text-center text-gray-500">
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
                    variant="outline"
                    onClick={handleImageDownload}
                    className="flex-shrink-0  text-xs px-2 py-1 rounded-none"
                  >
                    <Download className="w-3 h-3 mr-1" />
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
              <div className="relative rounded-none overflow-hidden border border-gray-200 bg-gray-100">
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
                          <div class="text-center text-gray-500">
                            <svg class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p class="text-sm">Video failed to load</p>
                            <p class="text-xs text-gray-400 mt-1">URL: ${videoUrl}</p>
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
              <Card className="border-l-4 border-purple-500 bg-purple-50">
                <CardContent className="p-4">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <VideoIcon className="h-4 w-4" />
                    Watch Video
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    External video link
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg border flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <VideoIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">No video available</p>
                </div>
              </div>
            )}

            {/* Minimal Strip Below - Only show for file videos */}
            {videoUrl && isFileVideo && (
              <div className="mt-2 p-2 border border-gray-200 rounded-none bg-bexoni/10">
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
                    <Download className="w-3 h-3 mr-1" />
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
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <div className="w-full h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-2" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-gray-400">File</p>
                </div>
              </div>
            </div>

            {/* Minimal Strip Below */}
            <div className="mt-2 p-2 border border-gray-200 rounded-md bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">{fileName}</span>
                </div>
                {fileUrl && (
                  <button 
                    onClick={handleFileDownload}
                    className="flex-shrink-0 text-xs px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1 inline" />
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 bg-gray-100 rounded border">
            <p className="text-sm text-gray-500">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-gray-200">
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
        </div>

        {/* Content Blocks */}
        <div className="space-y-8">
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
        </div>

        {/* Footer */}
        {organizationEmail && (
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Contact: {organizationEmail}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
