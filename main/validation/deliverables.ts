import { z } from "zod";

const deliverableSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: "Name is required." }),
    description: z.string().optional().nullable(),
    // Optional fields
    dueDate: z.coerce.date().optional().nullable(),
    projectId: z.string().optional(),
    isPublished: z.boolean().optional(),
    lastSaved: z.coerce.date().optional().nullable(),
    status: z.enum(["pending", "in_progress", "completed"]).optional(),
    updatedAt: z.coerce.date().optional().nullable(),
    position: z.number().min(1).optional().nullable(),
    createdBy: z.string().optional(),
  });

export default deliverableSchema;