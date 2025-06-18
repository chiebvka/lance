import { z } from "zod";
import deliverableSchema from "./deliverables";
import paymentTermSchema from "./payment";

const projectCreateSchema = z.object({
  // Customer and Currency
  customerId: z.string().nullable(),
  currency: z.string().optional(),
  currencyEnabled: z.boolean().optional(),

  // Project Type and Details
  type: z.enum(["personal", "customer"]),
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  budget: z.number().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),

  // Deliverables
  deliverablesEnabled: z.boolean().optional(),
  deliverables: z.array(deliverableSchema).optional(),

  // Payment
  paymentStructure: z.string().optional(),
  paymentMilestones: z.array(paymentTermSchema).optional(),
  paymentTerms: z.string().optional(), 
  hasPaymentTerms: z.boolean().optional(),


  // Service Agreement
  hasServiceAgreement: z.boolean().optional(),
  serviceAgreement: z.string().optional(),
  agreementTemplate: z.string().optional(),
  hasAgreedToTerms: z.boolean().optional(),

  // Status and State
  isPublished: z.boolean().optional(),
  status: z.string().optional(),
  signedStatus: z.string().optional(),
  state: z.enum(["draft", "published"]).optional(),

  // Other
  documents: z.string().optional(),
  customFields: z.object({
      name: z.string().min(2, "Name must be at least 2 characters."),
      value: z.string().min(2, "Value must be at least 2 characters."),
  }).optional(),
  emailToCustomer: z.boolean().optional(),
});

export default projectCreateSchema;