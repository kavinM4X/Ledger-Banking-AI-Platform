import requests
import json

def test_faq_api(question, description):
    print(f"\n--- Test: {description} ---")
    print(f'Q: "{question}"')
    
    try:
        response = requests.post(
            'http://localhost:5001/api/ai/faq',
            json={"question": question}
        )
        data = response.json()
        print("Success:", data.get("success"))
        print("Answer:", data.get("data", {}).get("answer"))
        print("Sources:", json.dumps(data.get("data", {}).get("sources")))
    except Exception as e:
        print("Error:", str(e))

def run_tests():
    print("Starting F3 RAG Tests (Python Backend)...")
    test_faq_api("What documents are required for a personal loan?", "Exact FAQ Question")
    test_faq_api("How much money do I need to keep in my savings account?", "Semantic Similarity (Min Balance)")
    test_faq_api("Will I get charged if I miss my monthly payment?", "Different Wording (Overdue Penalty)")
    test_faq_api("What is the interest rate for a spaceship loan?", "Unknown Question (No Hallucination)")
    test_faq_api("Tell me about loans and interest.", "Multiple Results (Broad)")
    print("\n--- Testing Complete ---")

if __name__ == "__main__":
    run_tests()
