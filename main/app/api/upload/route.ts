import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { uploadFileToR2 } from "@/lib/r2"

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called - starting request processing")
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Upload API - Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Upload API - User authenticated:", user.id)

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get("type") as string | null

    console.log("Upload API - Form data received:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      folder: folder
    })

    if (!file) {
      console.error("Upload API - No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!folder) {
      console.error("Upload API - No folder type specified")
      return NextResponse.json({ error: "No folder type specified" }, { status: 400 })
    }

    // Validate file size and type based on folder
    let maxSize = 5 * 1024 * 1024 // Default 5MB
    let allowedTypes: string[] = []
    let folderName = ""

    if (folder.includes("walls/images")) {
      maxSize = 10 * 1024 * 1024 // 10MB
      allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"]
      folderName = "walls/images"
    } else if (folder.includes("walls/videos")) {
      maxSize = 100 * 1024 * 1024 // 100MB
      allowedTypes = ["video/avi", "video/mp4", "video/x-matroska", "video/quicktime"]
      folderName = "walls/videos"
    } else if (folder.includes("walls/files")) {
      maxSize = 5 * 1024 * 1024 // 5MB
      allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "text/plain"]
      folderName = "walls/files"
    } else if (folder === "logo" || folder.includes("organizations/logos")) {
      maxSize = 5 * 1024 * 1024 // 5MB
      allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"]
      folderName = "organizations/logos"
    } else if (folder.includes("organizations/assets")) {
      maxSize = 10 * 1024 * 1024 // 10MB
      allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp", "application/pdf"]
      folderName = "organizations/assets"
    }

    console.log("Upload API - Validation rules:", {
      folderName,
      maxSize: `${maxSize / (1024 * 1024)}MB`,
      allowedTypes,
      actualFileSize: `${file.size / (1024 * 1024)}MB`,
      actualFileType: file.type
    })

    // Check file size
    if (file.size > maxSize) {
      console.error("Upload API - File too large:", {
        fileSize: file.size,
        maxSize,
        difference: file.size - maxSize
      })
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      console.error("Upload API - Invalid file type:", {
        fileType: file.type,
        allowedTypes
      })
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}` 
      }, { status: 400 })
    }

    console.log("Upload API - File validation passed, proceeding with upload")

    try {
      // Convert File to Buffer and get content type
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = file.type || "application/octet-stream"
      
      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const key = `${folder}/${timestamp}-${sanitizedName}`
      
      console.log("Upload API - Prepared upload data:", {
        key,
        contentType,
        bufferSize: buffer.length
      })
      
      const result = await uploadFileToR2(buffer, key, contentType)
      console.log("Upload API - Upload successful:", result)
      
      return NextResponse.json({ 
        success: true, 
        url: result.url,
        key: result.key,
        message: "File uploaded successfully"
      })
    } catch (uploadError) {
      console.error("Upload API - R2 upload failed:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload file to storage",
        details: uploadError instanceof Error ? uploadError.message : "Unknown upload error"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Upload API - Unexpected error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}