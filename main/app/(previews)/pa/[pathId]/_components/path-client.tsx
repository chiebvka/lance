"use client"

import React from 'react'
import { usePublicPath } from '@/hooks/paths/use-public-path'
import PathDisplay from './path-display'
import { Bubbles } from 'lucide-react'

interface Props {
  pathId: string
  token?: string
}

export default function PathClient({ pathId, token }: Props) {
  const { data: path, isLoading, isError, error } = usePublicPath(pathId, token)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <Bubbles className="mr-2 h-4 w-4 text-primary animate-spin [animation-duration:0.5s]" />
          <p className="text-gray-600">Loading path...</p>
        </div>
      </div>
    )
  }

  if (isError || !path) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Path Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'The requested path could not be found or may be private.'}
          </p>
          <p className="text-sm text-gray-500">
            This path is a private and requires a special token to be viewed. Please contact the sender to get access.
          </p>
        </div>
      </div>
    )
  }

  return <PathDisplay path={path} />
}
