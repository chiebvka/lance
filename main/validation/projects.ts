import { z } from "zod";
import deliverableSchema from "./deliverables";
import paymentTermSchema from "./payment";

const projectCreateSchema = z.object({
  // Customer and Currency
  customerId: z.string().nullable(),
  currency: z.string().optional(),
  currencyEnabled: z.boolean().optional(),

  // Project Type and Details
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  type: z.enum(["personal", "customer"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  budget: z.number().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  effectiveDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),

  // Deliverables
  deliverablesEnabled: z.boolean().optional(),
  deliverables: z.array(deliverableSchema).optional(),

  // Payment
  paymentStructure: z.string().optional(),
  paymentMilestones: z.array(paymentTermSchema).optional(),
  // paymentTerms: z.string().optional(), 
  hasPaymentTerms: z.boolean().optional(),


  // Service Agreement
  hasServiceAgreement: z.boolean().optional(),
  serviceAgreement: z.string().optional(),
  agreementTemplate: z.string().optional(),
  hasAgreedToTerms: z.boolean().optional(),

  // Status and State
  isPublished: z.boolean().optional(),
  status: z.enum(["pending", "inProgress", "signed", "overdue", "completed", "cancelled"]).optional(),
  signedStatus: z.string().optional(),
  state: z.enum(["draft", "published"]).optional(),

  // Other
  documents: z.string().optional(),
  customFields: z.object({
      name: z.string().optional(),
      value: z.string().optional(),
  }).optional(),
  emailToCustomer: z.boolean().optional(),
  
  // Organization and Recipient Information
  organizationName: z.string().optional(),
  organizationLogo: z.string().optional(),
  organizationEmail: z.string().optional(),
  recepientName: z.string().optional(),
  recepientEmail: z.string().optional(),
});

const projectEditSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().nullable(),
  currency: z.string().optional(),
  currencyEnabled: z.boolean().optional(),

  // Project Type and Details
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  type: z.enum(["personal", "customer"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  budget: z.number().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  effectiveDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),

  // Deliverables
  deliverablesEnabled: z.boolean().optional(),
  deliverables: z.array(deliverableSchema).optional(),

  // Payment
  paymentStructure: z.string().optional(),
  paymentMilestones: z.array(paymentTermSchema).optional(),
  // paymentTerms: z.string().optional(), 
  hasPaymentTerms: z.boolean().optional(),


  // Service Agreement
  hasServiceAgreement: z.boolean().optional(),
  serviceAgreement: z.string().optional(),
  agreementTemplate: z.string().optional(),
  hasAgreedToTerms: z.boolean().optional(),

  // Status and State
  isPublished: z.boolean().optional(),
  status: z.enum(["pending", "inProgress", "signed", "overdue", "completed", "cancelled"]).optional(),
  signedStatus: z.string().optional(),
  state: z.enum(["draft", "published"]).optional(),

  // Other
  documents: z.string().optional(),
  customFields: z.object({
      name: z.string().optional(),
      value: z.string().optional(),
  }).optional(),
  emailToCustomer: z.boolean().optional(),
  
  // Organization and Recipient Information
  organizationName: z.string().optional(),
  organizationLogo: z.string().optional(),
  organizationEmail: z.string().optional(),
  recepientName: z.string().optional(),
  recepientEmail: z.string().optional(),
});

const projectAnswerSchema = z.object({
  projectId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.string(),
  })),
  serviceAgreement: z.string().optional(),
  token: z.string().uuid({ message: "Invalid token" }),
});

export { projectCreateSchema, projectEditSchema, projectAnswerSchema };