import type { SupabaseClient } from '@supabase/supabase-js';
import { Wall } from '@/hooks/walls/use-walls';

export async function getOrganizationWalls(supabase: SupabaseClient): Promise<Wall[]> {
      // Check authentication
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

    // Get walls for the organization with all related data
    const { data: walls, error: wallsError } = await supabase
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
        created_at,
        createdBy,
        recepientName,
        recepientEmail,
        notes,
        content,
        private,
        organizationName,
        organizationLogo,
        organizationEmail,
        project:projectId (id, name),
        customer:customerId (id, name),
        org:organizationId (id, name, email, logoUrl)
    `)
    .eq('organizationId', profile.organizationId)
    .order('created_at', { ascending: false });

    if (wallsError) {
        throw wallsError;
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

    const processedWalls = (walls || []).map((wall: any): Wall => ({
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
        projectNameFromProject: wall.project?.[0]?.name || null,
        organizationName: wall.organizationName,
        organizationLogo: wall.organizationLogo,
        organizationEmail: wall.organizationEmail,
        organizationLogoUrl: wall.org?.[0]?.logoUrl || null,
        organizationNameFromOrg: wall.org?.[0]?.name || null,
        organizationEmailFromOrg: wall.org?.[0]?.email || null,
        recepientName: wall.recepientName,
        recepientEmail: wall.recepientEmail,
    }));

    return processedWalls;
}