export enum GeminiToolName {
  GET_CURRENT_WEATHER = 'get_current_weather',
  GET_USER_LOCATION = 'get_user_location',
  GET_ANIME_BY_ID = 'get_anime_by_id',
  GET_ANIME_SEARCH = 'get_anime_search',
  GET_ANIME_PICTURES = 'get_anime_pictures',
  GET_TOP_ANIME = 'get_top_anime',
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface GeminiToolResponse {
  name: string;
  response: Record<string, any>;
}
