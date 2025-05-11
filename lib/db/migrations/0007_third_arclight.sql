DROP TABLE IF EXISTS "Document";--> statement-breakpoint
DROP TABLE IF EXISTS "Suggestion";--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "selectedChatModelId" varchar(255);