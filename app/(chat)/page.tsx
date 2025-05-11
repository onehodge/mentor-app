import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export default async function Page(props: {
  searchParams?: {
    modelId?: string;
  };
}) {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  // Determine the initial chat model for a new chat
  // Priority:
  // 1. modelId from query parameter (e.g., when redirected from an existing chat)
  // 2. Model ID from the user's cookie
  // 3. Default chat model
  const modelIdFromQuery = props.searchParams?.modelId;
  const initialChatModelToUse =
    modelIdFromQuery || modelIdFromCookie?.value || DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={initialChatModelToUse} // Use the determined model
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
    </>
  );
}
