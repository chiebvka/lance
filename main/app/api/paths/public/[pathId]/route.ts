import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getOrganizationPaths } from '@/lib/path'

export async function GET(
  req: NextRequest,
  { params }: { params: { pathId: string } }
) {
  const { pathId } = params
  const token = req.nextUrl.searchParams.get('token')
  const supabase = await createClient()

  try {
    const { data: path, error } = await supabase
      .from('paths')
      .select(`
        *,
        organization:organizationId (
          name,
          logoUrl,
          email
        )
      `)
      .eq('id', pathId)
      .single()

    if (error || !path) {
      return NextResponse.json({ success: false, error: 'Path not found' }, { status: 404 })
    }

    if (path.private && path.token !== token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const processedPath = {
      ...path,
      organizationNameFromOrg: path.organization?.name,
      organizationLogoUrl: path.organization?.logoUrl,
      organizationEmailFromOrg: path.organization?.email,
    }

    return NextResponse.json({ success: true, path: processedPath })

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
