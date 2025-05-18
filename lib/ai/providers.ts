import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
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
          //model: google('gemini-2.5-pro-exp-03-25'),
          model:deepseek('deepseek-reasoner'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        
      },
    });
