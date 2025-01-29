import React, { useEffect, useState } from 'react';
import { 
  Plus, FolderPlus, Wand2, Search, Download, 
  Tag, Trash2, Edit, Moon, Sun, X 
} from 'lucide-react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useStore } from './store/useStore';
import { EnhancedAudioRecorder } from './components/EnhancedAudioRecorder';
import { RichTextEditor } from './components/RichTextEditor';
import { ThemeToggle } from './components/ThemeToggle';
import { format } from 'date-fns';

function App() {
  const {
    folders,
    currentFolder,
    notes,
    loading,
    darkMode,
    searchQuery,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    setCurrentFolder,
    addNote,
    updateNote,
    deleteNote,
    synthesizeFolder,
    setSearchQuery,
    setDarkMode,
    exportFolder
  } = useStore();

  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [folderTags, setFolderTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (currentFolder?.tags) {
      setFolderTags(currentFolder.tags);
    }
  }, [currentFolder]);

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    const description = prompt('Enter folder description:');
    if (name && description) {
      createFolder(name, description, []);
    }
  };

  const handleAddTag = () => {
    if (newTag && currentFolder) {
      const updatedTags = [...folderTags, newTag];
      setFolderTags(updatedTags);
      updateFolder(currentFolder.id, { tags: updatedTags });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (currentFolder) {
      const updatedTags = folderTags.filter(tag => tag !== tagToRemove);
      setFolderTags(updatedTags);
      updateFolder(currentFolder.id, { tags: updatedTags });
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
    if (!currentFolder) return;
    try {
      const url = await exportFolder(currentFolder.id, format);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error exporting folder:', error);
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="container mx-auto p-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              IdeaVault
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Capture and organize your ideas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search folders and notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring focus:ring-blue-200 focus:border-blue-500 w-64 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Folders Sidebar */}
          <div className={`col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Folders
              </h2>
              <button
                onClick={handleCreateFolder}
                className={`p-2 ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-500 hover:bg-blue-50'} rounded-full`}
              >
                <FolderPlus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {filteredFolders.map(folder => (
                <div
                  key={folder.id}
                  className={`relative group ${
                    currentFolder?.id === folder.id
                      ? darkMode ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-700'
                      : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } rounded-lg transition-colors`}
                >
                  <button
                    onClick={() => setCurrentFolder(folder)}
                    className="w-full text-left p-3"
                  >
                    <div className={`font-medium ${darkMode ? 'text-white' : ''}`}>
                      {editingFolder === folder.id ? (
                        <input
                          type="text"
                          value={folder.name}
                          onChange={(e) => updateFolder(folder.id, { name: e.target.value })}
                          onBlur={() => setEditingFolder(null)}
                          className="w-full bg-transparent border-none focus:ring-0"
                          autoFocus
                        />
                      ) : (
                        folder.name
                      )}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {folder.description}
                    </div>
                    {folder.tags && folder.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {folder.tags.map(tag => (
                          <span
                            key={tag}
                            className={`text-xs px-2 py-1 rounded-full ${
                              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  <div className={`absolute right-2 top-2 flex gap-1 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-lg opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button
                      onClick={() => setEditingFolder(folder.id)}
                      className="p-1 hover:text-blue-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className="p-1 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className={`col-span-9 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            {currentFolder ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currentFolder.name}
                    </h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentFolder.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {folderTags.map(tag => (
                        <span
                          key={tag}
                          className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag..."
                          className={`text-sm px-3 py-1 rounded-full ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                          } border-none focus:ring-1 focus:ring-blue-500`}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <button
                          onClick={handleAddTag}
                          className={`p-1 rounded-full ${
                            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExport('pdf')}
                        className={`px-3 py-1 rounded ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        className={`px-3 py-1 rounded ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Word
                      </button>
                      <button
                        onClick={() => handleExport('html')}
                        className={`px-3 py-1 rounded ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        HTML
                      </button>
                    </div>
                    <button
                      onClick={() => setShowNewNote(true)}
                      className={`flex items-center gap-2 px-4 py-2 ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white rounded-lg transition-colors`}
                    >
                      <Plus className="w-5 h-5" />
                      Add Note
                    </button>
                    <button
                      onClick={() => synthesizeFolder(currentFolder.id)}
                      disabled={loading || notes.length === 0}
                      className={`flex items-center gap-2 px-4 py-2 ${
                        darkMode
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-purple-500 hover:bg-purple-600'
                      } text-white rounded-lg transition-colors disabled:opacity-50`}
                    >
                      <Wand2 className="w-5 h-5" />
                      Synthesize
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <EnhancedAudioRecorder
                    onRecordingComplete={(url, content) => {
                      addNote(currentFolder.id, content, 'recording', url);
                    }}
                    quality="high"
                  />
                </div>

                {showNewNote && (
                  <div className="mb-6">
                    <RichTextEditor
                      content={newNoteContent}
                      onChange={setNewNoteContent}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setShowNewNote(false);
                          setNewNoteContent('');
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (newNoteContent.trim()) {
                            addNote(currentFolder.id, newNoteContent, 'text');
                            setShowNewNote(false);
                            setNewNoteContent('');
                          }
                        }}
                        className={`px-4 py-2 ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white rounded-lg`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      className={`p-4 border rounded-lg ${
                        darkMode
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-blue-200'
                      } transition-colors`}
                    >
                      {note.type === 'recording' ? (
                        <div className="space-y-2">
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {note.content}
                          </div>
                          <AudioPlayer
                            src={note.file_url}
                            customControlsSection={['MAIN_CONTROLS', 'VOLUME_CONTROLS']}
                            customProgressBarSection={['PROGRESS_BAR', 'CURRENT_TIME']}
                            className={darkMode ? 'dark-theme' : ''}
                          />
                          {note.transcription && (
                            <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong>Transcription:</strong> {note.transcription}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none`}
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {format(new Date(note.created_at), 'PPpp')}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this note?')) {
                                deleteNote(note.id);
                              }
                            }}
                            className={`p-1 rounded hover:bg-red-100 ${
                              darkMode ? 'text-red-400' : 'text-red-500'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-12`}>
                Select a folder or create a new one to get started
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;