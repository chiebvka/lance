import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/utils/rateLimit';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

export type SearchItem = {
    id: string;
    name: string;
    type?: string;
    url: string;
    relatedCategory?: string;
    customerId?: string;
    projectId?: string;
    [key: string]: any;
  };
  
  export type SearchCategory = {
    title: string;
    items: SearchItem[];
  };
  

// export type SearchCategory = {
//     title: string;
//     items: {
//       id: string;
//       name: string;
//       type?: string;
//       url: string;
//       relatedCategory?: string;
//       [key: string]: any;
//     }[];
//   };

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by IP
        // const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
        // const { success } = await ratelimit.limit(ip);
        // if (!success) {
        //     return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        // }

        // Profile/org check
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organizationId')
            .eq('profile_id', user.id)
            .single();
        if (profileError || !profile?.organizationId) {
            return NextResponse.json({ error: 'You must be part of an organization to search.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('searchQuery')?.trim();

        const cacheKey = searchQuery ? `search_${searchQuery}_${profile.organizationId}` : `recent_${profile.organizationId}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            return NextResponse.json(cachedResult);
        }

        const userKey = user.id;
        const orgId = profile.organizationId as string;
        const q = (searchQuery ?? '').trim();
        
        // Better key (user+org+query head) so it scales across orgs
        const rateKey = `${userKey}:${orgId}:${q.slice(0, 32) || 'recent'}`;
        
        // Only enforce in prod, and only for real queries (≥3 chars)
        // const isProd = process.env.NODE_ENV === 'production';
        const isProd = process.env.NODE_ENV === 'development';
        if (isProd && q.length >= 3) {
          const { success } = await ratelimit.limit(rateKey);
          if (!success) {
            return NextResponse.json({ error: 'Too many requests. Slow down a bit.' }, { status: 429 });
          }
        }

        let results: SearchCategory[] = [];

        if (searchQuery && searchQuery !== '') {
            const { data, error } = await supabase.rpc('smart_universal_search', { search_term: searchQuery });
            if (error) throw error;
            results = formatResults(data);
        } else {
            const { data, error } = await supabase.rpc('get_recent_items');
            if (error) throw error;
            results = formatResults(data);
        }

        cache.set(cacheKey, results);
        return NextResponse.json(results, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}


/**
 * Helper function to group and format results with updated URL structure.
 */

function formatResults(data: any[] | null): SearchCategory[] {
    if (!data) return [];
  
    const grouped = data.reduce((acc, row) => {
      const categoryTitle = row.category.charAt(0).toUpperCase() + row.category.slice(1);
      if (!acc[categoryTitle]) {
        acc[categoryTitle] = {
          title: categoryTitle,
          items: [],
        };
      }
      
      // Build clean URLs without extra parameters
      let url = '/protected/';
      let idParam = '';
      
      switch (categoryTitle) {
        case 'Projects':
          url += 'projects';
          idParam = `projectId=${row.id}`;
          break;
        case 'Customers':
          url += 'customers';
          idParam = `customerId=${row.id}`;
          break;
        case 'Invoices':
          url += 'invoices';
          idParam = `invoiceId=${row.id}`;
          break;
        case 'Feedbacks':
          url += 'feedback';
          idParam = `feedbackId=${row.id}`;
          break;
        case 'Receipts':
          url += 'receipts';
          idParam = `receiptId=${row.id}`;
          break;
        case 'Walls':
          url += 'walls';
          idParam = `wallId=${row.id}`;
          break;
        case 'Paths':
          url += 'paths';
          idParam = `pathId=${row.id}`;
          break;
        default:
          url += categoryTitle.toLowerCase();
          idParam = `${categoryTitle.toLowerCase()}Id=${row.id}`;
      }
      
      url += `?${idParam}`;
  
      acc[categoryTitle].items.push({
        id: row.id,
        name: row.name || 'Unnamed',
        type: row.type,
        url,
        relatedCategory: row.related_category,
        customerId: row.customerId,
        projectId: row.projectId,
      });
      return acc;
    }, {} as { [key: string]: SearchCategory });
  
    return Object.values(grouped);
  }


  
// function formatResults(data: any[] | null): SearchCategory[] {
//     if (!data) return [];
  
//     const grouped = data.reduce((acc, row) => {
//       const categoryTitle = row.category.charAt(0).toUpperCase() + row.category.slice(1);
//       if (!acc[categoryTitle]) {
//         acc[categoryTitle] = {
//           title: categoryTitle,
//           items: [],
//         };
//       }
//       let urlPrefix = '/protected/';
//       let idParam = `${categoryTitle.toLowerCase()}Id`;
//       if (categoryTitle === 'Invoices') urlPrefix += 'invoice';
//       else if (categoryTitle === 'Feedbacks') urlPrefix += 'feedback';
//       else urlPrefix += categoryTitle.toLowerCase();
  
//       acc[categoryTitle].items.push({
//         id: row.id,
//         name: row.name || 'Unnamed',
//         type: row.type,
//         url: `${urlPrefix}?${idParam}=${row.id}`,
//         relatedCategory: row.related_category,
//       });
//       return acc;
//     }, {} as { [key: string]: SearchCategory });
  
//     return Object.values(grouped);
//   }