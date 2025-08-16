"use client"

import React from 'react'
import { usePublicWall } from '@/hooks/walls/use-public-wall'
import WallDisplay from './wall-display'

interface Props {
  wallId: string
  token?: string
}

export default function WallClient({ wallId, token }: Props) {
  const { data: wall, isLoading, isError, error } = usePublicWall(wallId, token)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
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
            If you have a token, make sure it's included in the URL.
          </p>
        </div>
      </div>
    )
  }

  return <WallDisplay wall={wall} />
}
