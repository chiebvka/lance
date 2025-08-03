"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countries, currencies, getUserLocationAndCurrency, getCurrencyByCode, getCountryByCode, type Country, type Currency } from "@/data/country-currency";
import ComboBox from "@/components/combobox";
import axios from "axios";
import { Bubbles } from "lucide-react";

interface CreateTeamFormProps {
  user: any;
}

export function CreateTeamForm({ user }: CreateTeamFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    baseCurrency: "",
  });

  // Auto-detect user location and currency on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const { country, currency } = await getUserLocationAndCurrency();
        if (country && currency) {
          setFormData(prev => ({
            ...prev,
            country: country.name,
            baseCurrency: currency.code,
          }));
        }
      } catch (error) {
        console.error("Error detecting location:", error);
      } finally {
        setLocationLoading(false);
      }
    };

    detectLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/organization/create", {
        name: formData.name,
        country: formData.country,
        baseCurrency: formData.baseCurrency,
      });

      if (response.data.success) {
        // Redirect to dashboard
        router.push("/protected");
        router.refresh();
      } else {
        throw new Error(response.data.error || "Failed to create organization");
      }

    } catch (error: any) {
      console.error("Error creating team:", error);
      // TODO: Show toast notification with error
      alert(error.response?.data?.error || error.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for comboboxes
  const countryItems = countries.map((country: Country) => ({
    value: country.code,
    label: country.name,
    searchValue: country.name,
  }));

  const currencyItems = currencies.map((currency: Currency) => ({
    value: currency.code,
    label: currency.label,
    searchValue: `${currency.code} ${currency.name}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Add your company name, country and currency. We'll use this to personalize your experience.
          {locationLoading && " (Auto-detecting your location...)"}
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
            <ComboBox
              items={countryItems}
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value || "" })}
              placeholder="Select a country"
              searchPlaceholder="Search countries..."
              emptyMessage="No countries found."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Base currency</Label>
            <ComboBox
              items={currencyItems}
              value={formData.baseCurrency}
              onValueChange={(value) => setFormData({ ...formData, baseCurrency: value || "" })}
              placeholder="Select a currency"
              searchPlaceholder="Search currencies..."
              emptyMessage="No currencies found."
            />
          </div>

          <p className="text-sm text-muted-foreground">
            If you have multiple accounts in different currencies, this will be the default currency for your company. You can change it later.
          </p>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || locationLoading || !formData.name || !formData.country || !formData.baseCurrency}
          >
            {loading ? (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Creating...
              </>
            ) :( "Create Team")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 