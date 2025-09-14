import React, { useState } from "react";

function App() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && result.report) {
      window.open(`http://127.0.0.1:5000/download/${result.report}`, "_blank");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Company News Analyzer</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Enter company name"
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
      {error && <div style={styles.error}>{error}</div>}
      {result && (
        <div style={styles.result}>
          <h2>{result.company}</h2>
          <h3>Summary</h3>
          <p>{result.summary}</p>
          <h3>Sentiments</h3>
          <ul>
            {result.sentiments.map((sentiment, i) => (
              <li key={i}>{sentiment}</li>
            ))}
          </ul>
          <h3>Articles</h3>
          <ul>
            {(result.articles || []).map((article, i) => (
              <li key={i}>
                <strong>{article.title}</strong>
                <div>{article.description}</div>
              </li>
            ))}
          </ul>
          <button style={styles.downloadBtn} onClick={handleDownload}>
            Download PDF Report
          </button>
        </div>
      )}
      <footer style={styles.footer}>
        <small>© {new Date().getFullYear()} Company Analyzer</small>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 24,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(0,0,0,.07)",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    textAlign: "center",
    color: "#183153",
    fontSize: 28,
    marginBottom: 20,
  },
  form: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 18,
    padding: 8,
    border: "1px solid #c3c3c3",
    borderRadius: 6,
  },
  button: {
    fontSize: 18,
    padding: "8px 18px",
    background: "#246bfd",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: {
    color: "#d50000",
    background: "#fff1f1",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    textAlign: "center",
  },
  result: {
    marginTop: 32,
    background: "#f8faff",
    padding: 24,
    borderRadius: 10,
  },
  downloadBtn: {
    marginTop: 24,
    background: "#16bb32",
    color: "#fff",
    fontSize: 18,
    padding: "10px 28px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  footer: {
    marginTop: 60,
    textAlign: "center",
    color: "#a3a3a3",
    fontSize: 14,
  },
};

export default App;
