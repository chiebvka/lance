import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationReceipts } from '@/lib/receipt'; // Import the shared function

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const receipts = await getOrganizationReceipts(supabase);
    return NextResponse.json({ success: true, receipts });
  } catch (error) {
    console.error('Receipts fetch error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Organization not found') {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Other methods (POST, etc.) unchanged if present