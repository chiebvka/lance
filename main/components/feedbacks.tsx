"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Twitter, MessageCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  // CardHeader, // Not used directly to allow image at the very top if present
} from "@/components/ui/card"; // Assuming this is your path to ShadCN Card components

interface Testimonial {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  socialPlatform?: 'twitter' | 'other';
  text: React.ReactNode;
  imageUrl?: string;
}

// Text components for cleaner data structure
// const MyFirstEver = () => <>My first ever IM view video. This has been a <span className="font-semibold text-yellow-500">monumental boost for [my app]</span> ScoutR.</>;
// const LiterallyNoEasier = () => <>Literally no easier way to interface would multi-account posting, and for 10x cheaper. every creator should be <span className="font-semibold text-yellow-500">using this</span></>;
// const PostBridgeBest = () => <>Post-bridge is <span className="font-semibold text-yellow-500">the best investment I made in months</span>. It's simple and works, exactly what I was searching to handle multiple channels. So good to invest in products from the community 💙 Thanks so much for this product bro!</>;
// const IHateHow = () => <>I hate how every social media has a different scheduling and post management provider, thankfully post bridge solves that and I love the experience so far, <span className="font-semibold text-yellow-500">it just works</span>.</>;
// const IWantedToSay = () => <>I wanted to say thank you for creating post-bridge. Your content studio has <span className="font-semibold text-yellow-500">saved me WEEKS of time</span> in literally less than a couple hours. This software is goated brotha.</>;
// const FirstPostsMade = () => <>First posts made on YT and TT with post bridge [to advertise my product]. So happy I finally took the first step to prioritizing marketing daily. Jack built <span className="font-semibold text-yellow-500">an amazing app</span> here.</>;
// const TheContentStudio = () => <>[the content studio] has slowly been bringing in customers tho and i appreciate you so much for that 🙏 <span className="font-semibold text-yellow-500">+ saves me soooo much time</span>. can spend days just building new sh!t cause all the marketing on autopilot. Love it</>;
// const GameChangerText = () => <>This is a <span className="font-semibold text-green-500">total game-changer</span> for content scheduling. I can plan weeks ahead in minutes!</>;
const MyFirstEver = () => <>My first invoice generated and sent in under 5 minutes. This has been a <span className="font-semibold text-yellow-500">monumental boost for my freelance business</span> - finally feels professional!</>;

const LiterallyNoEasier = () => <>Literally no easier way to manage client projects and invoicing in one place. Everything flows seamlessly and <span className="font-semibold text-yellow-500">saves me hours every week</span></>;

const PostBridgeBest = () => <>This platform is <span className="font-semibold text-yellow-500">the best investment I made this year</span>. It's intuitive and powerful, exactly what I needed to organize my business operations. So glad I found this gem! 💙</>;

const IHateHow = () => <>I hate how I used to juggle 5 different tools for invoicing, projects, and client communication. This platform solves everything and <span className="font-semibold text-yellow-500">it just works perfectly</span>.</>;

const IWantedToSay = () => <>I wanted to say thank you for creating this business platform. Your service agreement feature has <span className="font-semibold text-yellow-500">saved me countless hours</span> and made me look so much more professional to clients.</>;

const FirstPostsMade = () => <>First digital service agreement sent through the platform and client signed it immediately! The whole process was seamless. You've built <span className="font-semibold text-yellow-500">something truly amazing</span> here.</>;

const TheContentStudio = () => <>The project tracking has been bringing in repeat clients because of how organized everything looks 🙏 <span className="font-semibold text-yellow-500">+ saves me so much admin time</span>. Can focus on actual work instead of paperwork now!</>;

const GameChangerText = () => <>This is a <span className="font-semibold text-green-500">total game-changer</span> for freelance business management. I can handle 3x more clients without the stress!</>;

const SupportIsFantastic = () => <>The support team is fantastic and always responsive. <span className="font-semibold text-blue-500">Love the personal touch!</span></>;
const MakingContentFun = () => <>Making content creation fun again! No more spreadsheet nightmares. <span className="font-semibold text-pink-500">Thank you Post Bridge!</span></>;

const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Bexoni',
    handle: '@bexonilabs',
    avatarUrl: 'https://www.bexoni.com/favicon.ico',
    socialPlatform: 'other',
    text: <MyFirstEver />,
    // imageUrl: 'https://www.bexoni.com/favicon.ico',
  },
  {
    id: '2',
    name: 'Ndi Enugu Scottland ',
    handle: '@ndi_enugu_scottland',
    avatarUrl: 'https://www.ndienuguscotland.org/favicon.ico',
    socialPlatform: 'other',
    text: <LiterallyNoEasier />,
  },
  {
    id: '3',
    name: 'Foreversake',
    handle: '@foreversake',
    avatarUrl: 'https://www.foreversake.com/favicon.ico',
    socialPlatform: 'twitter',
    text: <PostBridgeBest />,
  },
  {
    id: '4',
    name: 'Unitellas',
    handle: '@unitellasintl',
    avatarUrl: 'https://www.unitellas.com/favicon.ico',
    socialPlatform: 'twitter',
    text: <IHateHow />,
  },
  {
    id: '5',
    name: 'Bobby',
    handle: '@bobbyamali',
    avatarUrl: 'https://www.bobbyamali.com/logo.svg',
    socialPlatform: 'twitter',
    text: <IWantedToSay />,
  },
  {
    id: '6',
    name: 'Marachic',
    handle: '@marachic__',
    avatarUrl: 'https://www.marachic.com/favicon.ico',
    socialPlatform: 'other',
    text: <SupportIsFantastic />,
  },
  {
    id: '7',
    name: 'Deluccis',
    handle: '@_deluccis',
    avatarUrl: 'https://www.deluccis.com/favicon.ico',
    socialPlatform: 'other',
    text: <FirstPostsMade />,
    // imageUrl: 'https://via.placeholder.com/300x400/E0E0E0/808080?text=Thumbs+Up',
  },
  {
    id: '8',
    name: 'Lancefortes',
    handle: '@lancefortes',
    avatarUrl: 'https://www.lancefortes.com/favicon.ico',
    socialPlatform: 'other',
    text: <TheContentStudio />,
    // imageUrl: 'https://via.placeholder.com/300x150/E0E0E0/808080?text=Analytics',
  },
  {
    id: '9',
    name: 'Bolabmh',
    handle: '@bolabmh',
    avatarUrl: 'https://bolabmh.vercel.app/favicon.ico',
    socialPlatform: 'other',
    text: "This app changed my workflow completely! Highly recommend.",
  },
  {
    id: '10',
    name: 'The Beat boulevard',
    handle: '@thebeatboulevard',
    avatarUrl: 'https://thebeatboulevard.vercel.app/favicon.ico',
    text: "Absolutely essential for anyone managing multiple social accounts. A true time saver.",
    // imageUrl: 'https://via.placeholder.com/300x250/D3D3D3/FFFFFF?text=Calendar+View',
  },
  {
    id: '11',
    name: 'The Ivy Mark',
    handle: '@theivymark',
    avatarUrl: 'https://www.theivymark.com/favicon.ico',
    socialPlatform: 'other',
    text: <GameChangerText />,
  },

];

const FeedbackCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const SocialIcon = testimonial.socialPlatform === 'twitter' ? Twitter : MessageCircle;
  return (
    <Card className="mb-6 flex flex-col shadow-lg">
      {testimonial.imageUrl && (
        <img 
          src={testimonial.imageUrl} 
          alt={`Image for ${testimonial.name}'s testimonial`} 
          className="w-full h-auto rounded-t-lg object-cover max-h-60 md:max-h-80"
        />
      )}
      <CardContent className={`flex-grow pt-5 ${!testimonial.imageUrl ? 'rounded-t-lg' : ''}`}>
        <p className="text-sm md:text-base leading-relaxed mb-4">{testimonial.text}</p>
      </CardContent>
      <CardFooter className="pt-4 pb-5 px-5 border-t">
        <img 
          src={testimonial.avatarUrl} 
          alt={testimonial.name} 
          className="w-10 h-10 md:w-11 md:h-11 rounded-none mr-3 border-2 border-primary"
        />
        <div className="flex-grow">
          <p className="font-semibold text-sm md:text-md">{testimonial.name}</p>
          <p className="text-xs md:text-sm text-muted-foreground">{testimonial.handle}</p>
        </div>
        {testimonial.socialPlatform && (
          <SocialIcon className="w-5 h-5 text-blue-400" />
        )}
      </CardFooter>
    </Card>
  );
};

const ScrollingColumn = ({ 
  testimonials, 
  direction = 'down', 
  isPaused, 
  speed = 0.3 
}: { 
  testimonials: Testimonial[]; 
  direction?: 'up' | 'down'; 
  isPaused: boolean;
  speed?: number;
}) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const animationFrameId = useRef<number | null>(null);

  // Effect for initial positioning
  useEffect(() => {
    if (direction === 'down') {
      // Debounce or wait for actual height if content loads dynamically causing scrollHeight to be 0 initially
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const initialContentHeight = contentRef.current.scrollHeight / 2;
          if (initialContentHeight > 0) {
            setTranslateY(-initialContentHeight);
          }
        }
      }, 50); // Small delay to allow content to render and calculate height
      return () => clearTimeout(timer);
    } else {
      setTranslateY(0); // For 'up' direction, start at 0
    }
  }, [direction]); // Only run on mount and when direction changes

  // Effect for the animation loop
  useEffect(() => {
    const animate = () => {
      if (!isPaused && contentRef.current) {
        setTranslateY(prevY => {
          const contentHeight = contentRef.current!.scrollHeight / 2;
          if (contentHeight === 0) return prevY; 

          let newY = direction === 'down' ? prevY + speed : prevY - speed;

          if (direction === 'down' && newY >= 0) {
            newY = -contentHeight;
          } else if (direction === 'up' && newY <= -contentHeight) {
            newY = 0;
          }
          return newY;
        });
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPaused, direction, speed]); // Re-setup loop if these change

  return (
    <div ref={columnRef} className="h-[800px] overflow-hidden relative w-full">
      <div 
        ref={contentRef} 
        className="absolute top-0 left-0 w-full" 
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {[...testimonials, ...testimonials].map((testimonial, index) => (
          // Using testimonial.id and index for a more unique key in case of identical testimonials in a list
          <FeedbackCard key={`${testimonial.id}-${index}-scroll`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
};

export default function Feedbacks() {
  const [isHoveringSection, setIsHoveringSection] = useState(false);
  const numColumns = 3;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint is 768px
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const columns = Array.from({ length: numColumns }, (_, i) =>
    testimonialsData.filter((_, index) => index % numColumns === i)
  );

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-lg md:text-3xl lg:text-4xl font-bold ">
            7000+ users growing on all platforms
          </h2>
          <p className="mt-3 text-xs md:text-sm lg:text-base  max-w-xl mx-auto">
            Posting and scheduling their social content using Post bridge
          </p>
        </div>

        {isMobile ? (
          <div className="space-y-6">
            {testimonialsData.map((testimonial) => (
              <FeedbackCard key={testimonial.id + '-mobile'} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <div 
            className="flex flex-row gap-6"
            onMouseEnter={() => setIsHoveringSection(true)}
            onMouseLeave={() => setIsHoveringSection(false)}
          >
            {columns.map((columnTestimonials, columnIndex) => (
              <div key={columnIndex} className="flex-1 min-w-0">
                <ScrollingColumn 
                  testimonials={columnTestimonials} 
                  direction={columnIndex % 2 === 0 ? 'down' : 'up'}
                  isPaused={isHoveringSection}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}