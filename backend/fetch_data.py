import os
from newsapi import NewsApiClient
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def fetch_news(company_name):
    """
    Fetches news articles for a given company name using the News API.
    Includes robust error checking and clear debugging output.
    """
    # 1. Check for the API Key
    if not NEWS_API_KEY:
        print("🔴 ERROR: NEWS_API_KEY is not set in the .env file. News fetching is disabled.")
        return []

    print(f"🔍 Fetching news for: {company_name}")
    try:
        # 2. Initialize the News API Client
        newsapi = NewsApiClient(api_key=NEWS_API_KEY)

        # 3. Make the request to the 'everything' endpoint
        response = newsapi.get_everything(
            q=company_name,
            language='en',
            sort_by='relevancy',
            page_size=20  # Limit to 20 articles
        )

        # 4. Check the status of the API response
        if response.get('status') != 'ok':
            # If the API returns an error, print it clearly
            error_code = response.get('code')
            error_message = response.get('message')
            print(f"🔴 NewsAPI ERROR: {error_code} - {error_message}")
            return []

        articles = response.get('articles', [])
        print(f"✅ Found {len(articles)} articles for '{company_name}'.")

        # 5. Format the response and add the essential 'source' tag
        formatted_articles = []
        for article in articles:
            formatted_articles.append({
                'source': 'newsapi',  # This tag is crucial for backend processing
                'title': article.get('title'),
                'description': article.get('description'),
                'url': article.get('url')
            })

        return formatted_articles

    except Exception as e:
        # 6. Handle any other exceptions during the process
        print(f"🔴 An unexpected exception occurred while fetching news for '{company_name}': {e}")
        return []
