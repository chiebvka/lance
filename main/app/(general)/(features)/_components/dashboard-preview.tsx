"use client"

import dynamic from 'next/dynamic'
import Image from "next/image"
import { useTheme } from 'next-themes'

interface DashboardPreviewProps {
  lightModeImage: string
  darkModeImage: string
  altText: string
  showThemeToggle?: boolean
}

const DashboardPreviewComponent = ({ 
  lightModeImage, 
  darkModeImage, 
  altText, 
  showThemeToggle = true 
}: DashboardPreviewProps) => {
  const { resolvedTheme } = useTheme()
  
  const imageSrc = showThemeToggle && resolvedTheme === 'dark' ? darkModeImage : lightModeImage
  const shadowStyle = `shadow-[8px_8px_0px_0px_hsla(267,95.2%,63.3%,1),0_0_20px_hsla(267,95.2%,63.3%,0.15)]`; 
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className=" rounded-none  shadow-2xl">
        <div className={`relative w-full  h-[250px] md:h-[500px] lg:h-[550px] rounded-none overflow-hidden ${shadowStyle}`}>
            {/* Image with purple overlay */}
            <div className="absolute inset-0">
              <Image
                src={imageSrc}
                alt={altText}
                fill
                className="object-cover rounded-none shadow-lg"
              />
              {/* Purple overlay */}
              <div className="absolute inset-0 bg-purple-500/20"></div>
            </div>
        </div>
      </div>
    </div>
  )
}

// Export as dynamic component with SSR disabled
export const DashboardPreview = dynamic(() => Promise.resolve(DashboardPreviewComponent), {
  ssr: false
})
