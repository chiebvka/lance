import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationWalls } from "@/lib/wall";

export async function GET(req: NextRequest) {
    try {
        
        const supabase = await createClient();
        const walls = await getOrganizationWalls(supabase);
        return NextResponse.json({ success: true, walls });
    } catch (error) {
        console.error('Walls fetch error:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error instanceof Error && error.message === 'Organization not found') {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}