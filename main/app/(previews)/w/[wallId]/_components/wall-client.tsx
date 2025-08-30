"use client"

import React from 'react'
import { usePublicWall } from '@/hooks/walls/use-public-wall'
import WallDisplay from './wall-display'
import { Bubbles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Props {
  wallId: string
  token?: string
  state: string
}

export default function WallClient({ wallId, token, state }: Props) {
  console.log('state', state)
  const { data: wall, isLoading, isError, error } = usePublicWall(wallId, token)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
        <Bubbles className="mr-2 h-4 w-4 text-primary animate-spin [animation-duration:0.5s]" />
          <p className="text-gray-600">Loading wall...</p>
        </div>
      </div>
    )
  }

  if (isError || !wall) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Unable to Load Wall</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'There was an error loading the wall content.'}
          </p>
          <p className="text-sm text-gray-500">
            Please try again later or contact the wall owner if the problem persists.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {wall.state === 'draft' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200">
              Preview Mode
            </Badge>
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              This wall is still in draft mode and may contain incomplete information.
            </span>
          </div>
        </div>
      )}
      <WallDisplay wall={wall} state={state} />
    </div>
  )
}
