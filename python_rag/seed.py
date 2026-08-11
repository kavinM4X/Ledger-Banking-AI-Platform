import os
from dotenv import load_dotenv
import chromadb
import requests

load_dotenv()
api_key = os.getenv("LLM_API_KEY")

FAQS = [
  {"title":"Personal Loan Documents", 
   "body":"To apply for a personal loan, customers need identity proof (Aadhaar or PAN), address proof (utility bill or passport), and income proof — the latest 3 months' salary slips for salaried applicants or ITR for self-employed applicants."},
  {"title":"Loan Prepayment & Foreclosure", 
   "body":"Loans can be foreclosed any time after 6 EMIs. A prepayment charge of 2% on the outstanding principal applies for fixed-rate loans; floating-rate personal loans carry no prepayment penalty."},
  {"title":"Credit Card Eligibility", 
   "body":"Credit card eligibility requires a minimum monthly income of ₹25,000, an existing relationship of 6+ months, and a credit score above 700. Pre-approved offers are available for salary account holders."},
  {"title":"KYC Update Process", 
   "body":"KYC can be updated via the mobile app under Profile > KYC Update, by uploading a photo ID and address proof, or by visiting any branch with original documents for in-person verification."},
  {"title":"Fixed Deposit Interest Rates", 
   "body":"Fixed deposits currently offer 6.5% p.a. for tenures of 1–3 years and 7.1% p.a. for senior citizens on the same tenure, with premature withdrawal subject to a 1% rate reduction."},
  {"title":"Loan Overdue Penalty", 
   "body":"A late payment fee of 2% on the overdue EMI amount is charged after a 3-day grace period, along with additional interest accrual on the outstanding balance until payment is received."},
  {"title":"Account Statement Download", 
   "body":"Account statements can be downloaded as PDF or CSV from the app under Accounts > Statements, for any date range up to the last 3 years, and are also emailed monthly by default."}
]

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

def seed():
    if not api_key:
        print("Error: LLM_API_KEY not found in .env")
        return
        
    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(path="./chroma_data")
    
    custom_ef = CustomGeminiEmbeddingFunction(api_key=api_key)
    
    collection = client.get_or_create_collection(
        name="banking_faq",
        embedding_function=custom_ef
    )
    
    ids = []
    documents = []
    metadatas = []
    
    for i, faq in enumerate(FAQS):
        ids.append(f"faq_{i}")
        documents.append(f"{faq['title']}: {faq['body']}")
        metadatas.append({"title": faq['title']})
        
    print("Ingesting FAQS into ChromaDB (this generates embeddings via Gemini)...")
    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    
    print(f"Successfully seeded {len(FAQS)} FAQs into ChromaDB.")

if __name__ == "__main__":
    seed()
