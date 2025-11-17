export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type FeatureID = 
  | 'chat'
  | 'image_gen'
  | 'image_edit'
  | 'video_gen'
  | 'live_chat'
  | 'web_analyzer'
  | 'tts'
  | 'bookmarks'
  | 'downloads';

export interface GroundingChunk {
  web?: {
    // FIX: made uri optional to match SDK type
    uri?: string;
    // FIX: made title optional to match SDK type
    title?: string;
  };
  maps?: {
    // FIX: made uri optional to match SDK type
    uri?: string;
    // FIX: made title optional to match SDK type
    title?: string;
    // FIX: Changed placeAnswerSources from an array to an object to match the SDK type.
    placeAnswerSources?: {
      // FIX: Corrected reviewSnippets type to match the Gemini SDK. The error indicates the `review` property is a string (the text), not a nested object. The `uri` is a sibling property.
      reviewSnippets: {
        uri?: string;
        review?: string;
      }[];
    };
  };
}

// New Interfaces for Browser Features

export interface Tab {
  id: string;
  history: string[];
  currentIndex: number;
  title: string;
  favicon: string | null;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  progress: number; // 0-100
  receivedBytes: number;
  totalBytes: number;
  startTime: number;
}