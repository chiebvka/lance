import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "./_components/create-team-form";

export default async function CreateTeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Check if user already has an organization
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("profile_id, organizationId")
    .eq("profile_id", user?.id)
    .single();

  // If user already has an organization, redirect to dashboard
  // if (userProfile?.organizationId) {
  //   return redirect("/");
  // }

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