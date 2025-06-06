import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { anthropic } from '@ai-sdk/anthropic';
import { isTestEnvironment } from '../constants';
import { openai } from '@ai-sdk/openai';
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
        'title-model':  google('gemini-2.0-flash'),
        //'persona-base': google('gemini-2.0-flash'),
        //'persona-base': anthropic('claude-3-5-haiku-20241022'),
        'persona-base': openai('gpt-4o-mini'),
        'persona-reasoning': wrapLanguageModel({
          //model: google('gemini-2.5-pro-exp-03-25'),
          model:deepseek('deepseek-reasoner'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        
      },
    });
