"use client"

import React from 'react'
import { usePublicWall } from '@/hooks/walls/use-public-wall'
import WallDisplay from './wall-display'
import { Bubbles } from 'lucide-react'

interface Props {
  wallId: string
  token?: string
}

export default function WallClient({ wallId, token }: Props) {
  const { data: wall, isLoading, isError, error } = usePublicWall(wallId, token)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
        <Bubbles className="mr-2 h-4 w-4 text-primary animate-spin [animation-duration:0.5s]" />
          {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div> */}
          <p className="text-gray-600">Loading wall...</p>
        </div>
      </div>
    )
  }

  if (isError || !wall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wall Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'The requested wall could not be found or may be private.'}
          </p>
          <p className="text-sm text-gray-500">
            This wall is a private wall that has some missing requirements to be viewed, please contact whoever sent you this link to get access
          </p>
        </div>
      </div>
    )
  }

  return <WallDisplay wall={wall} />
}
