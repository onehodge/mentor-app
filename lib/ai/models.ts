export const DEFAULT_CHAT_MODEL: string = 'kai-stoic';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'kai-stoic',
    name: 'Kai – The Stoic',
    description: '🏛 Master your mind. Live with clarity, courage, and integrity.',
  },
  {
    id: 'neo-founder',
    name: 'Neo – The Founder',
    description: '🚀 Think deeper. Break rules. Build bold and better futures.',
  },
  {
    id: 'min-sage',
    name: 'Min – The Sage',
    description: '🌿 Let go. Find stillness, presence, and quiet inner wisdom.',
  },
];
