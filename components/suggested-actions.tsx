'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
  selectedChatModel: string;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
  selectedChatModel,
}: SuggestedActionsProps) {
  const getModelQuestions = (modelId: string) => {
    switch (modelId) {
      case 'kai-stoic':
        return [
          {
            title: "I'm upset about something",
            label: "I can't control. How should I handle it?",
            action: "I'm upset about something I can't control. How should I handle it?",
          },
          {
            title: "I feel jealous when others",
            label: "get credit for my work. How to respond?",
            action: "I feel jealous when others get credit for my work. How to respond?",
          },
          {
            title: "How can I start each morning",
            label: "with more calm and focus?",
            action: "How can I start each morning with more calm and focus?",
          },
          {
            title: "I have two job offers—one pays more,",
            label: "one feels right. How do I choose?",
            action: "I have two job offers—one pays more, one feels right. How do I choose?",
          },
        ];
      
      case 'neo-founder':
        return [
          {
            title: "How do I break this big problem",
            label: "into smaller, basic parts?",
            action: "How do I break this big problem into smaller, basic parts?",
          },
          {
            title: "Our workflow is slow—where should",
            label: "I look first to speed things up?",
            action: "Our workflow is slow—where should I look first to speed things up?",
          },
          {
            title: "What's a quick prototype I can build",
            label: "to test a new idea?",
            action: "What's a quick prototype I can build to test a new idea?",
          },
          {
            title: "How can I try a risky idea",
            label: "without spending too much?",
            action: "How can I try a risky idea without spending too much?",
          },
        ];
      
      case 'min-sage':
        return [
          {
            title: "My mind won't stop racing.",
            label: "How can I be more present?",
            action: "My mind won't stop racing. How can I be more present?",
          },
          {
            title: "A negative thought won't go away.",
            label: "How can I let it pass?",
            action: "A negative thought won't go away. How can I let it pass?",
          },
          {
            title: "I need to make an important choice",
            label: "but feel scattered. What helps me find clarity?",
            action: "I need to make an important choice but feel scattered. What helps me find clarity?",
          },
          {
            title: "I'm sad about a loss.",
            label: "How can I gently accept that things change?",
            action: "I'm sad about a loss. How can I gently accept that things change?",
          },
        ];
      
      default:
        // Fallback to Kai's questions if model is unknown
        return [
          {
            title: "I'm upset about something",
            label: "I can't control. How should I handle it?",
            action: "I'm upset about something I can't control. How should I handle it?",
          },
          {
            title: "I feel jealous when others",
            label: "get credit for my work. What's a healthier way to respond?",
            action: "I feel jealous when others get credit for my work. What's a healthier way to respond?",
          },
          {
            title: "How can I start each morning",
            label: "with more calm and focus?",
            action: "How can I start each morning with more calm and focus?",
          },
          {
            title: "I have two job offers—one pays more,",
            label: "one feels right. How do I choose?",
            action: "I have two job offers—one pays more, one feels right. How do I choose?",
          },
        ];
    }
  };

  const suggestedActions = getModelQuestions(selectedChatModel);

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.selectedChatModel !== nextProps.selectedChatModel)
      return false;

    return true;
  },
);
