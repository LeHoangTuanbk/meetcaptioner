export interface SavedCaption {
  speaker: string;
  text: string;
  translation?: string;
  time: string;
  timestamp: number;
}

export interface SavedChatMessage {
  id: string;
  author: string;
  time: string;
  text: string;
  timestamp: number;
}

export interface MeetingSession {
  id: string;
  meetingUrl: string;
  meetingCode: string;
  title?: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
  chatMessages?: SavedChatMessage[];
  notes?: string;
}
