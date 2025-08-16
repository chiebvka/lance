import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { baseUrl } from "@/utils/universal";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    // ACL: "public-read", // ❌ DO NOT use with R2 – not supported
  });

  await r2.send(command);

  // Use custom domain if available, otherwise fallback to R2 endpoint
  const customDomain = process.env.R2_CUSTOM_DOMAIN;
  const publicUrl = customDomain 
    ? `https://${customDomain}` 
    : process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`;
  
  return {
    url: `${publicUrl}/${key}`,
    key: key // Return the key as well
  };
}

// Determine if a file should be publicly accessible based on its path
export function isPublicFile(key: string): boolean {
  const publicPrefixes = [
    'organizations/logos/',
    'organizations/assets/',
  ];
  
  return publicPrefixes.some(prefix => key.startsWith(prefix));
}

// Get the appropriate URL for a file (public or signed)
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const customDomain = process.env.R2_CUSTOM_DOMAIN;
  const publicUrl = customDomain 
    ? `https://${customDomain}` 
    : process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`;

  // If it's a public file, return direct URL
  if (isPublicFile(key)) {
    return `${publicUrl}/${key}`;
  }

  // For private files, generate signed URL
  try {
    return await generateSignedUrl(key, expiresIn);
  } catch (error) {
    console.error(`Failed to generate signed URL for ${key}, falling back to public URL:`, error);
    return `${publicUrl}/${key}`;
  }
}

export async function generateSignedUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(r2, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error(`Failed to generate signed URL for ${key}:`, error);
    throw error;
  }
}

export async function generateSignedUrls(keys: string[], expiresIn: number = 3600) {
  const promises = keys.map(key => generateSignedUrl(key, expiresIn));
  
  try {
    const signedUrls = await Promise.all(promises);
    const urlMap: { [key: string]: string } = {};
    keys.forEach((key, index) => {
      urlMap[key] = signedUrls[index];
    });
    return urlMap;
  } catch (error) {
    console.error('Failed to generate signed URLs:', error);
    throw error;
  }
}

export async function deleteFileFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  });

  try {
    await r2.send(command);
    console.log(`Successfully deleted ${key} from R2.`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete ${key} from R2:`, error);
    throw error; // Re-throw to be handled by the API route
  }
}