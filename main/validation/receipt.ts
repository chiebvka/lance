import OrganizationLogo from "@/app/protected/(sidebar)/settings/_components/organization-logo";
import { z } from "zod";

const receiptCreateSchema = z.object({
    // Optional – manual receipts won't have an invoiceId
    invoiceId: z.string().optional(),
    customerId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    organizationId: z.string().nullable().optional(),
    organizationName: z.string().nullable().optional(),
    OrganizationLogo: z.string().nullable().optional(),
    organizationEmail: z.string().nullable().optional(),
    recepientName: z.string().nullable().optional(),
    recepientEmail: z.string().nullable().optional(),
    issueDate: z.coerce.date().optional().nullable(),
    updatedAt: z.coerce.date().optional().nullable(),
    paymentConfirmedAt: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    currency: z.string().optional(),
    receiptNumber: z.string().optional(),
    hasVat: z.boolean().optional(),
    hasTax: z.boolean().optional(),
    hasDiscount: z.boolean().optional(),
    vatRate: z.number().optional(),
    taxRate: z.number().optional(),
    discount: z.number().optional(),
    notes: z.string().optional(),
    state: z.enum(["draft", "unassigned", "sent", "settled", "overdue", "cancelled"]).optional(),
    creationMethod: z.enum(["manual", "auto", "invoice", ]).optional(),
    paymentMethod: z.string().optional(),
    paymentStatus: z.string().optional(),
    paymentDate: z.date().optional(),
    paymentNotes: z.string().optional(),
    receiptDetails:z.array(z.object({
        position: z.number().optional(),
        description: z.string().nullable().optional(),
        quantity: z.number().optional(),
        // Accept either unitPrice or price from the client; we'll normalize in the route
        unitPrice: z.number().optional(),
        price: z.number().optional(),
        total: z.number().optional(),
    })),
})

export { receiptCreateSchema }