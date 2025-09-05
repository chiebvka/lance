export const baseUrl = 
  process.env.NEXT_PUBLIC_DOMAIN || 
  process.env.DOMAIN || 
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
  "http://localhost:3000";