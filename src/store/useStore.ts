import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { synthesizeIdea } from '../lib/gemini';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Note {
  id: string;
  folder_id: string;
  content: string;
  type: 'text' | 'recording';
  file_url?: string;
  transcription?: string;
  created_at: string;
}

interface Store {
  folders: Folder[];
  currentFolder: Folder | null;
  notes: Note[];
  loading: boolean;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, description: string) => Promise<void>;
  setCurrentFolder: (folder: Folder | null) => void;
  fetchNotes: (folderId: string) => Promise<void>;
  addNote: (folderId: string, content: string, type: 'text' | 'recording', fileUrl?: string) => Promise<void>;
  synthesizeFolder: (folderId: string) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  folders: [],
  currentFolder: null,
  notes: [],
  loading: false,

  fetchFolders: async () => {
    const { data: folders } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    set({ folders: folders || [] });
  },

  createFolder: async (name: string, description: string) => {
    const { data: folder } = await supabase
      .from('folders')
      .insert([{ name, description }])
      .select()
      .single();
    if (folder) {
      set(state => ({ folders: [folder, ...state.folders] }));
    }
  },

  setCurrentFolder: (folder) => {
    set({ currentFolder: folder });
    if (folder) {
      get().fetchNotes(folder.id);
    }
  },

  fetchNotes: async (folderId: string) => {
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    set({ notes: notes || [] });
  },

  addNote: async (folderId: string, content: string, type: 'text' | 'recording', fileUrl?: string) => {
    const { data: note } = await supabase
      .from('notes')
      .insert([{ folder_id: folderId, content, type, file_url: fileUrl }])
      .select()
      .single();
    if (note) {
      set(state => ({ notes: [note, ...state.notes] }));
    }
  },

  synthesizeFolder: async (folderId: string) => {
    set({ loading: true });
    try {
      const notes = get().notes;
      const synthesis = await synthesizeIdea(notes);
      
      await supabase
        .from('synthesized_ideas')
        .insert([{ folder_id: folderId, content: synthesis }]);
        
      alert('Idea successfully synthesized!');
    } catch (error) {
      console.error('Error synthesizing idea:', error);
      alert('Failed to synthesize idea. Please try again.');
    } finally {
      set({ loading: false });
    }
  },
}));