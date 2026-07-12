export type MessageType = 'location' | 'text' | 'link' | 'image' | 'unknown';

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'needs_manual_review'
  | 'failed'
  | 'out_of_service_area';

export interface IncomingMessage {
  id: string;
  whatsapp_message_id: string;
  sender_phone: string;
  message_type: MessageType;
  raw_payload: Record<string, unknown>;
  processed: boolean;
  processing_status: ProcessingStatus;
  student_id: string | null;
  received_at: string;
  processed_at: string | null;
}

export interface ParsedLocation {
  latitude: number;
  longitude: number;
  source: 'pin' | 'link' | 'text';
  confidence: number;
  address_text?: string;
}

export interface ClassificationResult {
  type: MessageType;
  location?: ParsedLocation;
  needsGeocoding?: boolean;
  rawText?: string;
  flagReason?: string;
}
