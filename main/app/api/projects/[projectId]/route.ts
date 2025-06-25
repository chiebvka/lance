import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { projectCreateSchema } from "@/validation/projects";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function GET(request: Request, { params }: { params: { projectId: string } }) {}