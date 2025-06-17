import { createClient } from "@/utils/supabase/server";
import projectCreateSchema from "@/validation/projects";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedFields = projectCreateSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: "Invalid fields!", details: validatedFields.error.flatten() }, 
                { status: 400 });
        }
        const supabase = await createClient();
         
    } catch (error) {
        console.error("Error during drag and drop:", error);
    }
}