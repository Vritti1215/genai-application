import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import DetailedSentiment from './DetailedSentiment'; // Import the new component

// Helper function for robust downloads
const handleDownload = async (reportUrl, filename) => {
    if (!reportUrl) { alert("No report available to download."); return; }
    const url = `http://127.0.0.1:5000${reportUrl}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename || 'report.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download the PDF report.');
    }
};

// Reusable Child Components
const Card = ({ children, gridArea }) => <div style={{...styles.card, gridArea}}>{children}</div>;

const SentimentChart = ({ data }) => {
    if (!data || data.total === 0) return <p>No sentiment data available.</p>;
    const chartData = [ { name: 'Positive', value: data.positive }, { name: 'Negative', value: data.negative }, { name: 'Neutral', value: data.neutral } ].filter(item => item.value > 0);
    const COLORS = {'Positive': 'var(--color-success)', 'Negative': 'var(--color-danger)', 'Neutral': '#6b7280'};
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`} </text> );
    };
    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={80} fill="#8884d8">
                    {chartData.map(entry => <Cell key={entry.name} fill={COLORS[entry.name]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value} mentions`, null]}/>
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

const TrendChart = ({ data }) => { 
    if (!data || data.length === 0) return <p>No stock trend data available for this company.</p>; 
    return ( <ResponsiveContainer width="100%" height={300}><LineChart data={data} margin={{top:5, right:20, left:-10, bottom:5}}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={['dataMin', 'dataMax']} tickFormatter={t => `$${t.toFixed(0)}`} /><Tooltip formatter={v => `$${v.toFixed(2)}`} /><Line type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> );
};

const ArticleCard = ({ item }) => ( <div style={styles.articleCard}><h4>{item.title}</h4><p style={{flexGrow: 1}}>{item.description}</p><a href={item.url} target="_blank" rel="noopener noreferrer" style={{alignSelf: 'flex-end', fontWeight: 600}}>Read More</a></div> );

const SocialPostCard = ({ item }) => ( <div style={{...styles.articleCard, backgroundColor: item.source === 'Twitter' ? '#f0f9ff' : '#fef2f2'}}><p style={styles.cardSource}>{item.source}</p><h4>{item.title || "Post"}</h4><p style={{flexGrow: 1}}>{item.description}</p><a href={item.url} target="_blank" rel="noopener noreferrer" style={{alignSelf: 'flex-end', fontWeight: 600}}>View Post</a></div> );

const DataTabs = ({ articles, twitterPosts, youtubePosts }) => { 
    const [tab, setTab] = useState('news'); 
    const TABS = { news: { data: articles, Component: ArticleCard }, twitter: { data: twitterPosts, Component: SocialPostCard }, youtube: { data: youtubePosts, Component: SocialPostCard } }; 
    const CurrentComponent = TABS[tab].Component; const currentData = TABS[tab].data;
    return ( <div><div style={styles.tabsContainer}>{Object.keys(TABS).map(t => ( <button key={t} onClick={() => setTab(t)} style={t === tab ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}>{t} ({TABS[t].data?.length || 0})</button> ))}</div><div>{currentData?.length > 0 ? ( <div style={styles.articlesGrid}>{currentData.map((item, i) => ( <CurrentComponent key={i} item={item} /> ))}</div> ) : ( <p>No content found for this source.</p> )}</div></div> ); 
};

const LoadingSkeleton = () => (
    <div style={styles.dashboardGrid}>
        <Card gridArea="summary"><Skeleton count={4}/></Card>
        <Card gridArea="sentiment"><Skeleton circle height={150} width={150}/></Card>
        <Card gridArea="detailedSentiment"><Skeleton height={200}/></Card>
        <Card gridArea="trends"><Skeleton height={300}/></Card>
        <Card gridArea="tabs"><Skeleton height={200}/></Card>
    </div>
);

// Main Component
const SingleAnalysis = () => {
    const [company, setCompany] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
 
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(""); setResult(null);
        try {
            const res = await fetch("http://127.0.0.1:5000/analyze", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companies: [company] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "An error occurred");
            const companyData = data.comparison_data[Object.keys(data.comparison_data)[0]];
            setResult({ company, ...companyData, summary: data.summary, report_url: data.report_url });
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    
    return (
        <div>
            <div style={styles.formContainer}>
                <h1 style={styles.title}>Single Company Analysis</h1>
                <p style={styles.subtitle}>Get a deep-dive analysis of a single company.</p>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input type="text" value={company} placeholder="Enter Company Name (e.g., NVIDIA)" onChange={(e) => setCompany(e.target.value)} style={styles.input} required />
                    <button type="submit" style={styles.button} disabled={loading}>{loading ? "Analyzing..." : "Analyze"}</button>
                </form>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            {loading && <LoadingSkeleton />}
            {result && (
                <div style={styles.dashboardGrid}>
                    <Card gridArea="summary">
                        <h3 style={styles.cardHeader}>AI Summary: {result.company}</h3>
                        <p style={{flexGrow: 1}}>{result.summary}</p>
                        <button onClick={() => handleDownload(result.report_url, `${result.company}_report.pdf`)} style={styles.downloadBtn} disabled={!result.report_url}>Download PDF</button>
                    </Card>
                    <Card gridArea="sentiment">
                        <h3 style={styles.cardHeader}>Sentiment Overview</h3>
                        <SentimentChart data={result.sentiment_overview} />
                        <p style={styles.sentimentSummary}>{result.sentiment_summary_text}</p>
                    </Card>
                    
                    <Card gridArea="detailedSentiment">
                        <h3 style={styles.cardHeader}>Detailed Sentiment Breakdown</h3>
                        <DetailedSentiment
                            sentimentData={result.sentiment_overview}
                            allContent={[
                                ...(result.articles || []),
                                ...(result.twitter_posts || []),
                                ...(result.youtube_posts || []),
                            ]}
                        />
                    </Card>
                    
                    <Card gridArea="trends"><h3 style={styles.cardHeader}>Stock Trend</h3><TrendChart data={result.stock_trends} /></Card>

                    <Card gridArea="tabs"><h3 style={styles.cardHeader}>Media Mentions</h3><DataTabs articles={result.articles} twitterPosts={result.twitter_posts} youtubePosts={result.youtube_posts} /></Card>
                </div>
            )}
        </div>
    );
};

const styles = {
    formContainer: { backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--border-radius)', marginBottom: '40px', border: '1px solid var(--color-border)' },
    title: { color: 'var(--color-text-primary)', fontSize: '24px', margin: '0 0 8px 0' },
    subtitle: { color: 'var(--color-text-secondary)', marginTop: 0 },
    form: { display:'flex', gap:16 },
    input: { flex: 1, fontSize: 16, padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '8px' },
    button: { fontSize: 16, fontWeight: 600, padding: '12px 24px', backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    error: { color: 'var(--color-danger)', backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', marginBottom: 24, textAlign: 'center' },
    dashboardGrid: { 
        display:'grid', 
        gridTemplateColumns:'repeat(3, 1fr)', 
        gap:'32px', 
        gridTemplateAreas:`
            "summary summary sentiment"
            "detailedSentiment detailedSentiment detailedSentiment"
            "trends trends trends"
            "tabs tabs tabs"
        ` 
    },
    card: { backgroundColor: 'var(--color-surface)', padding: 24, borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' },
    cardHeader: { marginTop: 0, marginBottom: 16, color: 'var(--color-text-primary)', fontSize: 20 },
    downloadBtn: { marginTop: 'auto', alignSelf: 'flex-start', backgroundColor: 'var(--color-success)', color: "#fff", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
    sentimentSummary: { textAlign: 'center', marginTop: 16, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontWeight: 500 },
    tabsContainer: { display:'flex', borderBottom:'1px solid var(--color-border)', marginBottom:24 },
    tabButton: { padding:'12px 20px', border:'none', backgroundColor:'transparent', cursor:'pointer', fontSize:16, color:'var(--color-text-secondary)', borderBottom:'2px solid transparent', textTransform:'capitalize' },
    activeTab: { color:'var(--color-primary)', borderBottom:'2px solid var(--color-primary)', fontWeight:600 },
    articlesGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 },
    articleCard: { padding:20, borderRadius:10, border:'1px solid #e9ecef', backgroundColor:'#f8f9fa', display: 'flex', flexDirection: 'column' },
    cardSource: { fontSize:12, fontWeight:'bold', textTransform:'uppercase' },
};

export default SingleAnalysis;
