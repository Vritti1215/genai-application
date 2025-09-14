import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from the .env file
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure the generative AI model
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def analyze_sentiment(text):
    """
    Analyzes the sentiment of a given text, categorizes its topic,
    and extracts the key driver for that sentiment.
    """
    if not text or not isinstance(text, str) or not text.strip():
        return "Label: neutral\nCategory: Other\nReason: No text provided"

    # Enhanced prompt to include categorization
    prompt = f"""
    Analyze the sentiment of the following text snippet about a company.

    1.  **Classify the sentiment**: as 'positive', 'negative', or 'neutral'.
    2.  **Identify the category**: Choose ONE category from the following list that best describes the main topic:
        - Product Quality
        - Customer Service
        - Delivery & Shipping
        - Price & Value
        - Website & App Experience
        - Company News & Financials
        - Other
    3.  **Provide a brief reason**: Give a 2-4 word reason for your classification.

    ---
    **Example 1:**
    Text: "Amazon's quarterly earnings surpassed all analyst expectations, showing massive growth."
    Output:
    Label: positive
    Category: Company News & Financials
    Reason: surpassed expectations

    **Example 2:**
    Text: "My package from Amazon arrived two days late and the box was damaged."
    Output:
    Label: negative
    Category: Delivery & Shipping
    Reason: late and damaged

    **Example 3:**
    Text: "The new update to their mobile app is so confusing, I can't find anything anymore."
    Output:
    Label: negative
    Category: Website & App Experience
    Reason: confusing update

    ---
    Now, analyze this text:
    Text: "{text[:800]}"
    Output:
    """

    try:
        response = model.generate_content(prompt)
        # Ensure a default response if the model output is not as expected
        if "Label:" not in response.text or "Category:" not in response.text:
             return "Label: neutral\nCategory: Other\nReason: Analysis failed"
        return response.text.strip()
    except Exception as e:
        print(f"🔴 An error occurred during the sentiment analysis API call: {e}")
        return "Label: neutral\nCategory: Other\nReason: Analysis failed"
