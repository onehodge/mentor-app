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
        'max-stoic': chatModel,
        'neo-founder': chatModel,
        'jen-sage': chatModel,
        'title-model': titleModel,
      },
    })
  : customProvider({
      languageModels: {
        'max-stoic': google('gemini-2.0-flash'),
        'neo-founder': google('gemini-2.0-flash'),
        'jen-sage': google('gemini-2.0-flash'),
        'title-model': google('gemini-2.0-flash'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
