import Demos from "@/components/demos";
import Feedbacks from "@/components/feedbacks";
import Galleria from "@/components/galleria";
import Hero from "@/components/hero";
import Heroes from "@/components/heroes";
import Preview from "@/components/preview";
import StartTrial from "@/components/start-trial";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";

export default async function Home() {
  return (
    <div className="w-full">
      <Hero />
      <Galleria />
      <Demos />
      <StartTrial />
      <Feedbacks />
      <Preview />
      <Heroes />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Next steps</h2>
        {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
      </main>
    </div>
  );
}
