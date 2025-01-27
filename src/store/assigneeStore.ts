import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AssigneePreferences {
  id: string;
  user_id: string;
  max_tasks: number;
  preferred_task_types: string[];
  availability_status: 'available' | 'busy' | 'away';
}

interface WorkloadTracking {
  id: string;
  user_id: string;
  task_count: number;
  last_assignment: string;
}

interface AssigneeState {
  preferences: AssigneePreferences | null;
  workload: WorkloadTracking | null;
  loading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<AssigneePreferences>) => Promise<void>;
  updateAvailability: (status: 'available' | 'busy' | 'away') => Promise<void>;
  fetchWorkload: (userId: string) => Promise<void>;
}

export const useAssigneeStore = create<AssigneeState>((set) => ({
  preferences: null,
  workload: null,
  loading: false,
  error: null,

  fetchPreferences: async () => {
    try {
      set({ loading: true, error: null });
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assignee_preferences')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (error) throw error;

      set({ preferences: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updatePreferences: async (preferences) => {
    try {
      set({ loading: true, error: null });
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assignee_preferences')
        .upsert({
          user_id: userData.user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set({ preferences: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateAvailability: async (status) => {
    try {
      set({ loading: true, error: null });
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assignee_preferences')
        .upsert({
          user_id: userData.user.id,
          availability_status: status,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set({ preferences: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchWorkload: async (userId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('workload_tracking')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      set({ workload: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));