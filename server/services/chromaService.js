const { ChromaClient } = require('chromadb');

let chromaClient = null;

function getChromaClient() {
  if (!chromaClient) {
    const url = process.env.CHROMA_URL || 'http://localhost:8000';
    chromaClient = new ChromaClient({ path: url });
  }
  return chromaClient;
}

async function getFaqCollection() {
  const client = getChromaClient();
  const collectionName = process.env.CHROMA_COLLECTION || 'banking_faq';
  return await client.getOrCreateCollection({ 
    name: collectionName,
    embeddingFunction: { generate: () => [] } // We pass our own embeddings
  });
}

async function addFaqDocuments(faqs) {
  try {
    const collection = await getFaqCollection();
    const ids = faqs.map(f => `faq_${f._id}`);
    const documents = faqs.map(f => f.body);
    const embeddings = faqs.map(f => f.embedding);
    const metadatas = faqs.map(f => ({
      faq_id: f._id.toString(),
      title: f.title
    }));
    
    await collection.add({
      ids,
      documents,
      embeddings,
      metadatas
    });
    console.log(`Added ${faqs.length} documents to ChromaDB collection.`);
  } catch (err) {
    console.error("ChromaDB Ingestion Error:", err.message);
    throw err;
  }
}

async function searchFAQ(queryEmbedding, topK = 3) {
  try {
    const collection = await getFaqCollection();
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK
    });
    
    // Process results if they exist
    if (results && results.documents && results.documents[0].length > 0) {
      return results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index]
      }));
    }
    return [];
  } catch (err) {
    console.error("ChromaDB Search Error:", err.message);
    throw new Error("FAQ vector search is currently unavailable.");
  }
}

module.exports = {
  addFaqDocuments,
  searchFAQ
};
