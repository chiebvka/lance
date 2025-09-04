import React from 'react'
import { Clock, DollarSign, Grid3X3, Brain, CheckCircle, X, ArrowRight } from 'lucide-react'

type Props = {}

export default function Comparison({}: Props) {
  const problems = [
    {
      icon: Clock,
      title: "Time consuming",
      description: "Hours of time you can't get back - spent bouncing between platforms to use one feature to help your operations"
    },
    {
      icon: DollarSign,
      title: "Unfairly expensive",
      description: "You're not an enterprise, or a Fortune 500 company, so why are you paying as much as one?"
    },
    {
      icon: Grid3X3,
      title: "Features you don't need",
      description: "99 features and you only need one... but you'll have to pay for all of them."
    },
    {
      icon: Brain,
      title: "Complex tools",
      description: "The learning curve for said software taking up much time and looking like rocket science"
    }
  ]

  const solutions = [
    {
      feature: "All-in-one platform",
      others: "Multiple separate tools",
      icon: CheckCircle
    },
    {
      feature: "Affordable pricing",
      others: "Enterprise-level costs",
      icon: CheckCircle
    },
    {
      feature: "Simple & intuitive",
      others: "Complex interfaces",
      icon: CheckCircle
    },
    {
      feature: "Built for freelancers",
      others: "Built for enterprises",
      icon: CheckCircle
    }
  ]

  return (
    <section className='py-12 md:py-20 bg-base-100'>
      <div className='container mx-auto px-4'>
        {/* Problem Section */}
        <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-6 text-center ">
            Running your business operations shouldn't be this <span className="text-primary">hard</span>
          </h1>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Why should you have to choose between forking out too much cash and too many hours of your time? Well Bexforte is here to help.
          </p>
          
          {/* Problem Cards */}
        </div>
          <div className="w-full space-y-8">
            <div className="mt-16 grid border divide-x divide-y rounded-xl gap-2 overflow-hidden sm:grid-cols-2 lg:divide-y-0 lg:grid-cols-3 xl:grid-cols-4">
                {problems.map((problem, index) => (
                <div key={index} className="bg-lightCard dark:bg-darkCard p-6 rounded-none border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <problem.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-primary">{problem.title}</h3>
                        <p className="text-muted-foreground text-sm">{problem.description}</p>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            
            {/* <p className="text-lg font-medium text-muted-foreground">
                Give up hours of your time or buckets of your cash? You shouldn't have to choose.
            </p> */}
          </div>

        {/* Solution Section */}
        {/* <div className="text-center">
          <h2 className="text-lg md:text-2xl lg:text-3xl font-bold mb-6">
            Why choose <span className="text-bexoni">Lancefortes</span>?
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-12 max-w-2xl mx-auto">
            From initial inquiry to lasting relationships - manage invoicing, tracking, agreements, and continuous client engagement for freelancers, entrepreneurs, and small businesses.
          </p>


          <div className="max-w-4xl mx-auto">
            <div className="bg-lightCard dark:bg-darkCard rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
       
                <div className="p-6 bg-muted/20 border-b border-r border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-primary">Features</h3>
                </div>
                <div className="p-6 bg-muted/20 border-b border-r border-gray-200 dark:border-gray-700 text-center">
                  <h3 className="font-semibold text-bexoni">Lancefortes</h3>
                </div>
                <div className="p-6 bg-muted/20 border-b border-gray-200 dark:border-gray-700 text-center">
                  <h3 className="font-semibold text-muted-foreground">Other Tools</h3>
                </div>

       
                {solutions.map((solution, index) => (
                  <React.Fragment key={index}>
                    <div className="p-6 border-b border-r border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-primary">{solution.feature}</p>
                    </div>
                    <div className="p-6 border-b border-r border-gray-200 dark:border-gray-700 text-center">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 text-center">
                      <div className="flex items-center justify-center">
                        <X className="w-6 h-6 text-red-500" />
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

     
          <div className="mt-12">
            <button className="inline-flex items-center px-8 py-3 bg-bexoni text-white rounded-lg hover:bg-bexoni/90 transition-colors font-medium">
              Try it for free
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Start in seconds
            </p>
          </div>
        </div> */}
      </div>
    </section>
  )
}