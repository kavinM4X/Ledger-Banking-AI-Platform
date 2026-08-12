import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import chromadb
import requests
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("LLM_API_KEY")
confidence_threshold = float(os.getenv("RAG_CONFIDENCE_THRESHOLD", "0.6"))

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

def generate_json_from_gemini(prompt):
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        raw_text = response.text.strip()
        raw_text = re.sub(r'^```json\n?', '', raw_text, flags=re.IGNORECASE)
        raw_text = re.sub(r'```$', '', raw_text).strip()
        return json.loads(raw_text)
    except Exception as e:
        error_msg = str(e)
        print("Gemini API Error:", error_msg)
        if "429" in error_msg or "ResourceExhausted" in error_msg or "quota" in error_msg.lower():
            raise Exception("429")
        raise Exception("500")

def generate_text_from_gemini(prompt):
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        error_msg = str(e)
        print("Gemini API Error:", error_msg)
        if "429" in error_msg or "ResourceExhausted" in error_msg or "quota" in error_msg.lower():
            raise Exception("429")
        raise Exception("500")

def deterministic_intent(question):
    q = question.lower().strip()
    q = re.sub(r'[^\w\s]', '', q)
    
    greetings = {"hello", "hi", "hey", "good morning", "good evening", "good afternoon"}
    small_talk = {"what is your name", "who are you", "thanks", "thank you", "how are you"}
    out_of_scope = {"tell me a joke", "what is the weather", "write python code", "asdfghjkl", "what is the weather today"}
    known_faqs = {
        "what documents are required for a personal loan",
        "what is the fd interest rate",
        "how do i update my kyc",
        "what happens if i miss an emi payment",
        "loan documents",
        "fd rates",
        "update kyc",
        "missed emi",
        "minimum balance",
        "close loan early"
    }
    
    if q in greetings or q in small_talk:
        return "GENERAL_CONVERSATION"
    
    if q in out_of_scope:
        return "OUT_OF_SCOPE"

    if q in known_faqs:
        return "FAQ_QUERY"
        
    return None

@app.route('/api/ai/faq', methods=['POST'])
def ask_faq():
    data = request.json
    question = data.get('question')
    if not question:
        return jsonify({"success": False, "error": "Question required"}), 400
        
    # 1. Deterministic Intent Classification
    intent = deterministic_intent(question)
    
    # 2. LLM Intent Classification (Only if deterministic fails)
    if not intent:
        intent_prompt = f"""You are an intent classifier for a banking assistant.
Classify the user's message into exactly one of these intents:
1. GENERAL_CONVERSATION: Simple greetings (Hi, Hello) or general small talk (How are you, Who are you, Thank you).
2. FAQ_QUERY: Questions about banking products, services, policies, accounts, loans, credit cards, etc.
3. UNKNOWN: Anything else. This includes genuine banking account issues (e.g., "I was charged an unknown fee", "My account is blocked") AND out-of-scope unrelated questions (e.g., "Weather", "Tell me a joke").

Output strictly valid JSON:
{{
  "intent": "GENERAL_CONVERSATION|FAQ_QUERY|UNKNOWN"
}}

User Message: {question}"""

        try:
            intent_data = generate_json_from_gemini(intent_prompt)
            intent = intent_data.get("intent")
        except Exception as e:
            if str(e) == "429":
                return jsonify({"success": False, "error": "AI rate limit reached. Please wait a minute and try again."}), 429
            return jsonify({"success": False, "error": "Sorry, I am unable to answer right now. Please try again."}), 500

    # Validate intent
    if intent not in ["GENERAL_CONVERSATION", "FAQ_QUERY", "UNKNOWN", "OUT_OF_SCOPE"]:
        return jsonify({"success": False, "error": "Sorry, I am unable to answer right now. Please try again."}), 500

    # 3. Handle Intents
    if intent == "GENERAL_CONVERSATION":
        q = question.lower().strip()
        q = re.sub(r'[^\w\s]', '', q)
        if q in {"hello", "hi", "hey", "good morning", "good evening", "good afternoon"}:
            conv_response = "Hello! How can I help you with your banking products or services?"
        else:
            conv_response = "I'm the Product AI Assistant. I can help answer questions about the available banking products and services."
            
        return jsonify({
            "success": True,
            "data": {
                "answer": conv_response,
                "sources": []
            }
        })
        
    elif intent == "OUT_OF_SCOPE":
        return jsonify({
            "success": True,
            "data": {
                "answer": "I can help with banking products, account information, and banking-related customer questions. Please ask me a banking-related question.",
                "sources": []
            }
        })

    elif intent == "UNKNOWN":
        issue_prompt = f"""Evaluate this message. Is it a genuine banking/customer-service issue (e.g. account problem, dispute, fee, error) or is it a casual/unrelated/out-of-scope question (e.g. weather, joke, random typing)?
Output strictly valid JSON:
{{
  "is_banking_issue": true,
  "is_banking_issue": false
}}
(Choose boolean true or false for a single 'is_banking_issue' key)

User Message: {question}"""
        try:
            issue_data = generate_json_from_gemini(issue_prompt)
            is_issue = issue_data.get("is_banking_issue", False)
        except Exception as e:
            if str(e) == "429":
                return jsonify({"success": False, "error": "AI rate limit reached. Please wait a minute and try again."}), 429
            return jsonify({"success": False, "error": "Sorry, I am unable to answer right now. Please try again."}), 500
            
        if is_issue:
            return jsonify({
                "success": True,
                "data": {
                    "answer": "I understand that you're experiencing a banking-related issue.",
                    "sources": [],
                    "lowConfidence": True
                }
            })
        else:
            return jsonify({
                "success": True,
                "data": {
                    "answer": "I can help with banking products, account information, and banking-related customer questions. Please ask me a banking-related question.",
                    "sources": []
                }
            })

    elif intent == "FAQ_QUERY":
        try:
            collection = get_collection()
        except Exception as e:
            print("ChromaDB Error:", str(e))
            return jsonify({"success": False, "error": "Sorry, I am unable to answer right now. Please try again."}), 503
            
        try:
            results = collection.query(
                query_texts=[question],
                n_results=3
            )
            
            relevant_docs = []
            if results['distances'] and results['distances'][0]:
                for i, distance in enumerate(results['distances'][0]):
                    if distance < confidence_threshold:
                        relevant_docs.append({
                            "content": results['documents'][0][i],
                            "title": results['metadatas'][0][i]['title']
                        })
            else:
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
                        "sources": [],
                        "lowConfidence": True
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
- If the answer is not contained in the retrieved context, state exactly: "I couldn't find this information in the available product FAQs."
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
{context}
"""
            answer_data = generate_json_from_gemini(system_prompt + "\n\nUser Question: " + question)
            
            # Post-check if the LLM admitted it couldn't find the answer
            if answer_data.get("answer", "") == "I couldn't find this information in the available product FAQs.":
                return jsonify({
                    "success": True,
                    "data": {
                        "answer": "I couldn't find this information in the available product FAQs.",
                        "sources": [],
                        "lowConfidence": True
                    }
                })

            return jsonify({
                "success": True,
                "data": answer_data
            })
            
        except Exception as e:
            if str(e) == "429":
                return jsonify({"success": False, "error": "AI rate limit reached. Please wait a minute and try again."}), 429
            return jsonify({"success": False, "error": "Sorry, I am unable to answer right now. Please try again."}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
