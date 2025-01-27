import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  team_id: string;
  assignee_id: string | null;
  creator_id: string;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  fetchTasks: (teamId: string) => Promise<void>;
  createSubtask: (parentId: string, task: Partial<Task>) => Promise<void>;
  submitForApproval: (taskId: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  rejectTask: (taskId: string, feedback: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  createTask: async (task) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: [...state.tasks, data],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateTask: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? data : task)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTasks: async (teamId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ tasks: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createSubtask: async (parentId, task) => {
    try {
      set({ loading: true, error: null });
      const parentTask = get().tasks.find((t) => t.id === parentId);
      if (!parentTask) throw new Error('Parent task not found');

      const subtask = {
        ...task,
        parent_task_id: parentId,
        team_id: parentTask.team_id,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([subtask])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: [...state.tasks, data],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  submitForApproval: async (taskId) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'review' })
        .eq('id', taskId);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'review' } : task
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  approveTask: async (taskId) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'completed' } : task
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  rejectTask: async (taskId, feedback) => {
    try {
      set({ loading: true, error: null });
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId);

      if (taskError) throw taskError;

      const { error: commentError } = await supabase
        .from('task_comments')
        .insert([{ task_id: taskId, content: `Rejection feedback: ${feedback}` }]);

      if (commentError) throw commentError;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'in_progress' } : task
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));