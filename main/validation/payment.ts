import { z } from "zod";

const paymentTermSchema = z.object({
    id: z.string().optional(),
    projectId: z.string().uuid({ message: "Valid project ID is required." }).optional(),
    deliverableId: z.string({ message: "Valid deliverable ID is required." }).nullable(),
    name: z.string().min(2, "Name must be at least 2 characters.").nullable(),
    description: z.string().nullable(),
    amount: z.number().nullable(),
    percentage: z.number().nullable(),
    dueDate: z.coerce.date().nullable(),
    status: z.string().nullable(),
    type: z.enum(['milestone', 'deliverable']).nullable(),
    hasPaymentTerms: z.boolean().optional(),
    updatedAt: z.date().optional(),
})

export default paymentTermSchema;

