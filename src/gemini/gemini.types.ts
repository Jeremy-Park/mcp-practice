export interface GeminiFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GeminiToolResponse {
  name: string;
  response: Record<string, any>;
}
