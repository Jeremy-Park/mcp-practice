import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // For chat, use a specific model like 'gemini-pro' or a newer one if available
    // For text generation, you can also use 'gemini-pro'
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.logger.log('GeminiService initialized with model: gemini-pro');
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.debug(`Generating text for prompt: ${prompt.substring(0, 50)}...`);
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      this.logger.debug('Text generated successfully.');
      return text;
    } catch (error) {
      this.logger.error(`Error generating text from Gemini: ${error.message}`, error.stack);
      throw new Error(`Failed to generate text from Gemini: ${error.message}`);
    }
  }

  async startChat(history?: any[]) {
    // TODO: Implement chat history management if needed
    // For now, we get a fresh chat session each time this might be called
    // or use a model that supports direct chat turns without an explicit chat session object
    return this.model.startChat({
      history: history || [],
      // Safety settings can be adjusted here
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

  async sendMessageInChat(chatSession, message: string): Promise<string> {
    this.logger.debug(`Sending message in chat: ${message.substring(0,50)}...`);
    try {
      const result = await chatSession.sendMessage(message);
      const response = result.response;
      const text = response.text();
      this.logger.debug('Chat response received successfully.');
      return text;
    } catch (error) {
      this.logger.error(`Error sending message in Gemini chat: ${error.message}`, error.stack);
      throw new Error(`Failed to send message in Gemini chat: ${error.message}`);
    }
  }

  // You might want to add more sophisticated chat handling, including history management.
} 