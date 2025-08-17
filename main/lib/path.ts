import { Path } from '@/hooks/paths/use-paths';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getOrganizationPaths(supabase: SupabaseClient): Promise<Path[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }


  // Get user's profile to find their organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organizationId')
    .eq('profile_id', user.id)
    .single();
    
    if (profileError || !profile?.organizationId) {
        throw new Error('Organization not found');
    }

    // Get paths for the organization with all related data
    const { data: paths, error: pathsError } = await supabase
    .from('paths')
    .select(`
        id,
        name,
        description,
        state,
        token,
        type,
        created_at,
        updatedAt,
        recepientName,
        recepientEmail,
        content,
        private,
        organizationName,
        organizationLogo,
        organizationEmail,
        customer:customerId (id, name),
        org:organizationId (id, name, email, logoUrl)
    `)
    .eq('organizationId', profile.organizationId)
    .order('created_at', { ascending: false });

    if (pathsError) {
        throw pathsError;
    }

    // Process receipts to ensure JSON fields are properly serialized and flatten relations
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

    const processedPaths = (paths || []).map((path: any): Path => ({
        id: path.id,
        name: path.name,
        updatedAt: path.updatedAt,
        customerId: path.customerId,
        description: path.description,
        state: path.state,
        token: path.token,
        type: path.type,
        created_at: path.created_at,
        content: processJsonField(path.content),
        organizationId: path.organizationId,
        organizationName: path.organizationName,
        organizationLogo: path.organizationLogo,
        organizationEmail: path.organizationEmail,
        organizationLogoUrl: path.org?.[0]?.logoUrl || null,
        organizationNameFromOrg: path.org?.[0]?.name || null,
        organizationEmailFromOrg: path.org?.[0]?.email || null,
        recepientName: path.recepientName,
        recepientEmail: path.recepientEmail,
        createdBy: null,
        private: path.private
    }))

    return processedPaths;
}