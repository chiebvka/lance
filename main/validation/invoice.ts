import { z } from "zod";

const feedbackCreateSchema = z.object({
    customerId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    organizationName: z.string().nullable().optional(),
    organizationLogoUrl: z.string().nullable().optional(),
    organizationEmail: z.string().nullable().optional(),
    dueDate: z.coerce.date().optional().nullable(),
    state: z.enum(["draft", "sent", "completed", "overdue, cancelled"]).optional(),
    recipientEmail: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")), // Made optional and allow empty string
    recepientName: z.string().nullable().optional(), // Allow null values
    message: z.string().nullable().optional(),
    
})