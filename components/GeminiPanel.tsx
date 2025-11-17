
import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Replaced non-existent `VideosOperation` with `Operation`.
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Chat, GenerateContentResponse, Operation } from '@google/genai';
import { FEATURES, ICONS, VEO_LOADING_MESSAGES } from '../constants';
import { AspectRatio, ChatMessage, FeatureID, GroundingChunk, Bookmark, DownloadItem } from '../types';
import { Spinner } from './ui/Spinner';
import * as geminiService from '../services/geminiService';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- Feature Components (defined inside the main component file) ---

const FeatureHome: React.FC<{ onSelectFeature: (id: FeatureID) => void }> = ({ onSelectFeature }) => (
  <div className="p-4">
    <h2 className="text-xl font-semibold mb-4 text-gemini-blue">Gemini Tools</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FEATURES.map((feature) => (
        <button
          key={feature.id}
          onClick={() => onSelectFeature(feature.id)}
          className="p-4 bg-gemini-gray-700 rounded-lg text-left hover:bg-gemini-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gemini-blue"
        >
          <div className="flex items-center space-x-4">
            <div className="text-gemini-blue">{feature.icon}</div>
            <div>
              <p className="font-semibold">{feature.name}</p>
              <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const ChatFeature: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(geminiService.startChat("You are a helpful AI assistant integrated into a web browser."));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat) return;
        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: input });
            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-gemini-blue text-white rounded-br-none' : 'bg-gemini-gray-700 rounded-bl-none'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            {isLoading && <div className="flex justify-center p-2"><Spinner /></div>}
            <div className="mt-4 flex items-center border border-gemini-gray-600 rounded-full p-1 focus-within:ring-2 focus-within:ring-gemini-blue">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    placeholder="Ask Gemini anything..."
                    className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm"
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 rounded-full bg-gemini-blue text-white disabled:bg-gemini-gray-600">
                    {ICONS.send}
                </button>
            </div>
        </div>
    );
};


const ImageGeneratorFeature: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setImageUrl('');
        try {
            const url = await geminiService.generateImage(prompt, aspectRatio);
            setImageUrl(url);
        } catch (err) {
            setError('Failed to generate image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 flex flex-col h-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A photorealistic image of a cat wearing a spacesuit on Mars..."
                    className="w-full h-24 p-2 bg-gemini-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gemini-blue text-sm"
                />
                <div>
                    <label className="text-sm font-medium text-gray-400">Aspect Ratio</label>
                    <div className="flex space-x-2 mt-2">
                        {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ar => (
                            <button
                                key={ar}
                                type="button"
                                onClick={() => setAspectRatio(ar)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${aspectRatio === ar ? 'bg-gemini-blue text-white' : 'bg-gemini-gray-600 hover:bg-gemini-gray-500'}`}
                            >
                                {ar}
                            </button>
                        ))}
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-gemini-blue text-white font-semibold py-2 rounded-md hover:bg-opacity-90 disabled:bg-gemini-gray-600 flex items-center justify-center">
                    {isLoading ? <Spinner /> : 'Generate Image'}
                </button>
            </form>
            <div className="mt-4 flex-1 flex items-center justify-center bg-gemini-gray-900 rounded-lg overflow-hidden">
                {error && <p className="text-red-400">{error}</p>}
                {imageUrl && <img src={imageUrl} alt="Generated image" className="max-w-full max-h-full object-contain"/>}
                {!isLoading && !imageUrl && !error && <p className="text-gemini-gray-500">Your generated image will appear here.</p>}
            </div>
        </div>
    );
};

const ImageEditorFeature: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<{file: File, url: string} | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImage({ file, url: URL.createObjectURL(file) });
            setEditedImage(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !originalImage) return;
        setIsLoading(true);
        setError('');
        setEditedImage(null);
        try {
            const base64Data = await fileToBase64(originalImage.file);
            const url = await geminiService.editImage(prompt, base64Data, originalImage.file.type);
            setEditedImage(url);
        } catch (err) {
            setError('Failed to edit image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col items-center justify-center bg-gemini-gray-900 rounded-lg p-2">
                    {originalImage ? (
                        <img src={originalImage.url} alt="Original" className="max-w-full max-h-full object-contain"/>
                    ) : (
                        <div className="text-center text-gemini-gray-500">
                           {ICONS.upload}
                            <p>Upload an image</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center justify-center bg-gemini-gray-900 rounded-lg p-2">
                    {editedImage ? (
                         <img src={editedImage} alt="Edited" className="max-w-full max-h-full object-contain"/>
                    ) : isLoading ? (
                        <Spinner className="w-10 h-10"/>
                    ) : (
                        <div className="text-center text-gemini-gray-500">
                           {ICONS.image_edit}
                            <p>{error || "Edited image will appear here."}</p>
                        </div>
                    )}
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 mt-4">
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gemini-gray-700 file:text-gemini-blue hover:file:bg-gemini-gray-600"/>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Add a retro filter and a cat in the corner..."
                    className="w-full h-20 p-2 bg-gemini-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gemini-blue text-sm"
                    disabled={!originalImage}
                />
                <button type="submit" disabled={isLoading || !originalImage || !prompt} className="w-full bg-gemini-purple text-white font-semibold py-2 rounded-md hover:bg-opacity-90 disabled:bg-gemini-gray-600 flex items-center justify-center">
                    {isLoading ? <Spinner /> : 'Apply Edit'}
                </button>
            </form>
        </div>
    );
};

const VideoGeneratorFeature: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{file: File, url: string} | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [mode, setMode] = useState<'text' | 'image'>('text');
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isApiKeyReady, setIsApiKeyReady] = useState(false);
    
    const checkApiKey = useCallback(async () => {
        try {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsApiKeyReady(hasKey);
            }
        } catch (e) { console.error("API key check failed", e); }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        const success = await geminiService.checkAndSelectApiKey();
        setIsApiKeyReady(success);
        if (!success) {
            setError("API Key selection is required for video generation. Please try again.");
        } else {
             setError("");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage({ file, url: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() && mode === 'text') return;
        if (mode === 'image' && !image) return;

        setIsLoading(true);
        setError('');
        setVideoUrl(null);
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            setLoadingMessage(VEO_LOADING_MESSAGES[messageIndex % VEO_LOADING_MESSAGES.length]);
            messageIndex++;
        }, 2500);

        try {
            const imagePayload = image ? { data: await fileToBase64(image.file), mimeType: image.file.type } : undefined;
            let operation = await geminiService.generateVideo(prompt, imagePayload, aspectRatio);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                try {
                    operation = await geminiService.checkVideoStatus(operation);
                } catch (statusError: any) {
                     if (statusError.message?.includes("Requested entity was not found")) {
                        setError("API Key validation failed. Please select your key again.");
                        setIsApiKeyReady(false);
                        throw statusError; // Stop polling
                    }
                }
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoBlob = await geminiService.fetchVideo(downloadLink);
                setVideoUrl(URL.createObjectURL(videoBlob));
            } else {
                throw new Error("Video generation completed, but no video URI was found.");
            }
        } catch (err) {
            setError('Failed to generate video. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
            clearInterval(messageInterval);
            setLoadingMessage('');
        }
    };

    if (!isApiKeyReady) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <h3 className="text-lg font-semibold text-gemini-blue">API Key Required for Veo</h3>
                <p className="text-sm text-gray-400 my-4">Video generation with Veo requires you to select a Google Cloud project with billing enabled.</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-gemini-blue hover:underline mb-4">Learn more about billing</a>
                {error && <p className="text-red-400 mb-4">{error}</p>}
                <button onClick={handleSelectKey} className="bg-gemini-blue text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-90">Select API Key</button>
            </div>
        );
    }
    
    return (
        <div className="p-4 flex flex-col h-full">
             <div className="flex justify-center mb-4 border border-gemini-gray-600 rounded-full p-1">
                <button onClick={() => setMode('text')} className={`w-1/2 py-1 text-sm rounded-full ${mode === 'text' ? 'bg-gemini-blue text-white' : ''}`}>Text to Video</button>
                <button onClick={() => setMode('image')} className={`w-1/2 py-1 text-sm rounded-full ${mode === 'image' ? 'bg-gemini-blue text-white' : ''}`}>Image to Video</button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-3">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A robot holding a red skateboard..." className="w-full h-20 p-2 bg-gemini-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gemini-blue text-sm" />
                {mode === 'image' && (
                    <div className="flex items-center space-x-4">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gemini-gray-700 file:text-gemini-blue hover:file:bg-gemini-gray-600"/>
                        {image && <img src={image.url} className="w-12 h-12 rounded object-cover" alt="upload preview"/>}
                    </div>
                )}
                <div className="flex space-x-2">
                    {(['16:9', '9:16'] as const).map(ar => <button key={ar} type="button" onClick={() => setAspectRatio(ar)} className={`px-3 py-1 text-xs rounded-full transition-colors ${aspectRatio === ar ? 'bg-gemini-blue text-white' : 'bg-gemini-gray-600 hover:bg-gemini-gray-500'}`}>{ar}</button>)}
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-gemini-purple text-white font-semibold py-2 rounded-md hover:bg-opacity-90 disabled:bg-gemini-gray-600 flex items-center justify-center">
                    {isLoading ? <Spinner /> : 'Generate Video'}
                </button>
             </form>
             <div className="mt-4 flex-1 flex flex-col items-center justify-center bg-gemini-gray-900 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="text-center">
                        <Spinner className="w-10 h-10 mx-auto" />
                        <p className="mt-4 text-sm text-gemini-gray-400">{loadingMessage}</p>
                    </div>
                ) : error ? (
                    <p className="text-red-400 text-center px-4">{error}</p>
                ) : videoUrl ? (
                    <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
                ) : (
                    <p className="text-gemini-gray-500">Your generated video will appear here.</p>
                )}
            </div>
        </div>
    );
};

const LiveConversationFeature: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<{user: string, model: string}[]>([]);
  const [currentTurn, setCurrentTurn] = useState({user: '', model: ''});
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<{input: AudioContext, output: AudioContext}|null>(null);
  const mediaStreamRef = useRef<MediaStream|null>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

      for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
              channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
          }
      }
      return buffer;
  };
  
  const createBlob = (data: Float32Array): Blob => {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
          int16[i] = data[i] * 32768;
      }
      const encode = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const startConversation = async () => {
    if (isActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = {input: inputAudioContext, output: outputAudioContext};
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}}},
        },
        callbacks: {
          onopen: () => {
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                  const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                  const pcmBlob = createBlob(inputData);
                  sessionPromiseRef.current?.then((session) => {
                      session.sendRealtimeInput({ media: pcmBlob });
                  });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
              setIsActive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                setCurrentTurn(prev => ({...prev, user: prev.user + message.serverContent.inputTranscription.text}));
             }
             if (message.serverContent?.outputTranscription) {
                setCurrentTurn(prev => ({...prev, model: prev.model + message.serverContent.outputTranscription.text}));
             }
             if (message.serverContent?.turnComplete) {
                setTranscription(prev => [...prev, currentTurn]);
                setCurrentTurn({user: '', model: ''});
             }
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const sourceNode = outputAudioContext.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(outputAudioContext.destination);
                sourceNode.addEventListener('ended', () => sources.delete(sourceNode));
                sourceNode.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                sources.add(sourceNode);
             }
             if (message.serverContent?.interrupted) {
                for (const sourceNode of sources.values()) {
                    sourceNode.stop();
                    sources.delete(sourceNode);
                }
                nextStartTime = 0;
             }
          },
          onerror: (e: ErrorEvent) => { console.error('Live session error:', e); stopConversation(); },
          onclose: () => { stopConversation(); },
        }
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const stopConversation = () => {
    setIsActive(false);
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.input.close();
    audioContextRef.current?.output.close();
    setTranscription([]);
    setCurrentTurn({user: '', model: ''});
  };

  return (
    <div className="p-4 flex flex-col h-full text-center">
        <div className="flex-1 overflow-y-auto mb-4 text-left p-2 bg-gemini-gray-900 rounded-lg">
          {transcription.map((turn, i) => (
              <div key={i} className="mb-3">
                  <p><strong className="text-gemini-blue">You:</strong> {turn.user}</p>
                  <p><strong className="text-gemini-purple">Gemini:</strong> {turn.model}</p>
              </div>
          ))}
          { (currentTurn.user || currentTurn.model) && 
            <div className="mb-3 opacity-70">
                { currentTurn.user && <p><strong className="text-gemini-blue">You:</strong> {currentTurn.user}</p> }
                { currentTurn.model && <p><strong className="text-gemini-purple">Gemini:</strong> {currentTurn.model}</p> }
            </div>
          }
        </div>
        <button 
          onClick={isActive ? stopConversation : startConversation} 
          className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white transition-all duration-300 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gemini-blue'}`}
        >
          {ICONS.live_chat}
        </button>
        <p className="mt-4 text-sm text-gray-400">{isActive ? "Conversation in progress..." : "Tap to start speaking"}</p>
    </div>
  );
};

const WebAnalyzerFeature: React.FC<{currentUrl: string}> = ({ currentUrl }) => {
    const [mode, setMode] = useState<'summarize'|'search'|'maps'>('summarize');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{text: string; chunks: GroundingChunk[]}>({text: '', chunks: []});
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setResult({text: '', chunks: []});
        try {
            const fullPrompt = `Based on the content of the webpage at ${currentUrl}, ${prompt}`;
            if (mode === 'search' || mode === 'maps') {
                let location: {latitude: number, longitude: number} | undefined;
                if (mode === 'maps') {
                    location = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                            (err) => reject(err)
                        );
                    });
                }
                // FIX: Mapped component state 'search'/'maps' to 'googleSearch'/'googleMaps' for the service call.
                const response = await geminiService.generateWithGrounding(fullPrompt, mode === 'search' ? 'googleSearch' : 'googleMaps', location);
                setResult({ text: response.text, chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] });
            } else { // summarize
                const text = await geminiService.generateText(fullPrompt, 'gemini-2.5-pro', true);
                setResult({ text, chunks: [] });
            }
        } catch(err) {
            setError("Failed to analyze. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
      <div className="p-4 flex flex-col h-full">
        <p className="text-sm text-gray-400 mb-2 truncate">Analyzing: <span className="text-gemini-blue">{currentUrl}</span></p>
        <div className="flex justify-center mb-4 border border-gemini-gray-600 rounded-full p-1">
          <button onClick={() => setMode('summarize')} className={`w-1/3 py-1 text-xs rounded-full ${mode === 'summarize' ? 'bg-gemini-blue text-white' : ''}`}>Summarize</button>
          <button onClick={() => setMode('search')} className={`w-1/3 py-1 text-xs rounded-full ${mode === 'search' ? 'bg-gemini-blue text-white' : ''}`}>Web Search</button>
          <button onClick={() => setMode('maps')} className={`w-1/3 py-1 text-xs rounded-full ${mode === 'maps' ? 'bg-gemini-blue text-white' : ''}`}>Maps Search</button>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={`e.g., "What are the key points?" for summarize, or "Who won the game mentioned?" for Web Search...`} className="w-full h-24 p-2 bg-gemini-gray-700 rounded-md text-sm mb-2"/>
        <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-gemini-purple text-white font-semibold py-2 rounded-md disabled:bg-gemini-gray-600 flex justify-center">{isLoading ? <Spinner/> : "Analyze"}</button>
        <div className="mt-4 flex-1 bg-gemini-gray-900 rounded-lg p-3 overflow-y-auto text-sm">
            {error && <p className="text-red-400">{error}</p>}
            {result.text && <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">{result.text}</div>}
            {result.chunks.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-semibold text-gray-400">Sources:</h4>
                    {/* FIX: Updated rendering of grounding chunks to include Maps review snippets as required by guidelines, which also resolves a potential bug with empty hrefs. */}
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        {result.chunks.map((chunk, i) => (
                            <React.Fragment key={i}>
                                {(chunk.web?.uri || chunk.maps?.uri) && (
                                    <li>
                                        <a href={chunk.web?.uri || chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-gemini-blue hover:underline">
                                            {chunk.web?.title || chunk.maps?.title || "Source"}
                                        </a>
                                    </li>
                                )}
                                {chunk.maps?.placeAnswerSources?.reviewSnippets?.map((snippet, j) => (
                                    snippet.review?.uri && (
                                        <li key={`snippet-${i}-${j}`} className="ml-4">
                                            <a href={snippet.review.uri} target="_blank" rel="noopener noreferrer" className="text-gemini-blue hover:underline">
                                                {snippet.review.text ? `"${snippet.review.text}"` : "Review Snippet"}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </React.Fragment>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
    );
};

const TTSFeature: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!text.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const base64Audio = await geminiService.generateSpeech(text);
            const audioUrl = `data:audio/webm;base64,${base64Audio}`;
            if(audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play();
            }
        } catch(err) {
            setError("Failed to generate speech.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 flex flex-col h-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Enter text to convert to speech..." className="w-full h-40 p-2 bg-gemini-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gemini-blue text-sm" />
                <button type="submit" disabled={isLoading} className="w-full bg-gemini-blue text-white font-semibold py-2 rounded-md hover:bg-opacity-90 disabled:bg-gemini-gray-600 flex items-center justify-center">
                    {isLoading ? <Spinner /> : 'Generate Speech'}
                </button>
            </form>
             <div className="mt-4 flex-1 flex flex-col items-center justify-center bg-gemini-gray-900 rounded-lg overflow-hidden p-4">
                <audio ref={audioRef} controls className="w-full"></audio>
                {error && <p className="text-red-400 mt-4">{error}</p>}
             </div>
        </div>
    )
}

const BookmarksFeature: React.FC<{
    bookmarks: Bookmark[];
    onRemoveBookmark: (id: string) => void;
    onNavigate: (url: string) => void;
}> = ({ bookmarks, onRemoveBookmark, onNavigate }) => {
    return (
        <div className="p-4 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 text-gemini-blue">Bookmarks</h2>
            {bookmarks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gemini-gray-500">
                    <p>No bookmarks yet. Click the star in the address bar to save a page.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {bookmarks.map(bookmark => (
                        <div key={bookmark.id} className="flex items-center justify-between p-2 bg-gemini-gray-700 rounded-md group">
                            <div className="flex items-center space-x-3 overflow-hidden" onClick={() => onNavigate(bookmark.url)} style={{cursor: 'pointer'}}>
                                <img src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`} alt="" className="w-4 h-4 flex-shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium truncate">{bookmark.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{bookmark.url}</p>
                                </div>
                            </div>
                            <button onClick={() => onRemoveBookmark(bookmark.id)} className="p-1 rounded-full text-gemini-gray-500 hover:bg-gemini-gray-600 hover:text-white transition-opacity opacity-0 group-hover:opacity-100">
                                {ICONS.delete}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const DownloadsFeature: React.FC<{ downloads: DownloadItem[] }> = ({ downloads }) => {
    return (
        <div className="p-4 flex flex-col h-full">
             <h2 className="text-xl font-semibold mb-4 text-gemini-blue">Downloads</h2>
             {downloads.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gemini-gray-500">
                    <p>No downloads have started in this session.</p>
                </div>
             ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {downloads.map(item => (
                        <div key={item.id} className="p-2 bg-gemini-gray-700 rounded-md">
                            <p className="text-sm font-medium truncate">{item.filename}</p>
                            {item.state === 'progressing' ? (
                                <>
                                    <div className="w-full bg-gemini-gray-900 rounded-full h-2 my-1.5">
                                        <div className="bg-gemini-blue h-2 rounded-full" style={{ width: `${item.progress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}
                                    </p>
                                </>
                            ) : (
                                <p className={`text-xs ${item.state === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.state.charAt(0).toUpperCase() + item.state.slice(1)} - {formatBytes(item.totalBytes)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
};


// --- Main Panel Component ---

interface GeminiPanelProps {
    currentUrl: string;
    bookmarks: Bookmark[];
    onRemoveBookmark: (id: string) => void;
    onNavigate: (url: string) => void;
    downloads: DownloadItem[];
}


export const GeminiPanel: React.FC<GeminiPanelProps> = ({ currentUrl, bookmarks, onRemoveBookmark, onNavigate, downloads }) => {
  const [activeFeature, setActiveFeature] = useState<FeatureID | null>(null);

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'chat':
        return <ChatFeature />;
      case 'image_gen':
        return <ImageGeneratorFeature />;
      case 'image_edit':
        return <ImageEditorFeature />;
      case 'video_gen':
        return <VideoGeneratorFeature />;
      case 'live_chat':
        return <LiveConversationFeature />;
      case 'web_analyzer':
        return <WebAnalyzerFeature currentUrl={currentUrl} />;
      case 'tts':
          return <TTSFeature />;
      case 'bookmarks':
          return <BookmarksFeature bookmarks={bookmarks} onRemoveBookmark={onRemoveBookmark} onNavigate={onNavigate}/>;
      case 'downloads':
          return <DownloadsFeature downloads={downloads} />;
      default:
        return <FeatureHome onSelectFeature={setActiveFeature} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gemini-gray-800 text-gray-200">
      <header className="flex items-center p-3 border-b border-gemini-gray-700">
        {activeFeature && (
          <button
            onClick={() => setActiveFeature(null)}
            className="p-2 rounded-full hover:bg-gemini-gray-700 transition-colors mr-2"
          >
            {ICONS.back}
          </button>
        )}
        <h1 className="text-lg font-semibold flex items-center">
          <span className="text-gemini-blue mr-2">{ICONS.gemini}</span>
          Gemini
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {renderActiveFeature()}
      </div>
    </div>
  );
};