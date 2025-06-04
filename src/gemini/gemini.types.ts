export enum GeminiToolName {
  GET_ANIME_BY_ID = 'get_anime_by_id',
  GET_ANIME_PICTURES = 'get_anime_pictures',
  GET_ANIME_SEARCH = 'get_anime_search',
  GET_CURRENT_WEATHER = 'get_current_weather',
  GET_GOOGLE_DISTANCE = 'get_google_distance',
  GET_GOOGLE_MAP = 'get_google_map',
  GET_MY_REALTOR_PROFILE = 'get_my_realtor_profile',
  GET_TOP_ANIME = 'get_top_anime',
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
