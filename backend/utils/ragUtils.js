const { ChromaClient } = require('chromadb');
const { pipeline } = require('@xenova/transformers');

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const chromaUrlObj = new URL(CHROMA_URL);
const client = new ChromaClient({
    host: chromaUrlObj.hostname,
    port: chromaUrlObj.port || (chromaUrlObj.protocol === "https:" ? 443 : 80),
    ssl: chromaUrlObj.protocol === "https:"
});
const COLLECTION_NAME = "notes_collection";

let extractor = null;

/**
 * Initialize the local embedding model once to prevent reloading
 */
async function getExtractor() {
    if (!extractor) {
        console.log("Loading local embedding model (Xenova)...");
        // We use feature-extraction pipeline with a lightweight model
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true // Smaller, faster
        });
        console.log("Local embedding model loaded.");
    }
    return extractor;
}

/**
 * Generate an embedding for a piece of text locally
 */
async function generateEmbedding(text) {
    const fn = await getExtractor();
    // Generate the tensor, pooling='mean' and normalized=true for semantic search
    const output = await fn(text, { pooling: 'mean', normalize: true });
    // Convert Float32Array to standard JS Array
    return Array.from(output.data);
}

/**
 * Gets or creates the main ChromaDB collection for notes
 */
async function getCollection() {
    return await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { "hnsw:space": "cosine" }
    });
}

/**
 * Text Chunking Function
 * Splits text into ~`size` characters with `overlap` to maintain context
 */
function chunkText(text, size = 1000, overlap = 100) {
    if (!text) return [];

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length <= size) return [text];

    const chunks = [];
    let i = 0;
    while (i < text.length) {
        // Find a natural break before `size` limit
        let endIndex = i + size;
        if (endIndex >= text.length) {
            chunks.push(text.substring(i));
            break;
        }

        // Try to break at a period or newline for clean chunks
        let cutIndex = text.lastIndexOf('. ', endIndex);
        if (cutIndex <= i) {
            cutIndex = text.lastIndexOf('\n', endIndex);
        }
        if (cutIndex <= i) {
            cutIndex = text.lastIndexOf(' ', endIndex);
        }

        // If no clean break found, force cut
        if (cutIndex <= i) {
            cutIndex = endIndex;
        } else {
            cutIndex += 1; // Include the punctuation
        }

        chunks.push(text.substring(i, cutIndex).trim());

        // Move forward, stepping back by overlap
        i = cutIndex - overlap;
        if (i <= 0) i = cutIndex; // Prevent infinite loops
    }

    return chunks.filter(c => c.length > 0);
}

/**
 * Process a document, chunk it, embed locally, and insert to ChromaDB
 */
async function ingestDocumentToChroma(noteId, title, text) {
    try {
        console.log(`Starting ingestion for document: ${title}`);
        const collection = await getCollection();

        // Chunk the text
        const chunks = chunkText(text, 1000, 100);
        console.log(`Generated ${chunks.length} chunks for ${title}`);

        const ids = [];
        const embeddings = [];
        const metadatas = [];
        const documents = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // 1️⃣ Generate local embedding
            const embedding = await generateEmbedding(chunk);

            ids.push(`${noteId}_chunk_${i}`);
            embeddings.push(embedding);

            // 2️⃣ Add structured metadata
            metadatas.push({
                noteId: noteId.toString(),
                title: title,
                chunkIndex: i,
                source: "pdf-text"
            });
            documents.push(chunk);
        }

        // Batch insert/upsert into ChromaDB
        if (ids.length > 0) {
            await collection.upsert({
                ids: ids,
                embeddings: embeddings,
                metadatas: metadatas,
                documents: documents
            });
            console.log(`Successfully ingested ${ids.length} chunks to ChromaDB for ${title}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error ingesting document to ChromaDB:", error);
        return false;
    }
}

/**
 * Query ChromaDB using local embedding and metadata filters
 */
async function queryRelevantChunks(question, limit = 4, filterNoteId = null) {
    try {
        const collection = await getCollection();

        // Embed the query locally
        const queryEmbedding = await generateEmbedding(question);

        // Optional metadata filter
        let where = undefined;
        if (filterNoteId && filterNoteId !== 'all') {
            where = { noteId: filterNoteId.toString() };
        }

        // Vector search
        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit, // Top K
            where: where
        });

        // Results come in arrays of arrays [ [chunk1, chunk2...] ]
        if (results && results.documents && results.documents.length > 0) {
            // Map the matched chunks alongside their metadata score
            const matchedChunks = results.documents[0];
            const matchedMeta = results.metadatas[0];

            return matchedChunks.map((text, i) => ({
                text: text,
                metadata: matchedMeta[i]
            }));
        }

        return [];
    } catch (error) {
        console.error("Error querying ChromaDB:", error);
        return [];
    }
}

module.exports = {
    chunkText,
    ingestDocumentToChroma,
    queryRelevantChunks
};
