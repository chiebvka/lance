import { uploadFileToR2 } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const folder = formData.get("type") as string | null || "misc"; // optional dynamic type

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = file.type || "application/octet-stream";
    const filename = `${folder}/${Date.now()}-${file.name || "upload"}`;

    const { url, key } = await uploadFileToR2(buffer, filename, contentType);

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}