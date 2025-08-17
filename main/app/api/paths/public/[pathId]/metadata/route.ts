import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const { pathId } = params
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('paths')
      .select('name, description, organizationName')
      .eq('id', pathId)
      .eq('state', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Metadata not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, metadata: data })
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
