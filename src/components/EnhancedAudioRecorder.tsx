import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Save } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from '../lib/supabase';

interface Props {
  onRecordingComplete: (url: string, content: string) => void;
  quality?: 'standard' | 'high';
}

export function EnhancedAudioRecorder({ onRecordingComplete, quality = 'standard' }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startTime = useRef<number>(0);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4F46E5',
        progressColor: '#818CF8',
        cursorColor: '#4F46E5',
        barWidth: 2,
        barGap: 1,
        responsive: true,
        height: 60,
      });

      wavesurfer.current.load(audioUrl);

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: quality === 'high' ? 48000 : 44100,
          channelCount: quality === 'high' ? 2 : 1,
        } 
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: quality === 'high' ? 256000 : 128000,
      });

      chunks.current = [];
      startTime.current = Date.now();

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration((Date.now() - startTime.current) / 1000);
      };

      mediaRecorder.current.start(100);
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const saveRecording = async () => {
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
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

      onRecordingComplete(
        publicUrl,
        `Recording from ${new Date().toLocaleString()} (${duration.toFixed(1)}s)`
      );

      setAudioUrl(null);
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const discardRecording = () => {
    setAudioUrl(null);
    chunks.current = [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {!isRecording && !audioUrl && (
          <button
            onClick={startRecording}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <Square className="w-6 h-6" />
            </button>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </button>
          </>
        )}

        {audioUrl && (
          <div className="flex items-center gap-2">
            <button
              onClick={saveRecording}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={discardRecording}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">
              {isPaused ? 'Paused' : 'Recording...'}
            </span>
          </div>
        )}
      </div>

      {audioUrl && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div ref={waveformRef} />
          <div className="text-sm text-gray-500 mt-2">
            Duration: {duration.toFixed(1)}s
          </div>
        </div>
      )}
    </div>
  );
}