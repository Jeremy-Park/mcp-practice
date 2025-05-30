import { Content } from '@google/generative-ai';

// ----------------------------------------------------------------------

export interface ChatRequestPayload {
  message: string;
  history?: Content[];
}
