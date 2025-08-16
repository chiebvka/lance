import { NextRequest, NextResponse } from "next/server";
import { deleteFileFromR2 } from "@/lib/r2";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { key, fileUrl } = body;

    let fileKey = key;

    // If fileUrl is provided instead of key, extract the key from the URL
    if (!fileKey && fileUrl) {
      if (typeof fileUrl !== 'string') {
        return NextResponse.json({ error: "Invalid 'fileUrl' in request body." }, { status: 400 });
      }

      // Extract key from Cloudflare URL
      // URL format: https://pub-xxxxx.r2.dev/path/to/file.ext
      const urlParts = fileUrl.split('/');
      if (urlParts.length < 4) {
        return NextResponse.json({ error: "Invalid fileUrl format." }, { status: 400 });
      }
      
      // Get everything after the domain
      const domain = urlParts[2]; // pub-xxxxx.r2.dev
      const pathIndex = fileUrl.indexOf(domain) + domain.length + 1;
      fileKey = fileUrl.substring(pathIndex);
    }

    if (!fileKey || typeof fileKey !== 'string') {
      return NextResponse.json({ error: "Missing or invalid 'key' or 'fileUrl' in request body." }, { status: 400 });
    }

    // Add validation here if the key should conform to a certain pattern
    // For walls, files are typically in folders like: walls/images/, walls/videos/, walls/files/
    const allowedPrefixes = ['walls/', 'gallery/', 'organizations/', 'temp/'];
    const isValidKey = allowedPrefixes.some(prefix => fileKey.startsWith(prefix));
    
    if (!isValidKey) {
      console.warn(`Attempted to delete file with invalid key: ${fileKey}`);
      return NextResponse.json({ error: "Invalid key format or unauthorized path." }, { status: 400 });
    }

    await deleteFileFromR2(fileKey);
    return NextResponse.json({ success: true, message: "File deleted from R2 successfully.", key: fileKey });

  } catch (error: any) {
    console.error("R2 Deletion failed:", error);
    // If deleteFileFromR2 throws, it will be caught here
    return NextResponse.json({ error: error.message || "File deletion from R2 failed" }, { status: 500 });
  }
}
