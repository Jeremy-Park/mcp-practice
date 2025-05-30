import {
  ChatSession,
  Content,
  FunctionDeclaration,
  GenerativeModel,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  Part,
  SchemaType,
} from '@google/generative-ai';
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
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  // Define the function/tool for Gemini
  private readonly tools: FunctionDeclaration[] = [
    {
      name: GeminiToolName.GET_CURRENT_WEATHER,
      description:
        'Get the current weather forecast for a given location (city name). Use this tool whenever a user asks about the weather.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          location: {
            type: SchemaType.STRING,
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
        "Get the user's location in coordinates. This tool returns latitude and longitude for user location. Use this tool whenever you need to know the user's location.",
    },
  ];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Use a model that supports function calling, e.g., 'gemini-1.5-flash' or 'gemini-pro' (check latest docs)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest', // Updated to a model known for function calling
      tools: [{ functionDeclarations: this.tools }],
      systemInstruction:
        "You are a helpful assistant. When asked about the weather, you must use the 'get_current_weather' tool to get the information. " +
        'Do not try to answer weather questions from your own knowledge. Always use the tool. ' +
        'If the user asks a general question, answer it directly.',
    });
    this.logger.log(
      'GeminiService initialized with model: gemini-1.5-flash-latest, tools, and system instruction',
    );
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.debug(
      `Generating text for prompt: ${prompt.substring(0, 50)}...`,
    );
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
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
   * @returns A promise that resolves to a ChatSession object.
   */
  async startChat(history?: Content[]) {
    return this.model.startChat({
      history,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async sendMessageInChat(
    chatSession: ChatSession,
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
      const result = await chatSession.sendMessage(message);
      const response = result.response;
      const firstCandidate = response.candidates?.[0];

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

      const text = response.text();
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
    chatSession,
    toolResponses: GeminiToolResponse[],
  ): Promise<{ text?: string; functionCall?: GeminiFunctionCall }> {
    this.logger.debug('Sending tool response to Gemini chat:', toolResponses);
    try {
      const result = await chatSession.sendMessage(
        // Construct the specific Part structure Gemini expects for tool responses
        toolResponses.map((toolResponse) => ({
          functionResponse: {
            name: toolResponse.name,
            response: toolResponse.response,
          },
        })),
      );
      const response = result.response;
      // Check for another function call or get the text
      const firstCandidate = response.candidates?.[0];
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
      const text = response.text();
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
