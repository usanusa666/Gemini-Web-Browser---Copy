
// FIX: Replaced non-existent `VideosOperation` with `Operation`.
// FIX: Added GenerateVideosResponse and GenerateVideosMetadata for the generic Operation type.
import { GoogleGenAI, Modality, Type, GenerateContentResponse, Chat, Operation, GenerateVideosResponse, GenerateVideosMetadata } from "@google/genai";
import { AspectRatio } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// --- Veo Specific API Key Handling ---
// FIX: Removed `declare global` block to resolve conflict with an existing global declaration of `window.aistudio`.
// It's assumed that the type for `window.aistudio` is provided elsewhere in the project.

export const checkAndSelectApiKey = async (): Promise<boolean> => {
    try {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            return true;
        }
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Optimistically assume key selection was successful
            return true;
        }
    } catch(e) {
        console.error("API Key selection failed", e);
    }
    return false;
};

const getAIForVideo = (): GoogleGenAI => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set after selection dialog.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}


// --- API Functions ---

export const generateText = async (prompt: string, model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' = 'gemini-2.5-flash', useThinking: boolean = false): Promise<string> => {
  const ai = getAI();
  const config = useThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config
  });
  return response.text;
};

export const startChat = (systemInstruction?: string): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      ...(systemInstruction && { systemInstruction }),
    },
  });
};

export const generateWithGrounding = async (prompt: string, tool: 'googleSearch' | 'googleMaps', location?: { latitude: number, longitude: number }) => {
  const ai = getAI();
  const tools = tool === 'googleSearch' ? [{ googleSearch: {} }] : [{ googleMaps: {} }];
  const toolConfig = tool === 'googleMaps' && location ? { retrievalConfig: { latLng: location } } : {};
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools,
      ...toolConfig
    }
  });
  return response;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: aspectRatio,
    },
  });
  const base64ImageBytes = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, base64ImageData: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64ImageData, mimeType: mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated in response");
};

// FIX: Replaced `VideosOperation` with the correct `Operation` type.
// FIX: Provided the required generic type arguments for the Operation type.
export const generateVideo = async (prompt: string, image?: { data: string; mimeType: string }, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<Operation<GenerateVideosResponse, GenerateVideosMetadata>> => {
    const ai = getAIForVideo();
    const imagePayload = image ? { imageBytes: image.data, mimeType: image.mimeType } : undefined;
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      ...(imagePayload && { image: imagePayload }),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });
    return operation;
};

// FIX: Replaced `VideosOperation` with the correct `Operation` type.
// FIX: Provided the required generic type arguments for the Operation type.
export const checkVideoStatus = async(operation: Operation<GenerateVideosResponse, GenerateVideosMetadata>): Promise<Operation<GenerateVideosResponse, GenerateVideosMetadata>> => {
    const ai = getAIForVideo();
    return await ai.operations.getVideosOperation({operation: operation});
}

export const fetchVideo = async (uri: string): Promise<Blob> => {
    if (!process.env.API_KEY) throw new Error("API Key not available for fetching video");
    const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error("Failed to fetch video data");
    }
    return response.blob();
};


export const generateSpeech = async(text: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this calmly: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if(!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
}