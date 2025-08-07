import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ratelimit } from '@/utils/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has an organization first
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    let query = supabase
      .from('notifications')
      .select('*');

    if (userProfile?.organizationId) {
      // User has organization - get notifications for their organization
      query = query.eq('organizationId', userProfile.organizationId);
    } else {
      // User doesn't have organization yet - only get personal notifications
      query = query.eq('createdBy', user.id);
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out expired notifications and separate active from archived
    const now = new Date();
    const validNotifications = (notifications || []).filter(notification => {
      if (!notification.expiresAt) return true;
      return new Date(notification.expiresAt) > now;
    });

    const active = validNotifications.filter(n => n.state === 'active');
    const archived = validNotifications.filter(n => n.state === 'archived');

    return NextResponse.json({ 
      notifications: active,
      archivedNotifications: archived,
      unreadCount: active.filter(n => !n.isRead).length
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔍 [Backend] PATCH request received');
    
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('🔍 [Backend] User authentication failed:', userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🔍 [Backend] User authenticated:', user.id);

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      console.log('🔍 [Backend] Rate limit exceeded');
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          limit,
          reset,
          remaining
        }, 
        { status: 429 }
      );
    }

    const body = await request.json();
    console.log('🔍 [Backend] Request body:', body);
    
    const { action, notificationId, notificationSettings } = body;

    if (action === 'mark_read' && notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ "isRead": true })
        .eq('id', notificationId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });

    } else if (action === 'mark_all_read') {
      // Check if user has an organization
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organizationId')
        .eq('profile_id', user.id)
        .single();

      let updateQuery = supabase
        .from('notifications')
        .update({ "isRead": true });

      if (userProfile?.organizationId) {
        // User has organization - mark org notifications as read
        updateQuery = updateQuery.eq('organizationId', userProfile.organizationId);
      } else {
        // User doesn't have organization yet - only mark personal notifications as read
        updateQuery = updateQuery.eq('userId', user.id);
      }

      const { error } = await updateQuery.eq('"isRead"', false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });

    } else if (action === 'archive' && notificationId) {
      // Archive notification (change state to archived)
      const { error } = await supabase
        .from('notifications')
        .update({ state: 'archived' })
        .eq('id', notificationId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });

    } else if (action === 'update_notification_settings' && notificationSettings) {
      console.log('🔍 [Backend] Processing notification settings update');
      console.log('🔍 [Backend] Notification settings received:', notificationSettings);
      
      // Update organization notification settings
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('organizationId, organizationRole')
        .eq('profile_id', user.id)
        .single();

      console.log('🔍 [Backend] User profile:', userProfile);
      console.log('🔍 [Backend] Profile error:', profileError);

      if (profileError || !userProfile?.organizationId) {
        console.log('🔍 [Backend] Organization not found for user');
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // Only organization creators or admins can update notification settings
      if (userProfile.organizationRole !== 'creator' && userProfile.organizationRole !== 'admin') {
        console.log('🔍 [Backend] User not authorized to update settings. Role:', userProfile.organizationRole);
        return NextResponse.json({ error: "Unauthorized to update notification settings" }, { status: 403 });
      }

      // Only update the specific column that was changed
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (notificationSettings.invoiceNotifications !== undefined) {
        updateData.invoiceNotifications = notificationSettings.invoiceNotifications;
      }
      if (notificationSettings.projectNotifications !== undefined) {
        updateData.projectNotifications = notificationSettings.projectNotifications;
      }
      if (notificationSettings.feedbackNotifications !== undefined) {
        updateData.feedbackNotifications = notificationSettings.feedbackNotifications;
      }
      
      console.log('🔍 [Backend] Update data to be sent to database:', updateData);
      console.log('🔍 [Backend] Organization ID:', userProfile.organizationId);

      const { data: updateResult, error: updateError } = await supabase
        .from('organization')
        .update(updateData)
        .eq('id', userProfile.organizationId)
        .select();

      console.log('🔍 [Backend] Update result:', updateResult);
      console.log('🔍 [Backend] Update error:', updateError);

      if (updateError) {
        console.error('🔍 [Backend] Database update failed:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      console.log('🔍 [Backend] Notification settings updated successfully');
      return NextResponse.json({ success: true });

    } else {
      console.log('🔍 [Backend] Invalid action:', action);
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("🔍 [Backend] Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }

    // Check if user has an organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    let archiveQuery = supabase
      .from('notifications')
      .update({ state: 'archived' })
      .eq('id', notificationId);

    if (userProfile?.organizationId) {
      // User has organization - allow archiving org notifications
      archiveQuery = archiveQuery.eq('organizationId', userProfile.organizationId);
    } else {
      // User doesn't have organization yet - only allow archiving personal notifications
      archiveQuery = archiveQuery.eq('userId', user.id);
    }

    const { error } = await archiveQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error archiving notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}