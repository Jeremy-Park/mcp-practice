import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { JIKAN_API_BASE_URL } from './jikan.constants';
import { Anime, AnimePicture, JikanApiResponse, AnimeSearchStatus, TopAnimeFilter } from './jikan.types';

@Injectable()
export class JikanQuery {
  private readonly logger = new Logger(JikanQuery.name);
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: JIKAN_API_BASE_URL,
      timeout: 10000, // 10 seconds timeout
    });
  }

  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<JikanApiResponse<T>> {
    try {
      this.logger.debug(`Calling Jikan API: ${endpoint} with params: ${JSON.stringify(params)}`);
      const response = await this.http.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.logger.error(`Error calling Jikan API endpoint ${endpoint}: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch data from Jikan API: ${error.message}`);
    }
  }

  async getAnimeById(id: number): Promise<JikanApiResponse<Anime>> {
    return this.get<Anime>(`/anime/${id}`);
  }

  async getAnimeSearch(query: string, status?: AnimeSearchStatus): Promise<JikanApiResponse<Anime[]>> {
    const params: Record<string, any> = { q: query };
    if (status) {
      params.status = status;
    }
    return this.get<Anime[]>('/anime', params);
  }

  async getAnimePictures(id: number): Promise<JikanApiResponse<AnimePicture[]>> {
    return this.get<AnimePicture[]>(`/anime/${id}/pictures`);
  }

  async getTopAnime(filter?: TopAnimeFilter): Promise<JikanApiResponse<Anime[]>> {
    const params: Record<string, any> = {};
    if (filter) {
      params.filter = filter;
    }
    return this.get<Anime[]>('/top/anime', params);
  }
} 