import { z } from "zod";

const projectCreateSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().min(2, { message: "Description must be at least 2 characters." }),
    // Optional fields
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
    effectiveDate: z.date().optional(),
    status: z.enum(["pending", "in_progress", "completed"]),
    priority: z.enum(["low", "medium", "high"]),
    customerId: z.string().optional(),
    budget: z.number().optional(),
    serviceAgreement: z.string().optional(),
    signedStatus: z.enum(["signed", "not_signed"]),
    signedOn: z.date().optional(),
    documents: z.string().optional(),
    notes: z.string().optional(),
    customFields: z.object({
        name: z.string().min(2, { message: "Name must be at least 2 characters." }),
        value: z.string().min(2, { message: "Value must be at least 2 characters." }),
    }).optional(),
    state: z.enum(["draft", "published"]),
    type: z.enum(["personal", "customer"]),
    hasServiceAgreement: z.boolean().optional(),
    hasPaymentTerms: z.boolean().optional(),
    currency: z.string().optional(),
    paymentTerms: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentFrequency: z.string().optional(),
  });

  export default projectCreateSchema;