import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { ChartAreaInteractive } from "../_components/chart-area-interactive";
import { OverviewCarousel } from "../_components/overview-carousel";
import { getAuthenticatedUser } from "@/utils/auth";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return (
    <div className="border w-full p-4 mx-auto border-bexoni">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
        <ChartAreaInteractive />
      </div>
      <OverviewCarousel />
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
