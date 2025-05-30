import { Content } from '@google/genai';

// ----------------------------------------------------------------------

export interface ChatRequestPayload {
  message: string;
  history?: Content[];
}
