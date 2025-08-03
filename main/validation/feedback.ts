import { z } from "zod";

const feedbackCreateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  customerId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  organizationLogoUrl: z.string().nullable().optional(),
  organizationEmail: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(), // Made optional
  dueDate: z.coerce.date().optional().nullable(),
  state: z.enum(["draft", "sent", "completed", "overdue, cancelled"]).optional(),
  recipientEmail: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")), // Made optional and allow empty string
  recepientName: z.string().nullable().optional(), // Allow null values
  message: z.string().nullable().optional(), // Allow null values
  token: z.string().uuid({ message: "Invalid token" }).optional(),
  questions: z.array(
    z.object({
      id: z.string().min(1, { message: "Question ID is required" }),
      required: z.boolean().optional(),
      text: z.string().min(1, { message: "Question text is required" }),
      type: z.enum(["yes_no", "rating", "multiple_choice", "text", "dropdown", "number"], {
        message: "Invalid question type",
      }), // Fixed to match your question types
      options: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          choices: z.array(z.string()).optional(),
        })
        .optional(),
    })
  ),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, { message: "Question ID is required" }),
      answer: z.union([
        z.boolean(), // For yes_no
        z.number(), // For rating
        z.string(), // For text
        z.array(z.string()), // For multiple_choice
      ]), // Flexible answer types
    })
  ).optional(), // Made answers completely optional
});

const feedbackTemplateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  organizationId: z.string().uuid().nullable().optional(),
  created_at: z.coerce.date().optional(),
  createdBy: z.string().uuid({ message: "Invalid creator ID" }),
  updated_at: z.coerce.date().nullable().optional(),
  questions: z.array(
    z.object({
      id: z.string().min(1, { message: "Question ID is required" }),
      text: z.string().min(1, { message: "Question text is required" }),
      type: z.enum(["yes_no", "rating", "multiple_choice", "text", "dropdown", "number"], {
        message: "Invalid question type",
      }),
      required: z.boolean().optional(),
      options: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          choices: z.array(z.string()).optional(),
        })
        .optional(),
    })
  ).min(1, { message: "At least one question is required" }),
  isDefault: z.boolean({ message: "Default status is required" }),
});

// Schema for answering feedback (recipient submission)
const feedbackAnswerSchema = z.object({
  feedbackId: z.string().min(1, { message: "Feedback ID is required" }),
  token: z.string().uuid({ message: "Invalid token" }),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, { message: "Question ID is required" }),
      answer: z.union([
        z.boolean(), // For yes_no
        z.number(), // For rating and number
        z.string(), // For text
        z.array(z.string()), // For multiple_choice and dropdown
      ]).nullable(), // Allow null for unanswered required questions
    })
  ).min(1, { message: "At least one answer is required" }),
});

export { feedbackCreateSchema, feedbackTemplateSchema, feedbackAnswerSchema };


