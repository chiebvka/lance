import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import React from 'react'

import { redirect } from 'next/navigation';
import WallEditor from './_components/wall-editor';

type Props = {
  params: Promise<{ wallId: string }>
}

export default async function page({ params }: Props) {
  const { wallId } = await params;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  // Get user's profile to find their organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organizationId')
    .eq('profile_id', user.id)
    .single();

  if (profileError || !profile?.organizationId) {
    return redirect('/error');
  }

  // Get wall with all related data
  const { data: wall, error: wallError } = await supabase
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
      project:projectId (id, name),
      customer:customerId (id, name),
      org:organizationId (id, name, email, logoUrl)
    `)
    .eq('id', wallId)
    .eq('organizationId', profile.organizationId)
    .single();

  if (wallError || !wall) {
    return redirect('/error');
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
    organizationId: profile.organizationId,
    projectNameFromProject: (wall as any).project?.[0]?.name || null,
    organizationName: wall.organizationName,
    organizationLogo: wall.organizationLogo,
    organizationEmail: wall.organizationEmail,
    organizationLogoUrl: (wall as any).org?.[0]?.logoUrl || null,
    organizationNameFromOrg: (wall as any).org?.[0]?.name || null,
    organizationEmailFromOrg: (wall as any).org?.[0]?.email || null,
    recepientName: wall.recepientName,
    recepientEmail: wall.recepientEmail,
  };

  return (
    <div>
      <WallEditor initialWall={processedWall} />
    </div>
  )
}