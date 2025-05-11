DROP TABLE IF EXISTS "Document";--> statement-breakpoint
DROP TABLE IF EXISTS "Suggestion";--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "selectedChatModelId" varchar(255);