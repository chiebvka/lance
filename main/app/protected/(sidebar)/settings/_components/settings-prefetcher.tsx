"use client"

import { useEffect } from 'react'
import { useOrganization } from '@/hooks/organizations/use-organization'

export default function SettingsPrefetcher() {
  // Simply subscribing will fetch and keep data cached for fast sub-route navigation
  useOrganization()

  // no UI
  return null
}


