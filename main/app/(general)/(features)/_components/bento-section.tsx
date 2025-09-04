
"use client"

import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'

const BentoCardComponent = ({ title, description, lightModeImage, darkModeImage, altText }: { 
  title: string, 
  description: string, 
  lightModeImage: string, 
  darkModeImage: string, 
  altText: string 
}) => {
  const { resolvedTheme } = useTheme();
  const imageUrl = resolvedTheme === 'dark' ? darkModeImage : lightModeImage;

  return (
  <div className="overflow-hidden rounded-none border border-white/20 bg-lightCard dark:bg-darkCard flex flex-col justify-start items-start relative h-full">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-none"
      style={{
        background: "rgba(231, 236, 235, 0.08)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-none" />

    <div className="self-stretch p-4 md:p-6 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <p className="self-stretch text-primary text-base md:text-lg font-normal leading-6 md:leading-7">
          {title} <br />
          <span className="text-muted-foreground text-xs md:text-sm lg:text-base">{description}</span>
        </p>
      </div>
    </div>
    <div className="self-stretch h-48 md:h-72 relative -mt-0.5 z-10 overflow-hidden">
      {/* Image with purple overlay */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={imageUrl} 
          alt={altText}
          className="w-full h-full object-cover object-center"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            width: '100%',
            height: '100%'
          }}
        />
        {/* Purple overlay */}
        <div className="absolute inset-0 bg-purple-500/20"></div>
      </div>
    </div>
  </div>
  )
}

// Export as dynamic component with SSR disabled
const BentoCard = dynamic(() => Promise.resolve(BentoCardComponent), {
  ssr: false
})

interface BentoSectionProps {
  title: string
  description: string
  cards: Array<{
    title: string
    description: string
    lightModeImage: string
    darkModeImage: string
    altText: string
  }>
}

export function BentoSection({ title, description, cards }: BentoSectionProps) {

  return (
    <section className="w-full px-4 md:px-6 lg:px-8 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full max-w-7xl mx-auto py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        <div className="hidden md:block w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4 px-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-lg md:text-3xl lg:text-4xl font-semibold leading-tight md:leading-[66px]">
              {title}
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-xs md:text-sm lg:text-base  font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 z-10">
          {cards.map((card) => (
            <BentoCard 
              key={card.title} 
              title={card.title}
              description={card.description}
              lightModeImage={card.lightModeImage}
              darkModeImage={card.darkModeImage}
              altText={card.altText}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
