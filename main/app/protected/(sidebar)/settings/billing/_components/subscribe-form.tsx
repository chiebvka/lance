"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Bubbles, CheckCircle2, Loader2 } from "lucide-react";
import { useFilteredPricing } from "@/hooks/use-pricing";
import { getPriceForCycle, formatPrice, type StripeProduct } from "@/lib/pricing";
import { planFeatures } from "@/data/plans";
import { format, parseISO } from "date-fns";
import axios from "axios";
import PaymentHistoryTable from "./payment-history-table";

interface SubscribeFormProps {
  user: any;
  userOrganization: any;
  hasActiveSubscription: boolean;
}



export default function SubscribeForm({ user, userOrganization, hasActiveSubscription }: SubscribeFormProps) {

    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const { 
    products, 
    isLoading, 
    isError, 
    error 
  } = useFilteredPricing();

  const handleSubscribe = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      if (!user) {
        // Redirect to sign up page if user is not authenticated
        window.location.href = "/signup";
        return;
      }

      // For existing subscriptions (including manage subscription button), redirect to billing portal
      if (hasActiveSubscription || priceId === "") {
        const response = await axios.post("/api/create-checkout-session", {
          priceId: "portal", // Special flag to indicate billing portal
          organizationId: userOrganization?.id,
          userId: user.id,
        });

        if (response.data.url) {
          window.location.href = response.data.url;
        }
        return;
      }

      // Create checkout session for new subscription
      const response = await axios.post("/api/create-checkout-session", {
        priceId,
        organizationId: userOrganization?.id,
        userId: user.id,
      });

      if (response.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
      
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      alert(error.response?.data?.error || error.message || "Failed to create subscription");
    } finally {
      setLoadingPriceId(null);
    }
  };

  // Get features for a plan based on its name
  const getPlanFeatures = (planName: string): string[] => {
    const name = planName.toLowerCase();
    if (name.includes("essential")) {
      return planFeatures.essential;
    } else if (name.includes("creator")) {
      return planFeatures.creator;
    } else if (name.includes("studio")) {
      return planFeatures.studio;
    }
    // Default to essential if no match
    return planFeatures.essential;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading pricing...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Pricing</h2>
          <p className="text-gray-600 mb-4">
            {error?.message || "Failed to load pricing information"}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show subscription management for active users
  if (hasActiveSubscription) {
    return (
      <div className="w-full ">
        <div className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-lg font-semibold">{userOrganization?.planType || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={`ml-2 ${
                    userOrganization?.subscriptionstatus === 'active' 
                      ? 'bg-green-500' 
                      : userOrganization?.subscriptionstatus === 'trial'
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}>
                    {userOrganization?.subscriptionstatus === 'trial' 
                      ? `Trial - ${userOrganization?.trialEndsAt ? format(parseISO(userOrganization.trialEndsAt), 'MMMM d') : 'Unknown'}`
                      : userOrganization?.subscriptionstatus === 'active'
                      ? `Subscribed - ${userOrganization?.subscriptionEndDate ? format(parseISO(userOrganization.subscriptionEndDate), 'MMMM d') : 'Active'}`
                      : userOrganization?.subscriptionstatus}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Billing Cycle</Label>
                  <p className="text-sm">{userOrganization?.billingCycle || 'Unknown'}</p>
                </div>
                {userOrganization?.trialEndsAt && userOrganization?.subscriptionstatus === 'trial' && (
                  <div>
                    <Label className="text-sm font-medium">Trial Ends</Label>
                    <p className="text-sm">
                      {format(parseISO(userOrganization.trialEndsAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
                {userOrganization?.subscriptionEndDate && userOrganization?.subscriptionstatus === 'active' && (
                  <div>
                    <Label className="text-sm font-medium">Next Billing Date</Label>
                    <p className="text-sm font-semibold text-primary">
                      {format(parseISO(userOrganization.subscriptionEndDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  // Redirect to Stripe billing portal for subscription management
                  handleSubscribe("");
                }}>
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Payment History</h3>
            <PaymentHistoryTable />
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no products
  if (!products || products.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Plans Available</h2>
          <p className="text-gray-600">
            Pricing plans are currently being updated. Please check back soon.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full max-w-5xl mx-auto px-4">
        {/* Trial User Banner */}
        {userOrganization?.subscriptionstatus === 'trial' && (
          <div className="mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-blue-800 font-medium">
                    You're currently on a free trial that ends {userOrganization?.trialEndsAt ? format(parseISO(userOrganization.trialEndsAt), 'MMMM d, yyyy') : 'soon'}.
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    Subscribe now to continue using Lance after your trial ends.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4 bg-gray-100 rounded-lg p-1">
            <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            >
            Monthly
            </button>
            <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            >
            Yearly
            <Badge className="absolute -top-2 -right-2 text-xs bg-green-500 text-white">
                Save 17%
            </Badge>
            </button>
        </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
            {products
              .sort((a, b) => {
                // Sort to ensure: Essential (left), Creator (middle), Studio (right)
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                
                // Define order: essential, creator, studio
                const getOrder = (name: string) => {
                  if (name.includes('essential')) return 1;
                  if (name.includes('creator')) return 2;
                  if (name.includes('studio')) return 3;
                  return 4; // fallback for unknown plans
                };
                
                return getOrder(aName) - getOrder(bName);
              })
              .map((product: StripeProduct) => {
            const price = getPriceForCycle(product, billingCycle);
            if (!price) return null;

            const isPopular = product.name.toLowerCase().includes("creator");
            const features = getPlanFeatures(product.name);

            return (
                <Card
                key={product.id}
                className={`relative flex flex-col ${
                    isPopular
                    ? "border-purple-500 shadow-lg border-2"
                    : ""
                }`}
                >
                {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                    Most Popular
                    </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold text-purple-600">
                    {product.name}
                    </CardTitle>
                    <CardDescription className=" min-h-[40px]">
                    {product.description}
                    </CardDescription>
                    <div className="mt-4">
                    <span className="text-4xl font-bold">
                        {billingCycle === "yearly" 
                          ? formatPrice(price.unit_amount / 12, price.currency)
                          : formatPrice(price.unit_amount, price.currency)
                        }
                    </span>
                    <span className="text-lg">
                        /month
                    </span>
                    {billingCycle === "yearly" && (
                      <div className="text-sm text-gray-500 mt-1">
                        Billed annually ({formatPrice(price.unit_amount, price.currency)}/year)
                      </div>
                    )}
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-grow px-6 pb-6">
                    {/* Features List */}
                    <div className="flex-grow">
                    <ul className="space-y-3 mb-6">
                        {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center space-x-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm ">{feature}</span>
                        </li>
                        ))}
                        <li className="flex items-center space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm ">7-day free trial</span>
                        </li>
                    </ul>
                    </div>

                    {/* Button at bottom of card */}
                    <div className="mt-auto">
                    <Button
                        onClick={() => handleSubscribe(price.id)}
                        disabled={loadingPriceId === price.id}
                        className={`w-full py-3 `}
                    >
                        {loadingPriceId === price.id ? (
                        <>
                            <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2 " />
                            Loading...
                        </>
                        ) : (
                        userOrganization?.subscriptionstatus === 'trial' 
                          ? "Subscribe Now" 
                          : "Start Free Trial"
                        )}
                    </Button>
                    </div>
                </CardContent>
                </Card>
            );
            })}
        </div>
        </div>
    </div>
  )
}