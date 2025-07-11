"use client"

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'

interface LogoProps {
  height?: number;
  width?: number;
}

const LogoComponent = ({ height = 60, width = 80 }: LogoProps) => {
  const { resolvedTheme } = useTheme()
  
  const logoSrc = resolvedTheme === 'dark' ? '/lance.ico' : '/lance.ico'

  return (
    <Link href="/">
      <Image 
        height={height}
        width={width}
        alt='logo'
        src={logoSrc}
        className="object-contain"
      />
    </Link>
  )
}

// Export as dynamic component with SSR disabled
export default dynamic(() => Promise.resolve(LogoComponent), {
  ssr: false
})