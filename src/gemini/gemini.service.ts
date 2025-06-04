import {
  Chat,
  Content,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Part,
  Type,
} from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeminiFunctionCall,
  GeminiToolName,
  GeminiToolResponse,
} from './gemini.types';

// ----------------------------------------------------------------------

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenAI;
  private readonly modelName = 'gemini-2.0-flash';
  private readonly systemInstructionContent: Content = {
    parts: [
      {
        text: 'You are a helpful assistant.',
      },
      // @Jacob, you can remove this if it's causing issues
      {
        text: 'User is a realtor.',
      },
      {
        text: "When asked about the user's current location, you must use the 'get_user_location' tool.",
      },
      {
        text: "When asked about the weather, you must use the 'get_current_weather' tool.",
      },
      {
        text: "When asked about anime, you must use the 'get_anime_by_id' tool.",
      },
      {
        text: "When asked about anime search, you must use the 'get_anime_search' tool.",
      },
      {
        text: "When asked about anime pictures, you must use the 'get_anime_pictures' tool.",
      },
      {
        text: "When asked about top anime, you must use the 'get_top_anime' tool.",
      },
      {
        text: "When answering using 'get_top_anime' tool, you must format the response in a markdown format. For each anime, display its rank, title (bold), synopsis (italic), and image (using markdown image syntax ![title Image](imageUrl)). Separate each anime entry with a horizontal rule (---). Start the list with a heading '### Top Anime List'.",
      },
      {
        text: "When asked about places, businesses, or locations, you must use the 'get_google_map' tool.",
      },
      {
        text: "When asked about distances, travel time, or directions between locations, you must use the 'get_google_distance' tool.",
      },
      {
        text: 'For Google Maps searches, always specify North American locations (US, Canada, Mexico) unless the user explicitly asks for other regions.',
      },
      {
        text: "When the user asks for their own realtor profile, their profile, or 'my profile', you must use the 'get_my_realtor_profile' tool.",
      },
      {
        text: "When the user asks to update their name, or their realtor name, you must use the 'update_realtor_name' tool.",
      },
      {
        text: 'When returning email addresses, return the exact email address.',
      },
      {
        text: "Don't try to answer with your own knowledge, if it's about weather, anime, or the user's realtor profile, you must use the appropriate tool.",
      },
      {
        text: 'Always use the appropriate tool.',
      },
      {
        text: 'If a tool needs additional information, check if there are other tools that can provide the required information.',
      },
      {
        text: 'You can use multiple tools in a single response.',
      },
      {
        text: 'If the user asks a general question, answer it directly.',
      },
    ],
  };

  private readonly safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // tools will be defined first
  private readonly tools: FunctionDeclaration[] = [
    {
      name: GeminiToolName.GET_CURRENT_WEATHER,
      description:
        'Get the current weather forecast for a given location (city name). Use this tool whenever a user asks about the weather.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          location: {
            type: Type.STRING,
            description:
              'The city and state, or city and country, e.g., San Francisco, CA or London, UK. Be specific if the user provides details.',
          },
        },
        required: ['location'],
      },
    },
    {
      name: GeminiToolName.GET_USER_LOCATION,
      description:
        "Get the user's location. This tool returns city, state, country, and latitude and longitude for user location. Use this tool whenever you need to know the user's location.",
    },
    {
      name: GeminiToolName.GET_ANIME_BY_ID,
      description: 'Get anime details by its MyAnimeList ID.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.NUMBER,
            description: 'The MyAnimeList ID of the anime.',
          },
        },
        required: ['id'],
      },
    },
    {
      name: GeminiToolName.GET_ANIME_SEARCH,
      description:
        'Search for anime by query string. Can optionally filter by status.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'The search query for the anime.',
          },
          status: {
            type: Type.STRING,
            description:
              "Filter by anime status. Available values: 'airing', 'complete', 'upcoming'.",
            enum: ['airing', 'complete', 'upcoming'],
            nullable: true,
          },
        },
        required: ['query'],
      },
    },
    {
      name: GeminiToolName.GET_ANIME_PICTURES,
      description: 'Get pictures for an anime by its MyAnimeList ID.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.NUMBER,
            description: 'The MyAnimeList ID of the anime.',
          },
        },
        required: ['id'],
      },
    },
    {
      name: GeminiToolName.GET_TOP_ANIME,
      description:
        'Get the top anime series, optionally filtered by a specific criterion.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          filter: {
            type: Type.STRING,
            description:
              "Filter criteria for top anime. Available values: 'airing', 'upcoming', 'bypopularity', 'favorite'.",
            enum: ['airing', 'upcoming', 'bypopularity', 'favorite'],
            nullable: true,
          },
        },
      },
    },
    {
      name: GeminiToolName.GET_GOOGLE_MAP,
      description:
        'Search for places using Google Maps Places API. Can find businesses, landmarks, and locations.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description:
              'The search query for places (e.g., "restaurants near me", "Starbucks in New York", "gas stations")',
          },
          location: {
            type: Type.STRING,
            description:
              'Optional location to center the search (e.g., "New York, NY", "37.7749,-122.4194")',
            nullable: true,
          },
          radius: {
            type: Type.NUMBER,
            description:
              'Optional search radius in meters (default: 5000, max: 50000)',
            nullable: true,
          },
        },
        required: ['query'],
      },
    },
    {
      name: GeminiToolName.GET_GOOGLE_DISTANCE,
      description:
        'Calculate distance and travel time between locations using Google Maps Distance Matrix API.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          origins: {
            type: Type.STRING,
            description:
              'Starting location(s) - can be address, place name, or coordinates',
          },
          destinations: {
            type: Type.STRING,
            description:
              'Destination location(s) - can be address, place name, or coordinates',
          },
          mode: {
            type: Type.STRING,
            description: 'Travel mode for distance calculation',
            enum: ['driving', 'walking', 'bicycling', 'transit'],
            nullable: true,
          },
        },
        required: ['origins', 'destinations'],
      },
    },
    {
      name: GeminiToolName.GET_MY_REALTOR_PROFILE,
      description:
        "Get the currently authenticated user's realtor profile. This tool does not require any parameters from the user.",
      response: {
        type: Type.OBJECT,
        properties: {
          email: { type: Type.STRING },
          name: { type: Type.STRING },
        },
      },
    },
    {
      name: GeminiToolName.UPDATE_REALTOR_NAME,
      description:
        "Update the currently authenticated user's realtor profile name. This tool does not require any parameters from the user.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
        },
        required: ['name'],
      },
      response: {
        type: Type.OBJECT,
        properties: {
          email: { type: Type.STRING },
          name: { type: Type.STRING },
        },
      },
    },
  ];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenAI({ apiKey });

    this.logger.log(
      `GeminiService initialized and configured for model: ${this.modelName}`,
    );
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.debug(
      `Generating text for prompt: ${prompt.substring(0, 50)}...`,
    );
    try {
      const result = await this.genAI.models.generateContent({
        contents: [{ parts: [{ text: prompt }], role: 'user' }],
        config: {
          systemInstruction: this.systemInstructionContent,
          safetySettings: this.safetySettings,
          toolConfig: {
            functionCallingConfig: {
              // Force it to call any function
              mode: FunctionCallingConfigMode.AUTO,
              // allowedFunctionNames: [GeminiToolName.GET_CURRENT_WEATHER],
            },
          },
          tools: [{ functionDeclarations: this.tools }],
        },
        model: this.modelName,
      });
      const text = result.text;
      if (text === undefined) {
        this.logger.warn('Gemini response text is undefined.');
        throw new Error('Failed to get text from Gemini response.');
      }
      this.logger.debug('Text generated successfully.');
      return text;
    } catch (error) {
      this.logger.error(
        `Error generating text from Gemini: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate text from Gemini: ${error.message}`);
    }
  }

  /**
   * Starts a new chat session with the Gemini model.
   *
   * @param history Optional. A an array of previous Content objects to prime the model with.
   * @returns A promise that resolves to a ChatSession object (type inferred).
   */
  async startChat(history?: Content[]) {
    return this.genAI.chats.create({
      config: {
        systemInstruction: this.systemInstructionContent,
        safetySettings: this.safetySettings,
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
            // allowedFunctionNames: [GeminiToolName.GET_CURRENT_WEATHER],
          },
        },
        tools: [{ functionDeclarations: this.tools }],
      },
      model: this.modelName,
      history,
    });
  }

  async sendMessageInChat(
    chat: Chat,
    message: string,
  ): Promise<{
    text?: string;
    functionCall?: GeminiFunctionCall;
    toolResponses?: GeminiToolResponse[];
  }> {
    this.logger.debug(
      `Sending message in chat: ${message.substring(0, 50)}...`,
    );
    try {
      const result = await chat.sendMessage({ message: [{ text: message }] });
      const firstCandidate = result.candidates?.[0];

      if (firstCandidate?.content?.parts) {
        for (const part of firstCandidate.content.parts) {
          if (part.functionCall) {
            this.logger.log(
              'Gemini requested function call:',
              part.functionCall,
            );
            return { functionCall: part.functionCall as GeminiFunctionCall };
          }
        }
      }
      const text = result.text;
      this.logger.debug('Chat response received (text): successfully.');
      return { text };
    } catch (error) {
      this.logger.error(
        `Error sending message in Gemini chat: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to send message in Gemini chat: ${error.message}`,
      );
    }
  }

  async sendToolResponseToChat(
    chatSession: Chat,
    toolResponses: GeminiToolResponse[],
  ): Promise<{ text?: string; functionCall?: GeminiFunctionCall }> {
    this.logger.debug('Sending tool response to Gemini chat:', toolResponses);
    try {
      const messageContent = toolResponses.map((toolResponse) => ({
        functionResponse: {
          name: toolResponse.name,
          response: toolResponse.response,
        },
      })) as Part[];
      const result = await chatSession.sendMessage({ message: messageContent });
      const firstCandidate = result.candidates?.[0];
      if (firstCandidate?.content?.parts) {
        for (const part of firstCandidate.content.parts) {
          if (part.functionCall) {
            this.logger.log(
              'Gemini requested another function call:',
              part.functionCall,
            );
            return { functionCall: part.functionCall as GeminiFunctionCall };
          }
        }
      }
      const text = result.text;
      this.logger.debug(
        'Final text response after tool use received successfully.',
      );
      return { text };
    } catch (error) {
      this.logger.error(
        'Error sending tool response to Gemini chat:',
        error.stack,
      );
      throw new Error('Failed to send tool response to Gemini chat');
    }
  }
}
