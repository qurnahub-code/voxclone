"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2, Download, Mic, Settings, Link as LinkIcon, Upload, Globe } from 'lucide-react';

export default function Home() {
  const [text, setText] = useState('');
  const [backendUrl, setBackendUrl] = useState('https://abusufyan909-voxclone-api.hf.space');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], "recorded_voice.webm", { type: 'audio/webm' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow microphone permissions in your browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!text || !audioFile) return;
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);
      formData.append('audio_file', audioFile);

      // We remove trailing slashes from the backend URL if present
      const cleanUrl = backendUrl.replace(/\/$/, '');
      
      const res = await axios.post(`${cleanUrl}/api/clone`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.status === 'success') {
        setAudioUrl(`${cleanUrl}/api/audio/${res.data.file}`);
      } else {
        setError(res.data.message || 'Generation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/50 p-6 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-3 text-2xl font-bold text-white tracking-wide">
          <div className="bg-purple-600/20 p-2 rounded-xl">
            <Mic className="w-6 h-6 text-purple-500" />
          </div>
          <span>VoxClone</span>
        </div>
        
        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <LinkIcon className="w-3 h-3" /> Connection
          </label>
          <input 
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="https://your-ngrok-url.app"
            className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          />
          <p className="text-xs text-gray-500">Paste your Google Colab Ngrok URL here.</p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Mic className="w-3 h-3" /> Voice Cloning
          </label>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-purple-500 bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Upload className="w-6 h-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-300 text-center">
              {audioFile ? audioFile.name : "Upload Reference Audio"}
            </span>
            <span className="text-xs text-gray-500 text-center">
              Provide a clear 5-10 second clip of the voice you want to clone. (.wav, .mp3)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-gray-800 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium uppercase">OR</span>
            <div className="h-px bg-gray-800 flex-1"></div>
          </div>

          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              isRecording 
              ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50 animate-pulse" 
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
            }`}
          >
            {isRecording ? <div className="w-2 h-2 bg-red-500 rounded-full" /> : <Mic className="w-4 h-4" />}
            {isRecording ? "Stop Recording..." : "Record Voice with Mic"}
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="audio/*" 
            className="hidden" 
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3 h-3" /> Language
          </label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="ur">Urdu</option>
            <option value="hi">Hindi</option>
            <option value="ar">Arabic</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="pl">Polish</option>
            <option value="tr">Turkish</option>
            <option value="ru">Russian</option>
            <option value="nl">Dutch</option>
            <option value="cs">Czech</option>
            <option value="zh-cn">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="hu">Hungarian</option>
          </select>
        </div>

        <div className="mt-auto flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 cursor-pointer">
          <Settings className="w-4 h-4" />
          <span>Advanced Options</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 flex flex-col max-w-5xl mx-auto w-full gap-6 md:gap-8">
        <header>
          <h1 className="text-4xl font-bold text-white tracking-tight">Speech Synthesis</h1>
          <p className="text-gray-400 mt-2 text-lg">Generate ultra-realistic voice overs using XTTS-v2 Voice Cloning.</p>
        </header>

        <div className="flex-1 flex flex-col gap-6">
          <div className="relative flex-1 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all shadow-2xl shadow-black/50">
            <textarea
              className="w-full h-full p-8 bg-transparent text-xl text-gray-100 placeholder-gray-600 outline-none resize-none leading-relaxed"
              placeholder="Type or paste the script you want your cloned voice to read..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="absolute bottom-6 right-6 text-sm text-gray-500 font-medium bg-gray-950/50 px-3 py-1 rounded-full backdrop-blur-sm">
              {text.length} / 5000 characters
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-medium">
              Error: {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-xl shadow-black/20 gap-4">
            <div className="flex-1 px-2 md:px-4 flex justify-center md:justify-start">
              {audioUrl ? (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
                  <audio controls src={audioUrl} className="h-12 w-full md:max-w-md" autoPlay />
                  <a href={audioUrl} download className="p-3 text-gray-400 hover:text-white bg-gray-800 rounded-xl transition-all hover:bg-gray-700 hover:scale-105 active:scale-95">
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ) : (
                <span className="text-gray-500 text-sm font-medium">Ready to synthesize...</span>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !text || !audioFile || !backendUrl}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 w-full md:w-auto"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {loading ? `Synthesizing... (${elapsed}s / ~35s)` : 'Generate Cloned Voice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
