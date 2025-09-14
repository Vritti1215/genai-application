# fetch_trends.py

import yfinance as yf

COMPANY_TICKER_MAP = {
    "apple": "AAPL", "@apple": "AAPL",
    "microsoft": "MSFT", "@microsoft": "MSFT",
    "google": "GOOGL", "@google": "GOOGL",
    "alphabet": "GOOGL",
    "amazon": "AMZN", "@amazon": "AMZN",
    "meta": "META", "@meta": "META", "facebook": "META",
    "tesla": "TSLA", "@tesla": "TSLA", "@elonmusk": "TSLA",
    "netflix": "NFLX", "@netflix": "NFLX",
    "nvidia": "NVDA", "@nvidia": "NVDA",
    "intel": "INTC",
    "ibm": "IBM",
    "oracle": "ORCL",
    "adobe": "ADBE",
    "salesforce": "CRM",
    "cisco": "CSCO",
    "broadcom": "AVGO",
    "amd": "AMD",
    "sony": "SONY",
    "tsmc": "TSM",
    "reliance": "RELIANCE.NS", "jio": "RELIANCE.NS",
    "tcs": "TCS.NS",
    "infosys": "INFY.NS",
    "wipro": "WIPRO.NS",
    "hdfc": "HDFCBANK.NS",
    "icici": "ICICIBANK.NS",
    "accenture": "ACN",
    "ey": None, "deloitte": None, "pwc": None
}

def get_stock_trends(company_name):
    try:
        ticker_symbol = COMPANY_TICKER_MAP.get(company_name.lower())
        
        if not ticker_symbol:
            print(f"'{company_name}' is not in the list of tracked companies.")
            return None

        stock = yf.Ticker(ticker_symbol)
        hist = stock.history(period="100d")

        if hist.empty:
            print(f"No historical data found for ticker '{ticker_symbol}'.")
            return None

        return [
            {"date": str(date.date()), "price": float(row["Close"])}
            for date, row in hist.iterrows()
        ]
        
    except Exception as e:
        print(f"An error occurred fetching stock data for '{company_name}': {e}")
        return None