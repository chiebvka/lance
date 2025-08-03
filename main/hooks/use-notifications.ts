"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  message: string | null;
  type: 'info' | 'warning' | 'success' | 'error' | 'trial_reminder';
  isRead: boolean;
  actionUrl: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  expiresAt: string | null;
  status: 'active' | 'archived';
}

export interface OrganizationNotificationSettings {
  invoiceNotifications: boolean;
  projectNotifications: boolean;
  feedbackNotifications: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  archivedNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setArchivedNotifications([]);
        return;
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
        // User has organization - get both personal and org notifications
        query = query.or(`createdBy.eq.${user.id},organizationId.eq.${userProfile.organizationId}`);
      } else {
        // User doesn't have organization yet - only get personal notifications
        query = query.eq('createdBy', user.id);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .limit(15);

      if (fetchError) {
        throw fetchError;
      }

      // Filter out expired notifications and separate active from archived
      const now = new Date();
      const validNotifications = (data || []).filter(notification => {
        if (!notification.expiresAt) return true;
        return new Date(notification.expiresAt) > now;
      });

      const active = validNotifications.filter(n => n.status === 'active');
      const archived = validNotifications.filter(n => n.status === 'archived');

      setNotifications(active);
      setArchivedNotifications(archived);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ "isRead": true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        // User has organization - mark both personal and org notifications as read
        updateQuery = updateQuery.or(`createdBy.eq.${user.id},organizationId.eq.${userProfile.organizationId}`);
      } else {
        // User doesn't have organization yet - only mark personal notifications as read
        updateQuery = updateQuery.eq('createdBy', user.id);
      }

      const { error } = await updateQuery.eq('"isRead"', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('id', notificationId);

      if (error) throw error;

      // Move notification from active to archived
      const notificationToArchive = notifications.find(n => n.id === notificationId);
      if (notificationToArchive) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setArchivedNotifications(prev => [notificationToArchive, ...prev]);
      }
    } catch (err) {
      console.error('Error archiving notification:', err);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Calculate unread count (only from active notifications)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          // Refresh notifications when changes occur
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    notifications,
    archivedNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refreshNotifications,
  };
}

// Hook for managing organization notification settings
export function useOrganizationNotificationSettings() {
  const queryClient = useQueryClient();

  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (settings: OrganizationNotificationSettings) => {
      const response = await axios.patch('/api/notifications', {
        action: 'update_notification_settings',
        notificationSettings: settings
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Notification settings updated successfully!", {
        description: "Your email notification preferences have been saved.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating notification settings:", error);
      let errorMessage = "Failed to update notification settings. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Update failed", { description: errorMessage });
    },
  });

  return {
    updateNotificationSettings: updateNotificationSettingsMutation.mutate,
    isUpdating: updateNotificationSettingsMutation.isPending,
  };
}