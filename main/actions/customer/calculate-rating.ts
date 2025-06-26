"use server"

import { createClient } from "@/utils/supabase/server";
import { calculatePaymentReliabilityScore, CustomerRatingData } from "@/logic/customer-rating";

export async function calculateCustomerRating(customerId: string): Promise<number> {
  try {
    const supabase = await createClient();

    // Fetch customer activities
    const { data: activities, error: activitiesError } = await supabase
      .from("customer_activities")
      .select("*")
      .eq("customerId", customerId);

    if (activitiesError) {
      console.error("Error fetching customer activities:", activitiesError);
      return 75; // Default score
    }

    // Fetch customer invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, status, dueDate, created_at, totalAmount")
      .eq("customerId", customerId);

    if (invoicesError) {
      console.error("Error fetching customer invoices:", invoicesError);
      return 75; // Default score
    }

    // Fetch customer data for created_at
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("created_at")
      .eq("id", customerId)
      .single();

    if (customerError) {
      console.error("Error fetching customer:", customerError);
      return 75; // Default score
    }

    // Prepare data for rating calculation
    const ratingData: CustomerRatingData = {
      customerId,
      activities: activities || [],
      invoices: invoices || [],
      receipts: [], // We'll add this later if needed
      projects: [], // We'll add this later if needed
      serviceAgreements: [], // We'll add this later if needed
      feedbacks: [], // We'll add this later if needed
      customerCreatedAt: customer.created_at || new Date().toISOString(),
    };

    // Calculate payment reliability score
    const rating = calculatePaymentReliabilityScore(ratingData);
    
    return Math.round(rating);
  } catch (error) {
    console.error("Error calculating customer rating:", error);
    return 75; // Default score on error
  }
}

export async function calculateAllCustomerRatings(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    
    // Get all customers
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id");

    if (error || !customers) {
      console.error("Error fetching customers:", error);
      return {};
    }

    // Calculate ratings for all customers
    const ratings: Record<string, number> = {};
    
    for (const customer of customers) {
      ratings[customer.id] = await calculateCustomerRating(customer.id);
    }

    return ratings;
  } catch (error) {
    console.error("Error calculating all customer ratings:", error);
    return {};
  }
} 