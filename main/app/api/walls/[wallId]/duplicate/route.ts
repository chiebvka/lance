import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { uploadFileToR2, deleteFileFromR2 } from '@/lib/r2'
import { ratelimit } from '@/utils/rateLimit'

type Block = {
  id?: string
  type: string
  props?: any
}

function inferFolderFromBlock(blockType: string): string {
  if (blockType === 'image') return 'walls/images'
  if (blockType === 'video') return 'walls/videos'
  return 'walls/files'
}

async function downloadAsBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch source file: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  return { buffer: Buffer.from(arrayBuffer), contentType }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  const { wallId } = await params
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1'
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.', limit, reset, remaining }, { status: 429 })
    }

    // Get organization from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId, email')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Load source wall
    const { data: source, error: srcErr } = await supabase
      .from('walls')
      .select('*')
      .eq('id', wallId)
      .eq('organizationId', profile.organizationId)
      .single()

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 })
    }

    // Prepare content blocks
    const parsedContent = typeof source.content === 'string' ? JSON.parse(source.content) : (source.content || { version: 1, blocks: [] })
    const blocks: Block[] = parsedContent?.blocks || []

    const uploadedKeys: string[] = []
    const clonedBlocks: Block[] = []

    for (const block of blocks) {
      if (['image', 'video', 'file'].includes(block.type) && block?.props?.fileId) {
        const fileUrl: string = block.props.fileId || block.props.cloudflareUrl
        // Download
        const { buffer, contentType } = await downloadAsBuffer(fileUrl)
        // Upload
        const folder = inferFolderFromBlock(block.type)
        const fileName = block.props?.fileName || `${block.type}-${Date.now()}`
        const key = `${folder}/${Date.now()}-${fileName.toString().replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const { url, key: savedKey } = await uploadFileToR2(buffer, key, contentType)
        uploadedKeys.push(savedKey)
        clonedBlocks.push({
          ...block,
          props: {
            ...block.props,
            fileId: url,
            cloudflareUrl: url,
          }
        })
      } else {
        clonedBlocks.push(block)
      }
    }

    const newContent = { ...(parsedContent || { version: 1 }), blocks: clonedBlocks }

    // Load org for latest org fields
    const { data: organization } = await supabase
      .from('organization')
      .select('id, name, email, logoUrl')
      .eq('id', profile.organizationId)
      .single()

    // Build insert
    const insertPayload = {
      name: source.name ? `${source.name} (Copy)` : 'Wall (Copy)',
      description: source.description || null,
      notes: source.notes || null,
      content: newContent,
      customerId: source.customerId || null,
      projectId: source.projectId || null,
      slug: null,
      state: 'draft',
      type: source.type || 'public',
      token: null,
      private: (source.type || 'public') === 'private',
      createdBy: user.id,
      organizationId: profile.organizationId,
      organizationName: organization?.name || source.organizationName || null,
      organizationLogo: organization?.logoUrl || source.organizationLogo || null,
      organizationEmail: organization?.email || source.organizationEmail || profile.email,
      recepientEmail: null,
      recepientName: null,
      created_at: new Date().toISOString(),
      issueDate: null,
    }

    const { data: newWall, error: insErr } = await supabase
      .from('walls')
      .insert(insertPayload)
      .select()
      .single()

    if (insErr || !newWall) {
      // rollback uploaded files
      await Promise.all(
        uploadedKeys.map(async (key) => {
          try { await deleteFileFromR2(key) } catch {}
        })
      )
      return NextResponse.json({ error: 'Failed to duplicate wall' }, { status: 500 })
    }

    return NextResponse.json({ success: true, wall: newWall })
  } catch (error) {
    console.error('Duplicate wall error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


