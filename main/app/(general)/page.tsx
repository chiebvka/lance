import Demos from "@/components/demos";
import Feedbacks from "@/components/feedbacks";
import Galleria from "@/components/galleria";
import Hero from "@/components/hero";
import Heroes from "@/components/heroes";
import Preview from "@/components/preview";
import StartTrial from "@/components/start-trial";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import FaqAccordian from "@/components/faqs/faq-accordian";
import { homeFaqs } from "@/data/faqs";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";

export default async function Home() {
  
  return (
    <div className="w-full">
      <Hero />
      <Galleria />
      <Demos />
      {/* <StartTrial /> */}
      <Feedbacks />
      <Preview />
      
      {/* FAQ Section */}
      <section className="py-16 px-4" id="faqs">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about Bexforte
            </p>
          </div>
          <FaqAccordian faqs={homeFaqs} />
        </div>
      </section>

      {/* <Heroes /> */}
      {/* <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Next steps</h2>
        {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
      </main> */}
    </div>
  );
}
