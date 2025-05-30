import {
  Chat,
  Content,
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
        text:
          "You are a helpful assistant. " +
          "When asked about the weather, you must use the 'get_current_weather' tool. " +
          "When asked about the user's current location, you must use the 'get_user_location' tool. " +
          "Always use the appropriate tool. " +
          "If a tool needs additional information, check if there are other tools that can provide the required information. " +
          "You can use multiple tools in a single response. " +
          "If the user asks a general question, answer it directly.",
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
  ];

  private readonly toolList;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenAI({ apiKey });

    // Initialize toolList after tools is defined
    this.toolList = [{ functionDeclarations: this.tools }];

    this.logger.log(
      `GeminiService initialized and configured for model: ${this.modelName}`,
    );
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.debug(
      `Generating text for prompt: ${prompt.substring(0, 50)}...`,
    );
    try {
      const request = {
        model: this.modelName,
        contents: [{ parts: [{ text: prompt }], role: 'user' }],
        tools: this.toolList,
        systemInstruction: this.systemInstructionContent,
        safetySettings: this.safetySettings,
      };
      const result = await this.genAI.models.generateContent(request);
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
    const params = {
      model: this.modelName,
      history,
      safetySettings: this.safetySettings,
      tools: this.toolList,
      systemInstruction: this.systemInstructionContent,
    };
    return this.genAI.chats.create(params);
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
