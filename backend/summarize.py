import os
import google.generativeai as genai
from google.api_core import client_options
from google.api_core import retry
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_summary(company_name, articles):
    """
    Generates a summary using the Gemini API with a specific timeout.
    """
    if not articles:
        return "No articles found to summarize."
    
    combined_text = "\n".join(
        f"{article.get('title', '')}: {article.get('description', '')}"
        for article in articles if article.get("description")
    )

    prompt = (
        f"Summarize the public perception and recent news about {company_name}:\n{combined_text}"
    )

    try:
        model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
        
        # --- THIS IS THE FIX: SET A 60-SECOND TIMEOUT ---
        request_options = {"timeout": 60}
        
        # Pass the options to the generate_content method
        response = model.generate_content(
            prompt,
            request_options=request_options
        )
        
        return response.text.strip()
    except Exception as e:
        # This will catch the timeout error and other exceptions
        return f"Error generating summary: {str(e)}"

