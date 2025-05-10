export const DEFAULT_CHAT_MODEL: string = 'max-stoic';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'max-stoic',
    name: 'Max – The Stoic',
    description: '🏛 Master your mind. Live with clarity, courage, and integrity.',
  },
  {
    id: 'neo-founder',
    name: 'Neo – The Founder',
    description: '🚀 Think deeper. Break rules. Build bold and better futures.',
  },
  {
    id: 'jen-sage',
    name: 'Jen – The Sage',
    description: '🌿 Let go. Find stillness, presence, and quiet inner wisdom.',
  },
];
