import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "./_components/create-team-form";
import { userHasOrganization } from "@/utils/user-profile";
import { getAuthenticatedUser } from "@/utils/auth";

export default async function CreateTeamPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  // Check if user already has an organization
  const hasOrganization = await userHasOrganization(supabase, user.id);

  // If user already has an organization, redirect to dashboard
  if (hasOrganization) {
    return redirect("/protected");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Your Team</h1>
          <p className="text-muted-foreground mt-2">
            Set up your organization to get started with Lance
          </p>
        </div>
        
        <CreateTeamForm user={user} />
      </div>
    </div>
  );
}