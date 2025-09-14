import os
from googleapiclient.discovery import build
import tweepy
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# --- Twitter Data Fetching (Using modern Twitter API v2) ---
def fetch_twitter_data(query):
    """
    Fetches tweets using Twitter API v2. It can handle a search query
    or a specific user handle (e.g., '@twitterdev').
    """
    if not TWITTER_BEARER_TOKEN:
        print("Error: TWITTER_BEARER_TOKEN not found in .env. Twitter fetching is disabled.")
        return []
    
    # Initialize the client with your Bearer Token
    client = tweepy.Client(bearer_token=TWITTER_BEARER_TOKEN)
    
    try:
        if query.startswith('@'):
            handle = query.lstrip('@')
            # Step 1: Get the user object from the handle to find their ID
            user_response = client.get_user(username=handle)
            if not user_response.data:
                print(f"Twitter user '{handle}' not found.")
                return []
            user_id = user_response.data.id
            
            # Step 2: Use the user ID to fetch their recent tweets
            tweets_response = client.get_users_tweets(id=user_id, max_results=100)
            tweets = tweets_response.data or []
            
            return [{
                'source': 'Twitter',
                'text': tweet.text,
                'description': tweet.text,
                'url': f"https://twitter.com/{handle}/status/{tweet.id}"
            } for tweet in tweets]
        else:
            # For general searches, use the recent search endpoint
            # --- CHANGED: Increased max_results from 1 to 100 ---
            search_response = client.search_recent_tweets(query=query, max_results=100)
            tweets = search_response.data or []

            return [{
                'source': 'Twitter',
                'text': tweet.text,
                'description': tweet.text,
                'url': f"https://twitter.com/i/web/status/{tweet.id}"
            } for tweet in tweets]

    except tweepy.errors.TweepyException as e:
        # Provide specific feedback for API-related errors
        print(f"An error occurred with the Twitter API for query '{query}': {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred fetching Twitter data for '{query}': {e}")
        return []

# --- YouTube Data Fetching (With robust handle and URL lookup) ---
def fetch_youtube_data(query):
    """
    Fetches recent videos from a YouTube channel using a search query,
    a direct channel URL, or a handle URL (e.g., youtube.com/@mkbhd).
    """
    if not YOUTUBE_API_KEY:
        print("Error: YOUTUBE_API_KEY not found in .env. YouTube fetching is disabled.")
        return []
        
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    try:
        channel_id = None
        # Robust logic to find the channel ID from various input types
        if "youtube.com/" in query:
            if "/@" in query:
                handle = query.split("/@")[1].split('/')[0]
                search_response = youtube.search().list(part='snippet', q=handle, type='channel', maxResults=1).execute()
                if search_response.get('items'):
                    channel_id = search_response['items'][0]['id']['channelId']
            elif "/channel/" in query:
                channel_id = query.split("/channel/")[1].split('/')[0]
        
        if not channel_id:
            # If input is not a URL, treat it as a general search query
            search_response = youtube.search().list(part='snippet', q=query, type='channel', maxResults=1).execute()
            if search_response.get('items'):
                channel_id = search_response['items'][0]['id']['channelId']

        if not channel_id:
            print(f"Could not find a YouTube channel for query: '{query}'")
            return []

        # Use the channel ID to find the playlist of all uploads
        channel_response = youtube.channels().list(part='contentDetails', id=channel_id).execute()
        uploads_playlist_id = channel_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']

        # Fetch the most recent videos from that playlist
        # --- CHANGED: Increased maxResults from 10 to 50 ---
        playlist_response = youtube.playlistItems().list(playlistId=uploads_playlist_id, part='snippet', maxResults=50).execute()
        
        return [{
            'source': 'YouTube',
            'title': item['snippet']['title'],
            'description': item['snippet']['description'],
            'url': f"https://www.youtube.com/watch?v={item['snippet']['resourceId']['videoId']}"
        } for item in playlist_response.get('items', [])]
        
    except Exception as e:
        # Provide specific feedback for API-related errors
        print(f"An error occurred fetching YouTube data for '{query}': {e}")
        return []
