import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   * Guest users message limit
   */
  guest: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['kai-stoic', 'neo-founder', 'min-sage'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['kai-stoic', 'neo-founder', 'min-sage'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
