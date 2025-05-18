export const DEFAULT_CHAT_MODEL: string = 'aristotle';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'aristotle',
    name: 'Aristotle',
    description: 'Know yourself. Then act accordingly.',
  },
  {
    id: 'naval',
    name: 'Naval Ravikant',
    description: 'Play long-term games with long-term people.',
  },
  {
    id: 'bible',
    name: 'The Bible',
    description: 'Seek and you shall find.',
  },
];
