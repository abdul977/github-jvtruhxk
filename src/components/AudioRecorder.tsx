import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onRecordingComplete: (url: string, content: string) => void;
}

export function AudioRecorder({ onRecordingComplete }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });

        const { data, error } = await supabase.storage
          .from('recordings')
          .upload(`${Date.now()}-${file.name}`, file);

        if (error) {
          console.error('Error uploading recording:', error);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('recordings')
          .getPublicUrl(data.path);

        onRecordingComplete(publicUrl, `Recording from ${new Date().toLocaleString()}`);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex items-center gap-4">
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <Square className="w-6 h-6" />
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          <Mic className="w-6 h-6" />
        </button>
      )}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Recording...</span>
        </div>
      )}
    </div>
  );
}