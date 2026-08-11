import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import chromadb
import requests
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("LLM_API_KEY")

if not api_key:
    print("WARNING: LLM_API_KEY not set")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-3.5-flash')

app = Flask(__name__)
CORS(app)

# Initialize ChromaDB
client = chromadb.PersistentClient(path="./chroma_data")

class CustomGeminiEmbeddingFunction(chromadb.EmbeddingFunction):
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    def __call__(self, input: list) -> list:
        embeddings = []
        for text in input:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={self.api_key}"
            payload = {
                "model": "models/gemini-embedding-2",
                "content": {"parts": [{"text": text}]}
            }
            res = requests.post(url, json=payload).json()
            embeddings.append(res['embedding']['values'])
        return embeddings

custom_ef = CustomGeminiEmbeddingFunction(api_key=api_key)

def get_collection():
    return client.get_collection(name="banking_faq", embedding_function=custom_ef)

@app.route('/api/ai/faq', methods=['POST'])
def ask_faq():
    data = request.json
    question = data.get('question')
    if not question:
        return jsonify({"success": False, "error": "Question required"}), 400
        
    try:
        collection = get_collection()
    except Exception as e:
        print("ChromaDB Error:", str(e))
        return jsonify({"success": False, "error": "FAQ vector search is currently unavailable."}), 503
        
    try:
        results = collection.query(
            query_texts=[question],
            n_results=3
        )
        
        # Filter by distance if available, otherwise just use all
        relevant_docs = []
        if results['distances'] and results['distances'][0]:
            for i, distance in enumerate(results['distances'][0]):
                if distance < 0.6: # distance threshold
                    relevant_docs.append({
                        "content": results['documents'][0][i],
                        "title": results['metadatas'][0][i]['title']
                    })
        else:
            # Fallback if distances aren't computed correctly
            for i in range(len(results['documents'][0])):
                relevant_docs.append({
                    "content": results['documents'][0][i],
                    "title": results['metadatas'][0][i]['title']
                })
                
        if not relevant_docs:
            return jsonify({
                "success": True,
                "data": {
                    "answer": "I couldn't find this information in the available product FAQs.",
                    "sources": []
                }
            })
            
        context = "\n\n".join([f"{d['title']}: {d['content']}" for d in relevant_docs])
        
        system_prompt = f"""You are a banking product FAQ assistant.

Answer the user's question using ONLY the supplied FAQ context.

Rules:
- Do not use general knowledge.
- Do not invent information.
- Do not infer unsupported banking policies.
- Do not change numbers, rates, limits, dates, or conditions.
- If the answer is not contained in the retrieved context, state that the information is unavailable.
- Keep the answer concise.
- Do not expose internal reasoning.
- Return only valid JSON matching this schema:
{{
  "answer": "string",
  "sources": [
    {{
      "title": "string"
    }}
  ]
}}

RETRIEVED FAQ CONTEXT:
{context}"""

        response = model.generate_content(
            system_prompt + "\n\nUser Question: " + question,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        answer_data = json.loads(response.text)
        
        return jsonify({
            "success": True,
            "data": answer_data
        })
        
    except Exception as e:
        print("RAG Error:", str(e))
        return jsonify({"success": False, "error": "An unexpected error occurred."}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
