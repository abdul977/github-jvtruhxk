import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { synthesizeIdea } from '../lib/gemini';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
  tags?: string[];
}

interface Note {
  id: string;
  folder_id: string;
  content: string;
  type: 'text' | 'recording';
  file_url?: string;
  transcription?: string;
  created_at: string;
  tags?: string[];
  version?: number;
}

interface SynthesizedIdea {
  id: string;
  folder_id: string;
  content: string;
  created_at: string;
  summary: string;
  key_insights: string[];
  action_items: string[];
}

interface Store {
  folders: Folder[];
  currentFolder: Folder | null;
  notes: Note[];
  loading: boolean;
  darkMode: boolean;
  synthesizedIdeas: Record<string, SynthesizedIdea>;
  searchQuery: string;
  
  setDarkMode: (isDark: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, description: string, tags?: string[]) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  
  setCurrentFolder: (folder: Folder | null) => void;
  
  fetchNotes: (folderId: string) => Promise<void>;
  addNote: (folderId: string, content: string, type: 'text' | 'recording', fileUrl?: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  synthesizeFolder: (folderId: string) => Promise<void>;
  exportFolder: (folderId: string, format: 'pdf' | 'docx' | 'html') => Promise<string>;
}

export const useStore = create<Store>((set, get) => ({
  folders: [],
  currentFolder: null,
  notes: [],
  loading: false,
  darkMode: false,
  synthesizedIdeas: {},
  searchQuery: '',

  setDarkMode: (isDark) => set({ darkMode: isDark }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchFolders: async () => {
    try {
      const { data: folders, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ folders: folders || [] });
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  },

  createFolder: async (name, description, tags = []) => {
    try {
      const { data: folder, error } = await supabase
        .from('folders')
        .insert([{ name, description, tags }])
        .select()
        .single();

      if (error) throw error;
      if (folder) {
        set(state => ({ folders: [folder, ...state.folders] }));
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  },

  updateFolder: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        folders: state.folders.map(f => 
          f.id === id ? { ...f, ...updates } : f
        ),
        currentFolder: state.currentFolder?.id === id 
          ? { ...state.currentFolder, ...updates }
          : state.currentFolder
      }));
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  },

  deleteFolder: async (id) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        folders: state.folders.filter(f => f.id !== id),
        currentFolder: state.currentFolder?.id === id ? null : state.currentFolder
      }));
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  },

  setCurrentFolder: (folder) => {
    set({ currentFolder: folder });
    if (folder) {
      get().fetchNotes(folder.id);
    }
  },

  fetchNotes: async (folderId) => {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ notes: notes || [] });
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  },

  addNote: async (folderId, content, type, fileUrl) => {
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .insert([{
          folder_id: folderId,
          content,
          type,
          file_url: fileUrl,
          version: 1
        }])
        .select()
        .single();

      if (error) throw error;
      if (note) {
        set(state => ({ notes: [note, ...state.notes] }));
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  },

  updateNote: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          ...updates,
          version: get().notes.find(n => n.id === id)?.version || 0 + 1
        })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, ...updates } : n
        )
      }));
    } catch (error) {
      console.error('Error updating note:', error);
    }
  },

  deleteNote: async (id) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        notes: state.notes.filter(n => n.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  },

  synthesizeFolder: async (folderId) => {
    set({ loading: true });
    try {
      const notes = get().notes;
      const synthesis = await synthesizeIdea(notes);
      
      const { data: synthesizedIdea, error } = await supabase
        .from('synthesized_ideas')
        .insert([{
          folder_id: folderId,
          content: synthesis,
          summary: '',  // Will be populated by Gemini
          key_insights: [],
          action_items: []
        }])
        .select()
        .single();

      if (error) throw error;

      if (synthesizedIdea) {
        set(state => ({
          synthesizedIdeas: {
            ...state.synthesizedIdeas,
            [folderId]: synthesizedIdea
          }
        }));
      }
    } catch (error) {
      console.error('Error synthesizing idea:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  exportFolder: async (folderId, format) => {
    try {
      const folder = get().folders.find(f => f.id === folderId);
      const notes = get().notes;
      const synthesizedIdea = get().synthesizedIdeas[folderId];

      // Implementation for export functionality would go here
      // This is a placeholder that returns a dummy URL
      return `https://example.com/exports/${folderId}.${format}`;
    } catch (error) {
      console.error('Error exporting folder:', error);
      throw error;
    }
  }
}));