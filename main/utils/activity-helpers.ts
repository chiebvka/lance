import { format } from "date-fns"

export interface CustomerActivityWithDetails {
  id: string
  customerId: string | null
  referenceId: string | null
  referenceType: "invoice" | "receipt" | "project" | "agreement" | "feedback" | null
  type: string | null
  label: string | null
  details: any
  created_at: string | null
  createdBy: string | null
  amount: number | null
  tagColor: string | null
  
  // Joined data
  customer: {
    name: string | null
    email: string | null
  } | null
  reference: {
    name: string | null
    number: string | null // invoiceNumber, receiptNumber, etc.
    context: string // "project", "invoice", "receipt", "feedback"
  } | null
}

// Map activity types to display information
const activityTypeMap = {
  // Project activities
  project_sent: { action: "sent", verb: "sent", tag: "project" },
  project_viewed: { action: "viewed", verb: "opened", tag: "project" },
  project_link_clicked: { action: "link_clicked", verb: "clicked a link in", tag: "project" },
  
  // Invoice activities
  invoice_sent: { action: "sent", verb: "sent", tag: "invoice" },
  invoice_viewed: { action: "viewed", verb: "opened", tag: "invoice" },
  invoice_link_clicked: { action: "link_clicked", verb: "clicked a link in", tag: "invoice" },
  invoice_paid: { action: "paid", verb: "paid", tag: "invoice" },
  invoice_overdue: { action: "overdue", verb: "is overdue for", tag: "invoice" },
  
  // Receipt activities
  receipt_sent: { action: "sent", verb: "sent", tag: "receipt" },
  receipt_viewed: { action: "viewed", verb: "opened", tag: "receipt" },
  receipt_link_clicked: { action: "link_clicked", verb: "clicked a link in", tag: "receipt" },
  
  // Feedback activities
  feedback_requested: { action: "requested", verb: "requested feedback for", tag: "feedback" },
  feedback_received: { action: "received", verb: "submitted feedback for", tag: "feedback" },
  feedback_viewed: { action: "viewed", verb: "opened", tag: "feedback" },
  feedback_link_clicked: { action: "link_clicked", verb: "clicked a link in", tag: "feedback" },
  
  // Agreement activities
  agreement_sent: { action: "sent", verb: "sent", tag: "service_agreement" },
  agreement_viewed: { action: "viewed", verb: "opened", tag: "service_agreement" },
  agreement_link_clicked: { action: "link_clicked", verb: "clicked a link in", tag: "service_agreement" },
  agreement_signed: { action: "signed", verb: "signed", tag: "service_agreement" },
}

// Helper function to generate activity display text
export function generateActivityDisplayText(activity: CustomerActivityWithDetails): {
  title: string
  description: string
  tag: string
} {
  const typeInfo = activityTypeMap[activity.type as keyof typeof activityTypeMap]
  const customerName = activity.customer?.name || "Unknown Customer"
  
  if (!typeInfo) {
    return {
      title: activity.label || "Unknown Activity",
      description: `Activity by ${customerName}`,
      tag: "other"
    }
  }

  let title = ""
  let description = ""
  
  // Generate title based on activity type and reference
  if (activity.reference) {
    switch (activity.referenceType) {
      case "project":
        title = `${activity.reference.name || "Project"} ${typeInfo.action}`
        if (typeInfo.action === "sent") {
          description = `project email was sent to ${customerName}`
        } else {
          description = `${customerName} ${typeInfo.verb} the project email`
        }
        break
      case "invoice":
        title = `Invoice ${activity.reference.number || "Unknown"} ${typeInfo.action}`
        if (typeInfo.action === "sent") {
          description = `invoice email was sent to ${customerName}`
        } else {
          description = `${customerName} ${typeInfo.verb} the invoice email`
        }
        break
      case "receipt":
        title = `Receipt ${activity.reference.number || "Unknown"} ${typeInfo.action}`
        if (typeInfo.action === "sent") {
          description = `receipt email was sent to ${customerName}`
        } else {
          description = `${customerName} ${typeInfo.verb} the receipt email`
        }
        break
      case "feedback":
        title = `${activity.reference.name || "Feedback"} ${typeInfo.action}`
        if (typeInfo.action === "sent") {
          description = `feedback email was sent to ${customerName}`
        } else {
          description = `${customerName} ${typeInfo.verb} the feedback email`
        }
        break
      case "agreement":
        title = `${activity.reference.name || "Agreement"} ${typeInfo.action}`
        if (typeInfo.action === "sent") {
          description = `service agreement email was sent to ${customerName}`
        } else {
          description = `${customerName} ${typeInfo.verb} the agreement email`
        }
        break
      default:
        title = activity.label || "Unknown Activity"
        description = `Activity by ${customerName}`
    }
  } else {
    title = activity.label || "Unknown Activity"
    description = `Activity by ${customerName}`
  }

  return {
    title,
    description,
    tag: typeInfo.tag
  }
}

// Helper function to format time using date-fns
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Unknown time"
  
  try {
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }
    
    // Format as "June 24 2025 by 4:35PM UTC"
    return format(date, "MMMM d yyyy 'by' h:mmaaa 'UTC'")
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Unknown time"
  }
} 