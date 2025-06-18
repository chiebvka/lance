import { z } from "zod";

const deliverableSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().min(2, { message: "Description must be at least 2 characters." }),
    // Optional fields
    dueDate: z.coerce.date().optional().nullable(),
    projectId: z.string().optional(),
    isPublished: z.boolean().optional(),
    lastSaved: z.coerce.date().optional(),
    status: z.enum(["pending", "in_progress", "completed"]),
    updatedAt: z.coerce.date().optional(),
    position: z.number().min(1).nullable(),
  });

  export default deliverableSchema;