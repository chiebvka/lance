import { z } from "zod";

const paymentTermSchema = z.object({
    id: z.string().optional(),
    projectId: z.string().uuid({ message: "Valid project ID is required." }).optional(),
    deliverableId: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    amount: z.number().optional().nullable(),
    percentage: z.number().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    status: z.string().optional().nullable(),
    type: z.enum(['milestone', 'deliverable']).optional().nullable(),
    hasPaymentTerms: z.boolean().optional(),
    updatedAt: z.date().optional().nullable(),
    createdBy: z.string().optional(),
})

export default paymentTermSchema;

