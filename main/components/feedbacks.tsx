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
const MyFirstEver = () => <>My first ever IM view video. This has been a <span className="font-semibold text-yellow-500">monumental boost for [my app]</span> ScoutR.</>;
const LiterallyNoEasier = () => <>Literally no easier way to interface would multi-account posting, and for 10x cheaper. every creator should be <span className="font-semibold text-yellow-500">using this</span></>;
const PostBridgeBest = () => <>Post-bridge is <span className="font-semibold text-yellow-500">the best investment I made in months</span>. It's simple and works, exactly what I was searching to handle multiple channels. So good to invest in products from the community 💙 Thanks so much for this product bro!</>;
const IHateHow = () => <>I hate how every social media has a different scheduling and post management provider, thankfully post bridge solves that and I love the experience so far, <span className="font-semibold text-yellow-500">it just works</span>.</>;
const IWantedToSay = () => <>I wanted to say thank you for creating post-bridge. Your content studio has <span className="font-semibold text-yellow-500">saved me WEEKS of time</span> in literally less than a couple hours. This software is goated brotha.</>;
const FirstPostsMade = () => <>First posts made on YT and TT with post bridge [to advertise my product]. So happy I finally took the first step to prioritizing marketing daily. Jack built <span className="font-semibold text-yellow-500">an amazing app</span> here.</>;
const TheContentStudio = () => <>[the content studio] has slowly been bringing in customers tho and i appreciate you so much for that 🙏 <span className="font-semibold text-yellow-500">+ saves me soooo much time</span>. can spend days just building new sh!t cause all the marketing on autopilot. Love it</>;
const GameChangerText = () => <>This is a <span className="font-semibold text-green-500">total game-changer</span> for content scheduling. I can plan weeks ahead in minutes!</>;
const SupportIsFantastic = () => <>The support team is fantastic and always responsive. <span className="font-semibold text-blue-500">Love the personal touch!</span></>;
const MakingContentFun = () => <>Making content creation fun again! No more spreadsheet nightmares. <span className="font-semibold text-pink-500">Thank you Post Bridge!</span></>;

const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Ollie Warren',
    handle: '@ollie_warren99',
    avatarUrl: 'https://via.placeholder.com/40/FFA07A/FFFFFF?text=OW',
    socialPlatform: 'twitter',
    text: <MyFirstEver />,
    imageUrl: 'https://via.placeholder.com/300x200/E0E0E0/808080?text=Record+Games',
  },
  {
    id: '2',
    name: 'Noah Solomon',
    handle: '@noah_solomon1',
    avatarUrl: 'https://via.placeholder.com/40/ADD8E6/FFFFFF?text=NS',
    socialPlatform: 'other',
    text: <LiterallyNoEasier />,
  },
  {
    id: '3',
    name: 'Fer',
    handle: '@fer_chws',
    avatarUrl: 'https://via.placeholder.com/40/90EE90/FFFFFF?text=F',
    socialPlatform: 'twitter',
    text: <PostBridgeBest />,
  },
  {
    id: '4',
    name: 'Ryan Vogel',
    handle: '@ryandavogel',
    avatarUrl: 'https://via.placeholder.com/40/FFC0CB/FFFFFF?text=RV',
    socialPlatform: 'twitter',
    text: <IHateHow />,
  },
  {
    id: '5',
    name: 'Dominick',
    handle: '@dominickbdiaz',
    avatarUrl: 'https://via.placeholder.com/40/D3D3D3/FFFFFF?text=D',
    socialPlatform: 'twitter',
    text: <IWantedToSay />,
  },
  {
    id: '6',
    name: 'David',
    handle: '@ninthdensity',
    avatarUrl: 'https://via.placeholder.com/40/B0E0E6/FFFFFF?text=D',
    socialPlatform: 'twitter',
    text: "Finally, social media posting tool for the rest of us. Thanks Jack!",
  },
  {
    id: '7',
    name: 'Max Blade',
    handle: '@_MaxBlade',
    avatarUrl: 'https://via.placeholder.com/40/FFB6C1/FFFFFF?text=MB',
    socialPlatform: 'twitter',
    text: <FirstPostsMade />,
    imageUrl: 'https://via.placeholder.com/300x400/E0E0E0/808080?text=Thumbs+Up',
  },
  {
    id: '8',
    name: 'Patty',
    handle: '@pattybuilds',
    avatarUrl: 'https://via.placeholder.com/40/E6E6FA/FFFFFF?text=P',
    socialPlatform: 'twitter',
    text: <TheContentStudio />,
    imageUrl: 'https://via.placeholder.com/300x150/E0E0E0/808080?text=Analytics',
  },
  {
    id: '9',
    name: 'Sarah Miller',
    handle: '@sarahm',
    avatarUrl: 'https://via.placeholder.com/40/F0E68C/FFFFFF?text=SM',
    socialPlatform: 'twitter',
    text: "This app changed my workflow completely! Highly recommend.",
  },
  {
    id: '10',
    name: 'James Brown',
    handle: '@jamesb',
    avatarUrl: 'https://via.placeholder.com/40/D2B48C/FFFFFF?text=JB',
    text: "Absolutely essential for anyone managing multiple social accounts. A true time saver.",
    imageUrl: 'https://via.placeholder.com/300x250/D3D3D3/FFFFFF?text=Calendar+View',
  },
  {
    id: '11',
    name: 'Linda Green',
    handle: '@lindag',
    avatarUrl: 'https://via.placeholder.com/40/98FB98/FFFFFF?text=LG',
    socialPlatform: 'other',
    text: <GameChangerText />,
  },
  {
    id: '12',
    name: 'Kevin White',
    handle: '@kevinw',
    avatarUrl: 'https://via.placeholder.com/40/E0FFFF/000000?text=KW',
    socialPlatform: 'twitter',
    text: "The scheduling feature is top-notch. My engagement has skyrocketed.",
  },
  {
    id: '13',
    name: 'Jessica Blue',
    handle: '@jessicab',
    avatarUrl: 'https://via.placeholder.com/40/AFEEEE/FFFFFF?text=JB',
    text: "If you are a content creator, you NEED this. So intuitive and powerful.",
  },
  {
    id: '14',
    name: 'Michael Black',
    handle: '@michaelb',
    avatarUrl: 'https://via.placeholder.com/40/A9A9A9/FFFFFF?text=MB',
    socialPlatform: 'twitter',
    text: <SupportIsFantastic />,
    imageUrl: 'https://via.placeholder.com/300x180/C0C0C0/FFFFFF?text=Team+Chat',
  },
  {
    id: '15',
    name: 'Emily Purple',
    handle: '@emilyp',
    avatarUrl: 'https://via.placeholder.com/40/E6E6FA/000000?text=EP',
    text: "Used many tools before, but this one stands out for its simplicity and effectiveness.",
  },
  {
    id: '16',
    name: 'Daniel Yellow',
    handle: '@daniely',
    avatarUrl: 'https://via.placeholder.com/40/FFFFE0/000000?text=DY',
    socialPlatform: 'other',
    text: "The analytics provided are super helpful for my strategy. Worth every penny!",
  },
  {
    id: '17',
    name: 'Olivia Red',
    handle: '@oliviar',
    avatarUrl: 'https://via.placeholder.com/40/FF7F7F/FFFFFF?text=OR',
    socialPlatform: 'twitter',
    text: <MakingContentFun />,
  },
  {
    id: '18',
    name: 'William Orange',
    handle: '@williamo',
    avatarUrl: 'https://via.placeholder.com/40/FFA500/FFFFFF?text=WO',
    text: "A must-have for marketing agencies. Manages all our client accounts seamlessly.",
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
          className="w-10 h-10 md:w-11 md:h-11 rounded-full mr-3 border-2 border-gray-200"
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