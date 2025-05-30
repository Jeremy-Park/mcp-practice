import { Injectable, Logger } from '@nestjs/common';
import { JikanQuery } from './jikan.query';
import { Anime, AnimePicture, JikanApiResponse, AnimeSearchStatus, TopAnimeFilter } from './jikan.types';

@Injectable()
export class JikanService {
  private readonly logger = new Logger(JikanService.name);

  constructor(private readonly jikanQuery: JikanQuery) {}

  async getAnimeById(id: number): Promise<JikanApiResponse<Anime>> {
    this.logger.debug(`Fetching anime by ID: ${id}`);
    return this.jikanQuery.getAnimeById(id);
  }

  async getAnimeSearch(query: string, status?: AnimeSearchStatus): Promise<JikanApiResponse<Anime[]>> {
    this.logger.debug(`Searching anime with query: ${query} and status: ${status}`);
    return this.jikanQuery.getAnimeSearch(query, status);
  }

  async getAnimePictures(id: number): Promise<JikanApiResponse<AnimePicture[]>> {
    this.logger.debug(`Fetching pictures for anime ID: ${id}`);
    return this.jikanQuery.getAnimePictures(id);
  }

  async getTopAnime(filter?: TopAnimeFilter): Promise<JikanApiResponse<Anime[]>> {
    this.logger.debug(`Fetching top anime with filter: ${filter}`);
    return this.jikanQuery.getTopAnime(filter);
  }
} 