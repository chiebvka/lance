import React from "react"
import { Button } from "@/components/ui/button"
// import { Header } from "./header"
import Link from "next/link"

interface FeatureHeroProps {
  title: string
  description: string
  buttonText: string
  buttonHref: string
  showBackground?: boolean
}

export function FeatureHero({ 
  title, 
  description, 
  buttonText, 
  buttonHref, 
  showBackground = true 
}: FeatureHeroProps) {
  return (
    <section
      className="w-full pb-12 md:pb-20 lg:pb-24 relative overflow-hidden"
    >
      <div className="container flex flex-col items-center text-center relative mx-auto">
        {/* Header positioned at top of hero container */}
        {/* <div className="absolute top-0 left-0 right-0 z-20">
          <Header />
        </div> */}

        <div className="relative z-10 space-y-4 md:space-y-5 lg:space-y-6 mb-8 md:mb-10 lg:mb-12 max-w-lg md:max-w-2xl lg:max-w-3xl mt-4 md:mt-8 lg:mt-12 px-4">
          <h1 className="text-foreground text-lg md:text-3xl lg:text-4xl font-semibold leading-tight">
            {title}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base font-medium leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="relative z-10 mb-8 md:mb-12 lg:mb-16">
          <Button asChild className="relative z-50 pointer-events-auto">
              <Link href={buttonHref}>
                  {buttonText}
              </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
