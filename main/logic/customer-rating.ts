/**
 * Customer Rating System - 4 Different Calculation Methods
 * Scale: 0-100% (replacing the 5-star system)
 * 
 * Based on database schema analysis and customer activity tracking
 */

export interface CustomerRatingData {
  customerId: string;
  activities: CustomerActivity[];
  invoices: Invoice[];
  receipts: Receipt[];
  projects: Project[];
  serviceAgreements: ServiceAgreement[];
  feedbacks: Feedback[];
  customerCreatedAt: string;
}

export interface CustomerActivity {
  type: string;
  created_at: string;
  details: any;
  referenceType: string;
  referenceId: string;
}

export interface Invoice {
  id: string;
  status: string;
  dueDate: string;
  created_at: string;
  totalAmount: number;
  paidOn?: string;
}

export interface Receipt {
  id: string;
  status: string;
  paymentConfirmedat?: string;
}

export interface Project {
  id: string;
  status: string;
  signedStatus?: string;
  hasAgreedToTerms?: boolean;
}

export interface ServiceAgreement {
  id: string;
  state: string;
  filledOn?: string;
}

export interface Feedback {
  id: string;
  state: string;
  filledOn?: string;
}

/**
 * METHOD 1: EMAIL ENGAGEMENT RATE (Communication Responsiveness)
 * 
 * Concept: Measure how actively customers engage with emails we send them
 * 
 * Calculation Logic:
 * - Track ratio of {context}_viewed vs {context}_sent activities
 * - Include {context}_link_clicked for additional engagement points
 * - Weight different contexts (invoices might be more important than general projects)
 * 
 * Formula: (viewed_count + (link_clicked_count * 1.5)) / sent_count * 100
 * 
 * Data Sources:
 * - customer_activities table with types: invoice_sent, invoice_viewed, invoice_link_clicked
 * - project_sent, project_viewed, project_link_clicked
 * - receipt_sent, receipt_viewed, receipt_link_clicked
 * - feedback_sent, feedback_viewed, feedback_link_clicked
 * - agreement_sent, agreement_viewed, agreement_link_clicked
 * 
 * Scoring:
 * - 90-100%: Highly engaged (opens most emails, clicks links frequently)
 * - 70-89%: Good engagement (opens emails regularly)
 * - 50-69%: Moderate engagement (some email interaction)
 * - 30-49%: Low engagement (rarely opens emails)
 * - 0-29%: Very low engagement (almost never interacts)
 */
export function calculateEmailEngagementRate(data: CustomerRatingData): number {
  const contexts = ['invoice', 'project', 'receipt', 'feedback', 'agreement'];
  let totalSent = 0;
  let totalViewed = 0;
  let totalClicked = 0;

  contexts.forEach(context => {
    const sent = data.activities.filter(a => a.type === `${context}_sent`).length;
    const viewed = data.activities.filter(a => a.type === `${context}_viewed`).length;
    const clicked = data.activities.filter(a => a.type === `${context}_link_clicked`).length;

    // Weight invoices more heavily (business critical)
    const weight = context === 'invoice' ? 1.5 : 1.0;
    
    totalSent += sent * weight;
    totalViewed += viewed * weight;
    totalClicked += clicked * weight;
  });

  if (totalSent === 0) return 50; // Default score for new customers

  const engagementScore = ((totalViewed + (totalClicked * 1.5)) / totalSent) * 100;
  return Math.min(Math.max(engagementScore, 0), 100); // Clamp between 0-100
}

/**
 * METHOD 2: PAYMENT RELIABILITY SCORE (Financial Trustworthiness)
 * 
 * Concept: Evaluate payment behavior and invoice management
 * 
 * Calculation Logic:
 * - Track invoice_paid vs invoice_sent ratio
 * - Penalize invoice_overdue activities
 * - Consider payment timing (early payments get bonus points)
 * - Track receipt confirmations as positive indicators
 * 
 * Formula: ((paid_invoices / total_invoices) * 70) + ((on_time_payments / total_payments) * 30) - (overdue_penalty)
 * 
 * Data Sources:
 * - customer_activities: invoice_sent, invoice_paid, invoice_overdue
 * - invoices table: status, dueDate, paymentConfirmedat, totalAmount
 * - receipts table: paymentConfirmedat, status
 * 
 * Scoring:
 * - 90-100%: Excellent (pays early/on-time, no overdue invoices)
 * - 80-89%: Very good (pays on time, rare late payments)
 * - 70-79%: Good (mostly pays on time, occasional delays)
 * - 60-69%: Fair (regular late payments, but eventually pays)
 * - 0-59%: Poor (frequently overdue, payment issues)
 */
export function calculatePaymentReliabilityScore(data: CustomerRatingData): number {
  const totalInvoices = data.invoices.length;
  
  // If no invoices, return 50% default
  if (totalInvoices === 0) return 50;

  const paidInvoices = data.invoices.filter(inv => 
    inv.status === 'paid' || inv.paidOn
  ).length;

  const overdueActivities = data.activities.filter(a => a.type === 'invoice_overdue').length;
  
  // Calculate on-time payments using actual paidOn vs dueDate comparison
  let onTimePayments = 0;
  let totalPayments = 0;

  data.invoices.forEach(invoice => {
    if (invoice.paidOn) {
      totalPayments++;
      const dueDate = new Date(invoice.dueDate);
      const paidDate = new Date(invoice.paidOn);
      
      if (paidDate <= dueDate) {
        onTimePayments++;
      }
    }
  });

  // Base payment completion ratio (50% weight)
  const paymentCompletionScore = (paidInvoices / totalInvoices) * 50;
  
  // On-time payment bonus (25% weight)
  const onTimeBonus = totalPayments > 0 ? (onTimePayments / totalPayments) * 25 : 12.5;
  
  // Overdue penalty (subtract 5 points per overdue invoice, max 25 points)
  const overduePenalty = Math.min(overdueActivities * 5, 25);

  // Core payment score (50-75% of total)
  const corePaymentScore = paymentCompletionScore + onTimeBonus - overduePenalty;

  // **ADDITIONAL ACTIVITY & ENGAGEMENT METRICS**
  const totalProjects = data.projects.length;
  const totalReceipts = data.receipts.length;
  const totalFeedbacks = data.feedbacks.length;
  
  // Calculate customer tenure in months
  const customerAge = new Date();
  const createdDate = new Date(data.customerCreatedAt);
  const tenureMonths = Math.max((customerAge.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30), 1);

  // Calculate activity volume per month (engagement rate)
  const totalActivity = totalInvoices + totalProjects + totalReceipts + totalFeedbacks;
  const activityPerMonth = totalActivity / tenureMonths;
  
  // Activity volume bonus (0-15 points)
  // Higher activity = better score (capped at 15 points)
  const activityBonus = Math.min(activityPerMonth * 2, 15);
  
  // Engagement diversity bonus (0-10 points)
  // Reward customers who engage across multiple areas
  const engagementTypes = [
    totalInvoices > 0 ? 1 : 0,
    totalProjects > 0 ? 1 : 0, 
    totalReceipts > 0 ? 1 : 0,
    totalFeedbacks > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  const diversityBonus = (engagementTypes / 4) * 10;

  // Combine core payment score with activity bonuses
  const finalScore = corePaymentScore + activityBonus + diversityBonus;
  
  // Ensure minimum of 50% and maximum of 100%
  return Math.min(Math.max(finalScore, 50), 100);
}

/**
 * METHOD 3: PROJECT COLLABORATION SCORE (Partnership Quality)
 * 
 * Concept: Measure how well customers engage throughout the project lifecycle
 * 
 * Calculation Logic:
 * - Service agreement completion rate (agreement_signed vs agreement_sent)
 * - Feedback submission rate (feedback_received vs feedback_requested)
 * - Project milestone engagement and communication
 * - Response time to project communications
 * 
 * Formula: (agreements_signed/agreements_sent * 40) + (feedback_completed/feedback_requested * 35) + (project_engagement_rate * 25)
 * 
 * Data Sources:
 * - customer_activities: agreement_sent, agreement_signed, feedback_requested, feedback_received
 * - service_agreements table: state, filledOn
 * - feedbacks table: state, filledOn
 * - projects table: hasAgreedToTerms, signedStatus
 * 
 * Scoring:
 * - 90-100%: Excellent partner (signs agreements quickly, provides feedback, highly collaborative)
 * - 80-89%: Very good (good collaboration, occasional delays)
 * - 70-79%: Good (adequate collaboration, some communication gaps)
 * - 60-69%: Fair (slow to respond, minimal collaboration)
 * - 0-59%: Poor (difficult to work with, poor communication)
 */
export function calculateProjectCollaborationScore(data: CustomerRatingData): number {
  // Agreement completion rate (40% weight)
  const agreementsSent = data.activities.filter(a => a.type === 'agreement_sent').length;
  const agreementsSigned = data.activities.filter(a => a.type === 'agreement_signed').length;
  const agreementScore = agreementsSent > 0 ? (agreementsSigned / agreementsSent) * 40 : 20;

  // Feedback completion rate (35% weight)
  const feedbackRequested = data.activities.filter(a => a.type === 'feedback_requested').length;
  const feedbackReceived = data.activities.filter(a => a.type === 'feedback_received').length;
  const feedbackScore = feedbackRequested > 0 ? (feedbackReceived / feedbackRequested) * 35 : 17.5;

  // Project engagement rate (25% weight)
  const projectsSent = data.activities.filter(a => a.type === 'project_sent').length;
  const projectsViewed = data.activities.filter(a => a.type === 'project_viewed').length;
  const projectClicked = data.activities.filter(a => a.type === 'project_link_clicked').length;
  
  let projectEngagementScore = 12.5; // Default
  if (projectsSent > 0) {
    const engagementRate = (projectsViewed + (projectClicked * 1.5)) / projectsSent;
    projectEngagementScore = Math.min(engagementRate * 25, 25);
  }

  const totalScore = agreementScore + feedbackScore + projectEngagementScore;
  return Math.min(Math.max(totalScore, 0), 100);
}

/**
 * METHOD 4: OVERALL ACTIVITY & LONGEVITY SCORE (Relationship Strength)
 * 
 * Concept: Combine customer tenure, activity frequency, and relationship depth
 * 
 * Calculation Logic:
 * - Account age and tenure bonus (longer relationship = higher trust)
 * - Total activity volume (more interactions = better relationship)
 * - Diversity of interaction types (invoices, projects, feedback, etc.)
 * - Recent activity frequency (active customers get higher scores)
 * 
 * Formula: (tenure_bonus * 0.2) + (activity_volume_score * 0.3) + (interaction_diversity * 0.2) + (recent_activity_score * 0.3)
 * 
 * Data Sources:
 * - customers table: created_at (for tenure calculation)
 * - customer_activities: all activity types and timestamps
 * - Multiple related tables for comprehensive relationship mapping
 * 
 * Scoring:
 * - 90-100%: Long-term, highly active customer with diverse interactions
 * - 80-89%: Established customer with good activity levels
 * - 70-79%: Moderate relationship with regular interactions
 * - 60-69%: New or moderately active customer
 * - 0-59%: New customer or low activity levels
 */
export function calculateActivityLongevityScore(data: CustomerRatingData): number {
  const now = new Date();
  const createdAt = new Date(data.customerCreatedAt);
  
  // Tenure bonus (20% weight) - max 20 points
  const tenureMonths = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const tenureBonus = Math.min(tenureMonths * 2, 20); // 2 points per month, max 20

  // Activity volume score (30% weight) - max 30 points
  const totalActivities = data.activities.length;
  const activityVolumeScore = Math.min(totalActivities * 0.5, 30); // 0.5 points per activity, max 30

  // Interaction diversity (20% weight) - max 20 points
  const uniqueActivityTypes = new Set(data.activities.map(a => a.type.split('_')[0])).size;
  const diversityScore = Math.min(uniqueActivityTypes * 4, 20); // 4 points per unique type, max 20

  // Recent activity score (30% weight) - max 30 points
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const recentActivities = data.activities.filter(a => new Date(a.created_at) >= thirtyDaysAgo).length;
  const recentActivityScore = Math.min(recentActivities * 3, 30); // 3 points per recent activity, max 30

  const totalScore = tenureBonus + activityVolumeScore + diversityScore + recentActivityScore;
  return Math.min(Math.max(totalScore, 0), 100);
}

/**
 * COMPOSITE RATING SYSTEM
 * 
 * Combines multiple methods with configurable weights
 * Default weights: Payment (40%), Collaboration (25%), Engagement (20%), Activity (15%)
 */
export interface RatingWeights {
  payment: number;
  collaboration: number;
  engagement: number;
  activity: number;
}

export function calculateCompositeRating(
  data: CustomerRatingData, 
  weights: RatingWeights = { payment: 0.4, collaboration: 0.25, engagement: 0.2, activity: 0.15 }
): number {
  const paymentScore = calculatePaymentReliabilityScore(data);
  const collaborationScore = calculateProjectCollaborationScore(data);
  const engagementScore = calculateEmailEngagementRate(data);
  const activityScore = calculateActivityLongevityScore(data);

  const compositeScore = 
    (paymentScore * weights.payment) +
    (collaborationScore * weights.collaboration) +
    (engagementScore * weights.engagement) +
    (activityScore * weights.activity);

  return Math.round(compositeScore);
}

/**
 * RATING CATEGORIES FOR METER DISPLAY
 */
export function getRatingCategory(score: number): {
  category: string;
  color: string;
  description: string;
  range: string;
} {
  if (score >= 85) return {
    category: "Excellent",
    color: "#22c55e", // Green
    description: "Outstanding",
    range: "85-100%"
  };
  
  if (score >= 70) return {
    category: "Good",
    color: "#eab308", // Yellow
    description: "Above Average",
    range: "70-84%"
  };
  
  if (score >= 55) return {
    category: "Average",
    color: "#f97316", // Orange
    description: "Acceptable",
    range: "55-69%"
  };
  
  if (score >= 40) return {
    category: "Below Average",
    color: "#dc2626", // Red-Orange
    description: "Needs Improvement",
    range: "40-54%"
  };
  
  return {
    category: "Poor",
    color: "#dc2626", // Red
    description: "Critical",
    range: "0-39%"
  };
}

/**
 * USAGE EXAMPLES:
 * 
 * // Single method calculation
 * const paymentScore = calculatePaymentReliabilityScore(customerData);
 * 
 * // Composite score with default weights
 * const overallRating = calculateCompositeRating(customerData);
 * 
 * // Custom weighted score
 * const customRating = calculateCompositeRating(customerData, {
 *   payment: 0.5,      // 50% weight on payments
 *   collaboration: 0.3, // 30% weight on collaboration
 *   engagement: 0.15,   // 15% weight on email engagement
 *   activity: 0.05      // 5% weight on activity/longevity
 * });
 * 
 * // Get display information for meter
 * const ratingInfo = getRatingCategory(overallRating);
 */
