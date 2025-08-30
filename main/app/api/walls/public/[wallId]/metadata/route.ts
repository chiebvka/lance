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

    let query = supabase
      .from('walls')
      .select(`
        name,
        description,
        organizationName,
        organization:organizationId (name),
        private,
        token
      `)
      .eq('id', wallId);

    // If token is provided, allow access to private walls regardless of state
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

    const metadata = {
      name: wall.name,
      description: wall.description,
      // Prioritize organization relation data over fallback
      organizationName: (wall as any).organization?.name || wall.organizationName,
    };

    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error('Public wall metadata fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
