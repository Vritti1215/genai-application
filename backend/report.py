from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER

def generate_pdf_report(filename, queries, summary, data):
    doc = SimpleDocTemplate(filename, rightMargin=inch/2, leftMargin=inch/2, topMargin=inch/2, bottomMargin=inch/2)
    styles = getSampleStyleSheet()
    
    # --- Custom Styles ---
    title_style = ParagraphStyle(name='TitleStyle', parent=styles['h1'], fontSize=22, alignment=TA_CENTER, spaceAfter=20)
    h2_style = ParagraphStyle(name='H2Style', parent=styles['h2'], fontSize=16, spaceBefore=20, spaceAfter=10, borderBottomWidth=1, borderBottomColor=colors.black, paddingBottom=5)
    h3_style = ParagraphStyle(name='H3Style', parent=styles['h3'], fontSize=12, spaceBefore=10, spaceAfter=5, textColor=colors.darkblue)
    body_style = styles['BodyText']
    bullet_style = ParagraphStyle(name='BulletStyle', parent=body_style, leftIndent=20, spaceAfter=2)
    mention_style = ParagraphStyle(name='MentionStyle', parent=body_style, leftIndent=35, spaceAfter=2, textColor=colors.HexColor('#555555'))
    description_style = ParagraphStyle(name='DescriptionStyle', parent=body_style, leftIndent=35, spaceAfter=8, textColor=colors.HexColor('#666666'), fontSize=9, leading=11)

    story = []
    story.append(Paragraph(f"Business Intelligence Report: {', '.join(queries)}", title_style))
    story.append(Paragraph("Executive Summary", h2_style))
    story.append(Paragraph(summary, body_style))
    story.append(PageBreak())

    for query in queries:
        story.append(Paragraph(f"Detailed Analysis: {query}", title_style))
        query_data = data.get(query, {})
        if not query_data: continue

        # --- Sentiment Analysis Section ---
        story.append(Paragraph("Sentiment Analysis", h2_style))
        story.append(Paragraph(f"<i>{query_data.get('sentiment_summary_text', '')}</i>", body_style))
        story.append(Spacer(1, 0.2*inch))
        
        sentiment = query_data.get('sentiment_overview', {})
        total = sentiment.get('total', 1)
        sentiment_data = [
            ['Sentiment', 'Count', 'Percentage'],
            ['Positive', sentiment.get('positive', 0), f"{(sentiment.get('positive', 0)/total*100):.1f}%"],
            ['Neutral', sentiment.get('neutral', 0), f"{(sentiment.get('neutral', 0)/total*100):.1f}%"],
            ['Negative', sentiment.get('negative', 0), f"{(sentiment.get('negative', 0)/total*100):.1f}%"]
        ]
        table = Table(sentiment_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.grey), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('GRID', (0,0), (-1,-1), 1, colors.black)]))
        story.append(table)
        story.append(Spacer(1, 0.4*inch))

        all_content = query_data.get('articles', []) + query_data.get('twitter_posts', []) + query_data.get('youtube_posts', [])

        def add_sentiment_samples(sentiment_type, header_text):
            story.append(Paragraph(header_text, h3_style))
            content = [item for item in all_content if item.get('sentiment') == sentiment_type]
            if content:
                for item in content[:3]:
                    source = item.get('source', 'News').replace('newsapi','News')
                    title = (item.get('title') or item.get('description') or 'No title')[:100]
                    description = (item.get('description', 'No description available.'))[:150]
                    reason = item.get('reason', 'N/A')
                    story.append(Paragraph(f"• <b>[{source}]</b> {title}...<br/>&nbsp;&nbsp;<i>Reason: {reason}</i>", mention_style))
                    story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;<i>{description}...</i>", description_style))
            else:
                story.append(Paragraph("No relevant mentions found.", body_style))

        add_sentiment_samples('positive', "Key Positive Mentions")
        add_sentiment_samples('negative', "Key Negative Mentions")

        # --- Recent Media Mentions Section ---
        story.append(Paragraph("Recent Media Mentions", h2_style))
        
        def add_source_mentions(source_name, source_key, source_label):
            story.append(Paragraph(source_name, h3_style))
            posts = query_data.get(source_key, [])
            if posts:
                for item in posts[:3]:
                    title = (item.get('title') or 'No Title')[:120]
                    description = (item.get('description', 'No description available.'))[:150]
                    story.append(Paragraph(f"• <b>[{source_label}]</b> {title}...", bullet_style))
                    story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;<i>{description}...</i>", description_style))
            else:
                story.append(Paragraph("No recent posts found.", body_style))
            story.append(Spacer(1, 0.1*inch))

        add_source_mentions("News Articles", "articles", "News")
        add_source_mentions("Twitter Posts", "twitter_posts", "Twitter")
        add_source_mentions("YouTube Videos", "youtube_posts", "YouTube")

        if query_data.get('stock_trends'):
            story.append(Paragraph("Stock Performance", h2_style))
            story.append(Paragraph("Stock trend data is available on the main dashboard.", body_style))
        
        if len(queries) > 1 and query != queries[-1]: 
            story.append(PageBreak())

    doc.build(story)
