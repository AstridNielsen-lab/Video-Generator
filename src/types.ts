export interface ChatMessage {
  isUser: boolean;
  content: string;
}

export interface VideoGenerationResponse {
  video_url: string;
}