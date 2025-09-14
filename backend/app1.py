import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from fetch_data import fetch_news
from fetch_social import fetch_twitter_data, fetch_youtube_data
from summarize import generate_summary
from sentiment import analyze_sentiment
from fetch_trends import get_stock_trends
from report import generate_pdf_report

load_dotenv()
app = Flask(__name__)
CORS(app)

if not os.path.exists("reports"):
    os.makedirs("reports")

def _perform_analysis(queries, is_social_only=False):
    """A helper function to perform analysis, reducing code duplication."""
    analysis_results = {}
    all_content_for_summary = []

    for query in queries:
        query = query.strip()
        if not query: continue

        articles = fetch_news(query) if not is_social_only else []
        stock_trends = get_stock_trends(query) if not is_social_only else []
        twitter_posts = fetch_twitter_data(query) or []
        youtube_posts = fetch_youtube_data(query) or []

        all_sources = articles + twitter_posts + youtube_posts

        for item in all_sources:
            raw_sentiment = analyze_sentiment(item.get("description", "") or item.get("text", ""))
            try:
                lines = raw_sentiment.strip().split('\n')
                label = next((l.split(":", 1)[1].strip().lower() for l in lines if l.lower().startswith('label:')), 'neutral')
                # --- NEW: Parse the category ---
                category = next((l.split(":", 1)[1].strip() for l in lines if l.lower().startswith('category:')), 'Other')
                reason = next((l.split(":", 1)[1].strip() for l in lines if l.lower().startswith('reason:')), 'N/A')
                item['sentiment'], item['category'], item['reason'] = label, category, reason
            except Exception:
                item['sentiment'], item['category'], item['reason'] = 'neutral', 'Other', 'Parsing failed'

        pos = len([s for s in all_sources if s.get('sentiment') == 'positive'])
        neg = len([s for s in all_sources if s.get('sentiment') == 'negative'])
        neu = len([s for s in all_sources if s.get('sentiment') == 'neutral'])
        total = pos + neg + neu

        sentiment_overview = { "positive": pos, "negative": neg, "neutral": neu, "total": total }

        if total > 0:
            if pos > neg and pos > neu: sentiment_summary_text = f"Overall sentiment is predominantly positive, based on {total} total mentions."
            elif neg > pos: sentiment_summary_text = f"Overall sentiment is predominantly negative, based on {total} total mentions."
            else: sentiment_summary_text = f"Sentiment is mixed across {total} mentions."
        else:
            sentiment_summary_text = "No public sentiment data could be found."

        analysis_results[query] = {
            "sentiment_overview": sentiment_overview,
            "sentiment_summary_text": sentiment_summary_text,
            "articles": [i for i in all_sources if i.get('source') == 'newsapi'],
            "twitter_posts": [i for i in all_sources if i.get('source') == 'Twitter'],
            "youtube_posts": [i for i in all_sources if i.get('source') == 'YouTube'],
            "stock_trends": stock_trends
        }
        all_content_for_summary.extend(all_sources)

    summary = generate_summary(f"an analysis of {', '.join(queries)}", all_content_for_summary) if all_content_for_summary else "No data available."
    report_filename, report_url = f"reports/{uuid.uuid4()}.pdf", None
    if any(analysis_results.values()):
        try:
            generate_pdf_report(report_filename, queries, summary, analysis_results)
            report_url = f"/download/{os.path.basename(report_filename)}"
        except Exception as e:
            print(f"Error during PDF generation: {e}")
    return summary, analysis_results, report_url

@app.route("/analyze", methods=["POST"])
def analyze_companies():
    data = request.get_json(silent=True) or {}; companies = data.get("companies", [])
    if not companies: return jsonify({"error": "Company names are required"}), 400
    summary, analysis_data, report_url = _perform_analysis(companies, is_social_only=False)
    return jsonify({"summary": summary, "comparison_data": analysis_data, "report_url": report_url})

@app.route("/analyze_social", methods=["POST"])
def analyze_social():
    data = request.get_json(silent=True) or {}; handles = data.get("handles", [])
    if not handles: return jsonify({"error": "Social handles are required"}), 400
    summary, analysis_data, report_url = _perform_analysis(handles, is_social_only=True)
    return jsonify({"summary": summary, "analysis_data": analysis_data, "report_url": report_url})

@app.route("/download/<path:filename>")
def download_file(filename):
    return send_from_directory(os.path.join(os.getcwd(), "reports"), filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
