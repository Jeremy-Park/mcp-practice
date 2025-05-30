export enum GeminiToolName {
  GET_CURRENT_WEATHER = 'get_current_weather',
  GET_USER_LOCATION = 'get_user_location',
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GeminiToolResponse {
  name: string;
  response: Record<string, any>;
}
