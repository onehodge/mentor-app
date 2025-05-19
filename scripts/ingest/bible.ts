import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg'; // Assuming 'pg' library for PostgreSQL

// --- Configuration ---
const CSV_FILE_PATH = path.resolve(__dirname, '../../data/raw/asv.csv');
const TARGET_CHUNK_TOKEN_COUNT_MIN = 350;
const TARGET_CHUNK_TOKEN_COUNT_MAX = 450;
const CHUNK_OVERLAP_TOKEN_COUNT = 40;
const PERSONA_TAG = 'pastor';
const LOG_INTERVAL = 50; // Log progress every 50 chunks

// --- Type Definitions ---
interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  // A simple token count, can be replaced with a more sophisticated tokenizer
  tokenCount?: number;
}

interface Chunk {
  id: string; // UUID
  ref: string; // e.g., "John 3:1-21"
  book: string;
  chapterStart: number;
  verseStart: number;
  verseEnd: number;
  text: string; // Concatenated text of all verses in the chunk
  embedding?: number[];
}

// Placeholder for your actual embedding function
// This should be available in your project and imported correctly
async function embed(text: string): Promise<number[]> {
  console.warn(
    `WARN: Using placeholder embed function. Replace with your actual embedding model. Text length: ${text.length}`
  );
  // Simulate an embedding vector; replace with actual embedding call
  // The length of this vector should match your pgvector dimension
  return Array(1536).fill(0).map(() => Math.random());
}

// --- Database Connection ---
// Configure your PostgreSQL connection details, likely via environment variables
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'rag_db',
  password: process.env.PGPASSWORD || 'password',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
});

// --- Core Logic Functions ---

/**
 * Parses the CSV file, skipping specified header/license rows,
 * and maps each line to a Verse object.
 */
async function parseCSV(filePath: string, skipRows: number = 1): Promise<Verse[]> {
  console.log(`Parsing CSV file: ${filePath}`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const verses: Verse[] = [];

  console.log(`Total lines in CSV: ${lines.length}`);

  for (let i = skipRows; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    // Assuming CSV format: Book,Chapter,Verse,Text
    // Example line: "Genesis,1,1,"In the beginning God created the heaven and the earth."
    // Need to handle cases where text itself might contain commas, so simple split by ',' might not be robust.
    // A more robust CSV parser might be needed for complex CSVs.
    // For this specific format, let's try to find the first three commas for book, chapter, verse
    
    const parts = [];
    let remainingLine = line;
    let parseError = false;

    for (let j = 0; j < 3; j++) {
      const commaIndex = remainingLine.indexOf(',');
      if (commaIndex === -1 && j < 2) { // Missing comma for book or chapter
        console.warn(`Skipping malformed line (missing comma for book/chapter): ${line.substring(0, 100)}...`);
        parseError = true;
        break;
      }
      if (commaIndex === -1 && j === 2) { // No comma before text, means text is last part
        parts.push(remainingLine.trim());
        remainingLine = '';
        break;
      }
      parts.push(remainingLine.substring(0, commaIndex).trim());
      remainingLine = remainingLine.substring(commaIndex + 1);
    }
    if (parseError) continue;

    if (parts.length === 3) { // The rest is text
        parts.push(remainingLine.trim());
    }

    if (parts.length === 4) {
      const [book, chapterStr, verseStr, rawText] = parts;
      const chapter = parseInt(chapterStr, 10);
      const verse = parseInt(verseStr, 10);

      if (!book || isNaN(chapter) || isNaN(verse) || typeof rawText !== 'string') {
        console.warn(`Skipping malformed line (parsing error): ${line.substring(0,100)}...`);
        continue;
      }

      const normalizedText = normalizeText(rawText);
      verses.push({
        book,
        chapter,
        verse,
        text: normalizedText,
        tokenCount: normalizedText.split(' ').length, // Simple space-based token count
      });
    } else {
      // Log lines that don't conform to the expected 4-part structure after splitting
      // This helps identify issues with CSV formatting or the parsing logic itself.
      if (line.length > 0) { // Avoid logging warnings for potentially empty trailing lines
          console.warn(`Skipping malformed line (expected 4 parts, got ${parts.length}): ${line.substring(0, 100)}...`);
      }
    }
  }

  console.log(`Successfully parsed ${verses.length} verses.`);
  return verses;
}

/**
 * Normalizes text by stripping extra quotes, collapsing whitespace,
 * and ensuring consistent punctuation.
 */
function normalizeText(inputText: string): string {
  let text = inputText.trim();
  // Remove leading/trailing double quotes if they enclose the whole string
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.substring(1, text.length - 1);
  }
  // Collapse multiple whitespace characters (including newlines) into a single space
  text = text.replace(/\s+/g, ' ');
  // Further punctuation normalization can be added here if needed
  // e.g., standardizing ellipses, ensuring space after commas/periods.
  return text;
}

/**
 * Chunks verses into logical passages of roughly TARGET_CHUNK_TOKEN_COUNT tokens,
 * with CHUNK_OVERLAP_TOKEN_COUNT token overlap.
 * Generates metadata for each chunk.
 */
async function chunkVerses(verses: Verse[]): Promise<Chunk[]> {
  console.log('Chunking verses...');
  const chunks: Chunk[] = [];
  if (verses.length === 0) return chunks;

  let currentVerseIndex = 0;
  while (currentVerseIndex < verses.length) {
    const firstVerseOfChunk = verses[currentVerseIndex];
    const currentChunkVerses: Verse[] = [];
    let currentChunkTokenCount = 0;
    let lastVerseOfChunk = firstVerseOfChunk;

    // Add verses to the current chunk
    for (let i = currentVerseIndex; i < verses.length; i++) {
      const verse = verses[i];

      // Ensure same book and chapter
      if (verse.book !== firstVerseOfChunk.book || verse.chapter !== firstVerseOfChunk.chapter) {
        break; // New chapter or book, finalize current chunk
      }

      const prospectiveTokenCount = currentChunkTokenCount + (verse.tokenCount || 0);

      if (currentChunkVerses.length > 0 && prospectiveTokenCount > TARGET_CHUNK_TOKEN_COUNT_MAX) {
        // Adding this verse would exceed max tokens, finalize with previous verses
        // However, if this is the *first* verse being considered for a new chunk (after overlap logic),
        // and it alone exceeds MAX, we must include it to avoid infinite loop.
        break;
      }
      
      currentChunkVerses.push(verse);
      currentChunkTokenCount += (verse.tokenCount || 0);
      lastVerseOfChunk = verse;

      if (currentChunkTokenCount >= TARGET_CHUNK_TOKEN_COUNT_MIN) {
        // Chunk is large enough, check if next verse would make it too large
        if (i + 1 < verses.length) {
          const nextVerse = verses[i+1];
          if (nextVerse.book !== firstVerseOfChunk.book || 
              nextVerse.chapter !== firstVerseOfChunk.chapter || 
              currentChunkTokenCount + (nextVerse.tokenCount || 0) > TARGET_CHUNK_TOKEN_COUNT_MAX) {
            break; // Next verse starts new group or makes chunk too large
          }
        }
        // If it doesn't make it too large, the loop will continue to add more verses
        // up to TARGET_CHUNK_TOKEN_COUNT_MAX
      }
    }

    if (currentChunkVerses.length > 0) {
      const concatenatedText = currentChunkVerses.map(v => v.text).join(' ');
      const ref = currentChunkVerses.length === 1
        ? `${firstVerseOfChunk.book} ${firstVerseOfChunk.chapter}:${firstVerseOfChunk.verse}`
        : `${firstVerseOfChunk.book} ${firstVerseOfChunk.chapter}:${firstVerseOfChunk.verse}-${lastVerseOfChunk.verse}`;

      chunks.push({
        id: uuidv4(),
        ref,
        book: firstVerseOfChunk.book,
        chapterStart: firstVerseOfChunk.chapter,
        verseStart: firstVerseOfChunk.verse,
        verseEnd: lastVerseOfChunk.verse,
        text: concatenatedText,
      });

      // Determine starting index for the next chunk to achieve overlap
      if (currentChunkTokenCount > CHUNK_OVERLAP_TOKEN_COUNT && currentVerseIndex + currentChunkVerses.length < verses.length) {
        let overlapTokens = 0;
        let overlapIndex = currentChunkVerses.length - 1;
        for (; overlapIndex > 0; overlapIndex--) {
          overlapTokens += (currentChunkVerses[overlapIndex].tokenCount || 0);
          if (overlapTokens >= CHUNK_OVERLAP_TOKEN_COUNT) {
            break;
          }
        }
        // currentVerseIndex for next iteration should be the global index of currentChunkVerses[overlapIndex]
        // The verse `currentChunkVerses[overlapIndex]` is `verses[currentVerseIndex + overlapIndex]`
        currentVerseIndex = currentVerseIndex + overlapIndex;
      } else {
        // Not enough tokens for substantial overlap, or at the end of verses
        // Simply move to the verse after the current chunk
        currentVerseIndex += currentChunkVerses.length;
      }
    } else {
      // Should not happen if verses array is not empty, but as a safeguard
      currentVerseIndex++;
    }
  }

  console.log(`Generated ${chunks.length} chunks.`);
  return chunks;
}

/**
 * Computes embeddings for each chunk and upserts them into the snippets table.
 */
async function embedAndUpsertChunks(chunks: Chunk[]): Promise<void> {
  console.log('Embedding and upserting chunks...');
  let insertedCount = 0;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 1. Compute embedding
      chunk.embedding = await embed(chunk.text);

      // 2. Upsert chunk
      // Ensure your 'snippets' table has a unique constraint on 'id' for the ON CONFLICT clause.
      // The 'embedding' column should be of type 'vector(dimension)' e.g. vector(1536)
      const query = `
        INSERT INTO snippets (id, ref, book, chapter_start, verse_start, verse_end, text, embedding, persona)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9)
        ON CONFLICT (id) DO UPDATE SET
          ref = EXCLUDED.ref,
          book = EXCLUDED.book,
          chapter_start = EXCLUDED.chapter_start,
          verse_start = EXCLUDED.verse_start,
          verse_end = EXCLUDED.verse_end,
          text = EXCLUDED.text,
          embedding = EXCLUDED.embedding,
          persona = EXCLUDED.persona;
      `;
      // Note: pgvector expects embeddings as a string like '[1,2,3]'
      const embeddingString = `[${chunk.embedding.join(',')}]`;
      
      await client.query(query, [
        chunk.id,
        chunk.ref,
        chunk.book,
        chunk.chapterStart,
        chunk.verseStart,
        chunk.verseEnd,
        chunk.text,
        embeddingString,
        PERSONA_TAG,
      ]);

      insertedCount++;
      if (insertedCount % LOG_INTERVAL === 0) {
        console.log(`Inserted ${insertedCount} chunks...`);
      }
    }

    await client.query('COMMIT'); // Commit transaction
    console.log(`Successfully inserted/updated ${insertedCount} chunks.`);
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error('Error during embedding and upserting chunks:', error);
    throw error; // Re-throw to be caught by the main execution block
  } finally {
    client.release();
  }
}

// --- Main Execution ---
async function main() {
  console.log('Starting pastor data ingestion pipeline...');
  try {
    // Step 1: Parse CSV
    // Assuming the first row is a header, so skipRows = 1.
    // Adjust if your CSV has more non-data rows at the beginning.
    const verses = await parseCSV(CSV_FILE_PATH, 1);
    if (verses.length === 0) {
      console.warn('No verses parsed. Check CSV file and parsing logic.');
      return;
    }

    // Step 2: Chunk Verses
    // The normalizeText function will be called internally by chunkVerses or parseCSV
    const chunks = await chunkVerses(verses);
    if (chunks.length === 0) {
      console.warn('No chunks generated. Check chunking logic.');
      return;
    }

    // Step 3: Embed and Upsert Chunks
    await embedAndUpsertChunks(chunks);

    console.log('pastor data ingestion pipeline completed successfully.');
  } catch (error) {
    console.error('Fatal error in ingestion pipeline:', error);
    process.exit(1); // Exit with non-zero code on failure
  } finally {
    await pool.end(); // Close database connection pool
    console.log('Database pool closed.');
  }
}

main().catch(error => {
  console.error('Unhandled error in main execution:', error);
  process.exit(1);
}); 
