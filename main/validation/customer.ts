import { z } from "zod";

const customerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address" }),
    // Optional fields
    website: z.string().optional(),
    taxId: z.string().optional(),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    adressline1: z.string().optional(),
    unitNumber: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    fullAddress: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  });

  export default customerSchema;