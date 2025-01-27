import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

interface TeamState {
  teams: Team[];
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  createTeam: (name: string, description?: string) => Promise<void>;
  fetchTeams: () => Promise<void>;
  fetchTeamMembers: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, email: string, role: 'admin' | 'member') => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  members: [],
  loading: false,
  error: null,

  createTeam: async (name, description) => {
    try {
      set({ loading: true, error: null });
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('teams')
        .insert([{ name, description, owner_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: data.id,
          user_id: userData.user.id,
          role: 'admin'
        }]);

      if (memberError) throw memberError;

      set((state) => ({
        teams: [...state.teams, data],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchTeams: async () => {
    try {
      set({ loading: true, error: null });
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members!inner(*)')
        .or(`owner_id.eq.${userData.user.id},team_members.user_id.eq.${userData.user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ teams: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTeamMembers: async (teamId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('team_members')
        .select('*, profiles:auth.users(email, full_name)')
        .eq('team_id', teamId);

      if (error) throw error;

      set({ members: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTeamMember: async (teamId, email, role) => {
    try {
      set({ loading: true, error: null });
      
      // First, get the user ID from the email
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      const { error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: userData.id,
          role
        }]);

      if (error) throw error;

      // Create notification for the new team member
      await supabase.from('notifications').insert([{
        user_id: userData.id,
        type: 'team_invite',
        content: `You have been added to a new team as ${role}`,
      }]);

      await get().fetchTeamMembers(teamId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  removeTeamMember: async (teamId, userId) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => ({
        members: state.members.filter(
          (member) => !(member.team_id === teamId && member.user_id === userId)
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateMemberRole: async (teamId, userId, role) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => ({
        members: state.members.map((member) =>
          member.team_id === teamId && member.user_id === userId
            ? { ...member, role }
            : member
        ),
        loading: false,
      }));

      // Create notification for role update
      await supabase.from('notifications').insert([{
        user_id: userId,
        type: 'role_update',
        content: `Your role has been updated to ${role}`,
      }]);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTeam: async (teamId, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        teams: state.teams.map((team) => (team.id === teamId ? data : team)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTeam: async (teamId) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      set((state) => ({
        teams: state.teams.filter((team) => team.id !== teamId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));