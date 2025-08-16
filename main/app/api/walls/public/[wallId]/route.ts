import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallId: string }> }
) {
  const { wallId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  try {
    const supabase = await createClient();

    // Build query based on whether token is provided
    let query = supabase
      .from('walls')
      .select(`
        id,
        name,
        description,
        state,
        slug,
        token,
        type,
        issueDate,
        created_at,
        updatedAt,
        createdBy,
        recepientName,
        recepientEmail,
        notes,
        content,
        private,
        organizationName,
        organizationLogo,
        organizationEmail,
        customerId,
        projectId,
        organizationId,
        project:projectId (id, name),
        customer:customerId (id, name),
        organization:organizationId (id, name, email, logoUrl)
      `)
      .eq('id', wallId)
      .eq('state', 'published');

    // If token is provided, allow private walls
    if (token) {
      query = query.eq('token', token);
    } else {
      // If no token, only allow public walls
      query = query.eq('private', false);
    }

    const { data: wall, error: wallError } = await query.single();

    if (wallError || !wall) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    // Process JSON fields
    const processJsonField = (field: any) => {
      if (typeof field === 'string' && (field.trim().startsWith('{') || field.trim().startsWith('['))) {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.warn('Failed to parse JSON field:', field);
          return field;
        }
      }
      return field;
    };

    const processedWall = {
      id: wall.id,
      name: wall.name,
      description: wall.description,
      state: wall.state,
      slug: wall.slug,
      token: wall.token,
      type: wall.type,
      issueDate: wall.issueDate,
      updatedAt: wall.updatedAt,
      created_at: wall.created_at,
      notes: wall.notes,
      content: processJsonField(wall.content),
      private: wall.private,
      customerId: wall.customerId,
      projectId: wall.projectId || null,
      organizationId: wall.organizationId,
      projectNameFromProject: (wall as any).project?.[0]?.name || null,
      organizationName: wall.organizationName,
      organizationLogo: wall.organizationLogo,
      organizationEmail: wall.organizationEmail,
      // Prioritize organization relation data over fallback fields
      organizationLogoUrl: (wall as any).organization?.logoUrl || null,
      organizationNameFromOrg: (wall as any).organization?.name || null,
      organizationEmailFromOrg: (wall as any).organization?.email || null,
      recepientName: wall.recepientName,
      recepientEmail: wall.recepientEmail,
    };

    return NextResponse.json({ success: true, wall: processedWall });
  } catch (error) {
    console.error('Public wall fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
