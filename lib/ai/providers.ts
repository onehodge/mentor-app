import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'title-model': titleModel,
        'persona-base': chatModel,
        'persona-reasoning': reasoningModel,
      },
    })
  : customProvider({
      languageModels: {
        'title-model': google('gemini-2.0-flash'),
        'persona-base': google('gemini-2.0-flash'),
        'persona-reasoning': wrapLanguageModel({
          model: google('gemini-2.5-flash-preview-04-17'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
      },
    });
