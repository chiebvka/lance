"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currency";

interface CreateTeamFormProps {
  user: any;
}

export function CreateTeamForm({ user }: CreateTeamFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    baseCurrency: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from("organization")
        .insert({
          name: formData.name,
          country: formData.country,
          baseCurrency: formData.baseCurrency,
          createdBy: user.id,
          subscriptionStatus: "trial",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          planType: "starter",
          billingCycle: "monthly",
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user profile with organizationId
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organizationId: organization.id })
        .eq("profile_id", user.id);

      if (profileError) throw profileError;

      // Redirect to dashboard
      router.push("/");
      router.refresh();

    } catch (error) {
      console.error("Error creating team:", error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Add your logo, company name, country and currency. We'll use this to personalize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company name</Label>
            <Input
              id="name"
              placeholder="Ex: Acme Marketing or Acme Co"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Base currency</Label>
            <Select
              value={formData.baseCurrency}
              onValueChange={(value) => setFormData({ ...formData, baseCurrency: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            If you have multiple accounts in different currencies, this will be the default currency for your company. You can change it later.
          </p>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 