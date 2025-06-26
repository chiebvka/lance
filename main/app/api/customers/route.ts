import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { calculatePaymentReliabilityScore, CustomerRatingData } from "@/logic/customer-rating";

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // First, get all customers for this user
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("*")
      .eq("createdBy", user.id)
      .order("created_at", { ascending: false });

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      return NextResponse.json(
        { error: "Could not fetch customers from database." },
        { status: 500 }
      );
    }

    // For each customer, get counts of related records
    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
        // Get invoice count
        const { count: invoiceCount } = await supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("customerId", customer.id);

        // Get project count
        const { count: projectCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("customerId", customer.id);

        // Get receipt count
        const { count: receiptCount } = await supabase
          .from("receipts")
          .select("*", { count: "exact", head: true })
          .eq("customerId", customer.id);

        // Get feedback count
        const { count: feedbackCount } = await supabase
          .from("feedbacks")
          .select("*", { count: "exact", head: true })
          .eq("customerId", customer.id);

        // Get last activity from customer_activities
        const { data: lastActivity } = await supabase
          .from("customer_activities")
          .select("created_at")
          .eq("customerId", customer.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastActivityTime = lastActivity?.[0]?.created_at 
          ? new Date(lastActivity[0].created_at)
          : new Date(customer.created_at || '');

        // Calculate time ago
        const now = new Date();
        const diffMs = now.getTime() - lastActivityTime.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);

        let lastActivity_formatted = "";
        if (diffMinutes < 60) {
          lastActivity_formatted = `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
          lastActivity_formatted = `${diffHours} hours ago`;
        } else if (diffDays < 7) {
          lastActivity_formatted = diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
        } else {
          lastActivity_formatted = diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
        }

        // Calculate payment reliability rating using real data
        const { data: activities, error: activitiesError } = await supabase
          .from("customer_activities")
          .select("*")
          .eq("customerId", customer.id);

        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("id, status, dueDate, created_at, totalAmount, paidOn")
          .eq("customerId", customer.id);

        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("id, status, created_at")
          .eq("customerId", customer.id);

        const { data: receipts, error: receiptsError } = await supabase
          .from("receipts")
          .select("id, status, created_at")
          .eq("customerId", customer.id);

        const { data: feedbacks, error: feedbacksError } = await supabase
          .from("feedbacks")
          .select("id, state, created_at")
          .eq("customerId", customer.id);

        // Prepare data for rating calculation
        const ratingData: CustomerRatingData = {
          customerId: customer.id,
          activities: activities || [],
          invoices: invoices || [],
          receipts: receipts || [],
          projects: projects || [],
          serviceAgreements: [], // We'll add this later if needed
          feedbacks: feedbacks || [],
          customerCreatedAt: customer.created_at || new Date().toISOString(),
        };

        // Calculate payment reliability score
        const rating = Math.round(calculatePaymentReliabilityScore(ratingData));

        return {
          ...customer,
          invoiceCount: invoiceCount || 0,
          projectCount: projectCount || 0,
          receiptCount: receiptCount || 0,
          feedbackCount: feedbackCount || 0,
          lastActivity: lastActivity_formatted,
          rating: rating, // Real payment reliability score (0-100)
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      customers: customersWithCounts 
    }, { status: 200 });

  } catch (error) {
    console.error("Request Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
