import React, { useEffect } from 'react';
import { Plus, FolderPlus, Wand2 } from 'lucide-react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useStore } from './store/useStore';
import { AudioRecorder } from './components/AudioRecorder';

function App() {
  const {
    folders,
    currentFolder,
    notes,
    loading,
    fetchFolders,
    createFolder,
    setCurrentFolder,
    addNote,
    synthesizeFolder
  } = useStore();

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    const description = prompt('Enter folder description:');
    if (name && description) {
      createFolder(name, description);
    }
  };

  const handleAddTextNote = () => {
    if (!currentFolder) return;
    const content = prompt('Enter your note:');
    if (content) {
      addNote(currentFolder.id, content, 'text');
    }
  };

  const handleRecordingComplete = (url: string, content: string) => {
    if (!currentFolder) return;
    addNote(currentFolder.id, content, 'recording', url);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IdeaVault</h1>
          <p className="text-gray-600">Capture and organize your ideas</p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Folders Sidebar */}
          <div className="col-span-3 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Folders</h2>
              <button
                onClick={handleCreateFolder}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
              >
                <FolderPlus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentFolder?.id === folder.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{folder.name}</div>
                  <div className="text-sm text-gray-500">{folder.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9 bg-white rounded-lg shadow p-6">
            {currentFolder ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{currentFolder.name}</h2>
                    <p className="text-gray-600">{currentFolder.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleAddTextNote}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add Note
                    </button>
                    <button
                      onClick={() => synthesizeFolder(currentFolder.id)}
                      disabled={loading || notes.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      <Wand2 className="w-5 h-5" />
                      Synthesize
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                </div>

                <div className="space-y-4">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      className="p-4 border rounded-lg hover:border-blue-200 transition-colors"
                    >
                      {note.type === 'recording' ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">{note.content}</div>
                          <AudioPlayer
                            src={note.file_url}
                            customControlsSection={['MAIN_CONTROLS', 'VOLUME_CONTROLS']}
                            customProgressBarSection={['PROGRESS_BAR', 'CURRENT_TIME']}
                          />
                          {note.transcription && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Transcription:</strong> {note.transcription}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="prose">{note.content}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(note.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
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