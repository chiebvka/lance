import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const { pathId } = params
  const token = req.nextUrl.searchParams.get('token')
  const supabase = await createClient()

  try {
    let query = supabase
      .from('paths')
      .select('name, description, organizationName, private, token')
      .eq('id', pathId)

    // If token is provided, allow access to private paths regardless of state
    if (token) {
      query = query.eq('token', token)
    } else {
      // If no token, only allow public paths
      query = query.eq('private', false)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Metadata not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, metadata: data })
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
