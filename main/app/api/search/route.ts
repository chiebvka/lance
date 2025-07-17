import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
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
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('searchQuery');

        const cacheKey = searchQuery ? `search_${searchQuery}` : 'recent_default';
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            return Response.json(cachedResult);
        }

        let results: SearchCategory[] = [];

        if (searchQuery && searchQuery.trim() !== '') {
            const { data, error } = await supabase.rpc('smart_universal_search', { search_term: searchQuery });
            if (error) throw error;
            results = formatResults(data);
        } else {
            const { data, error } = await supabase.rpc('get_recent_items');
            if (error) throw error;
            results = formatResults(data);
        }

        cache.set(cacheKey, results);
        return Response.json(results, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return Response.json(
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