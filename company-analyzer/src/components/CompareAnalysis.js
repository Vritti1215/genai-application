import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar } from 'recharts';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import DetailedSentiment from './DetailedSentiment'; // Import the new component
import Modal from 'react-modal'; // Import Modal

// Set the app element for react-modal accessibility
Modal.setAppElement('#root');

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
const Card = ({ children, gridArea }) => <div style={{ ...styles.card, gridArea }}>{children}</div>;

const ComparisonTable = ({ data, onCompanyClick }) => {
    const companies = Object.keys(data);
    const rows = [ 
        ['Metric', ...companies], 
        ['News Articles', ...companies.map(c => data[c]?.articles?.length || 0)], 
        ['Twitter Mentions', ...companies.map(c => data[c]?.twitter_posts?.length || 0)], 
        ['YouTube Videos', ...companies.map(c => data[c]?.youtube_posts?.length || 0)], 
    ];
    return ( 
        <table style={styles.table}>
            <thead>
                <tr>
                    {rows[0].map((col, i) => (
                        <th style={styles.th} key={i}>
                            {i > 0 ? <button onClick={() => onCompanyClick(col)} style={styles.linkButton}>{col}</button> : col}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td style={styles.td} key={j}>{cell}</td>)}</tr>)}
            </tbody>
        </table> 
    );
};

const ComparativeSentimentChart = ({ data }) => {
    const chartData = Object.keys(data).map(c => ({ name: c, Positive: data[c]?.sentiment_overview?.positive || 0, Negative: data[c]?.sentiment_overview?.negative || 0 }));
    return ( <ResponsiveContainer width='100%' height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='name' /><YAxis /><Tooltip /><Legend /><Bar dataKey='Positive' fill='var(--color-success)' /><Bar dataKey='Negative' fill='var(--color-danger)' /></BarChart></ResponsiveContainer> );
};

const ComparativeTrendChart = ({ data }) => {
    const COLORS = ['#0052cc', '#ff8042', '#ffbb28', '#82ca9d'];
    const allData = Object.keys(data).reduce((acc, company) => { if (data[company]?.stock_trends) { data[company].stock_trends.forEach(d => { const entry = acc.find(ad => ad.date === d.date); if (entry) { entry[company] = d.price; } else { acc.push({ date: d.date, [company]: d.price }); } }); } return acc; }, []);
    allData.sort((a, b) => new Date(a.date) - new Date(b.date));
    return ( <ResponsiveContainer width='100%' height={300}><LineChart data={allData}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='date' /><YAxis tickFormatter={t => `$${t.toFixed(0)}`} /><Tooltip formatter={v => `$${v.toFixed(2)}`} /><Legend />{Object.keys(data).map((c, i) => <Line key={c} type='monotone' dataKey={c} stroke={COLORS[i % COLORS.length]} connectNulls />)}</LineChart></ResponsiveContainer> );
};

const LoadingSkeleton = () => ( <div style={styles.dashboardGrid}><Card gridArea='summary'><Skeleton count={4} /></Card><Card gridArea='metrics'><Skeleton height={120} /></Card><Card gridArea='sentiment'><Skeleton height={300} /></Card><Card gridArea='trends'><Skeleton height={300} /></Card></div> );

// Main Component
const CompareAnalysis = () => {
    const [companies, setCompanies] = useState(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const openModal = (company) => {
        setSelectedCompany(company);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedCompany(null);
    };

    const handleCompanyChange = (index, value) => { const newCompanies = [...companies]; newCompanies[index] = value; setCompanies(newCompanies); };
    const addCompanyInput = () => { if (companies.length < 4) setCompanies([...companies, '']); };
    const removeCompanyInput = (index) => { if (companies.length > 2) setCompanies(companies.filter((_, i) => i !== index)); };

    const handleSubmit = async (e) => {
        e.preventDefault(); const validCompanies = companies.filter(c => c.trim() !== '');
        if (validCompanies.length < 2) { setError('Please enter at least two companies.'); return; }
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await fetch('http://127.0.0.1:5000/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companies: validCompanies }), });
            const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Error fetching data.');
            setResult(data);
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    
    return (
        <div>
            <div style={styles.formContainer}>
                <h1 style={styles.title}>Competitive Comparison</h1>
                <p style={styles.subtitle}>Compare multiple companies side-by-side.</p>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGrid}>
                        {companies.map((company, i) => (
                            <div key={i} style={styles.companyInputWrapper}>
                                <input type='text' value={company} placeholder={`Company Name ${i + 1}`} onChange={e => handleCompanyChange(i, e.target.value)} style={styles.input} />
                                {companies.length > 2 && (<button type='button' onClick={() => removeCompanyInput(i)} style={styles.removeBtn}>×</button>)}
                            </div>
                        ))}
                    </div>
                    <div style={styles.formActions}>
                        {companies.length < 4 && (<button type='button' onClick={addCompanyInput} style={styles.addBtn}>+ Add Company</button>)}
                        <button type='submit' style={styles.button} disabled={loading}>{loading ? 'Comparing...' : 'Compare'}</button>
                    </div>
                </form>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            {loading && <LoadingSkeleton />}
            {result && (
                <div style={styles.dashboardGrid}>
                    <Card gridArea='summary'>
                        <h3 style={styles.cardHeader}>AI Comparison Summary</h3>
                        <p>{result.summary}</p>
                        <button onClick={() => handleDownload(result.report_url, 'comparison_report.pdf')} disabled={!result.report_url} style={styles.downloadBtn}>Download PDF</button>
                    </Card>
                    <Card gridArea='metrics'><h3 style={styles.cardHeader}>Key Metrics</h3><ComparisonTable data={result.comparison_data} onCompanyClick={openModal} /></Card>
                    <Card gridArea='sentiment'><h3 style={styles.cardHeader}>Sentiment Comparison</h3><ComparativeSentimentChart data={result.comparison_data} /></Card>
                    <Card gridArea='trends'><h3 style={styles.cardHeader}>Stock Trend Comparison</h3><ComparativeTrendChart data={result.comparison_data} /></Card>
                </div>
            )}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={modalStyles}
                contentLabel="Detailed Sentiment Analysis"
            >
                {selectedCompany && result && result.comparison_data[selectedCompany] && (
                    <>
                        <h2 style={{borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '20px'}}>
                            Detailed Sentiment: {selectedCompany}
                        </h2>
                        <DetailedSentiment
                            sentimentData={result.comparison_data[selectedCompany].sentiment_overview}
                            allContent={[
                                ...(result.comparison_data[selectedCompany].articles || []),
                                ...(result.comparison_data[selectedCompany].twitter_posts || []),
                                ...(result.comparison_data[selectedCompany].youtube_posts || [])
                            ]}
                        />
                        <button onClick={closeModal} style={{...styles.button, marginTop: '30px'}}>Close</button>
                    </>
                )}
            </Modal>
        </div>
    );
};

const modalStyles = {
    content: {
      top: '50%', left: '50%', right: 'auto', bottom: 'auto',
      marginRight: '-50%', transform: 'translate(-50%, -50%)',
      width: '80%', maxWidth: '900px', borderRadius: '12px', padding: '30px',
      border: '1px solid var(--color-border)', background: 'var(--color-surface)'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
};

const styles = {
    formContainer: { backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--border-radius)', marginBottom: '40px', border: '1px solid var(--color-border)' },
    title: { color: 'var(--color-text-primary)', fontSize: 24, fontWeight: 700, marginBottom: 8 },
    subtitle: { color: 'var(--color-text-secondary)', marginBottom: 20 },
    inputGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
    companyInputWrapper: { display: 'flex', alignItems: 'center', gap: 12 },
    input: { flex: 1, padding: 12, fontSize: 16, border: '1px solid var(--color-border)', borderRadius: 10 },
    removeBtn: { cursor: 'pointer', backgroundColor: '#ffe6e6', border: 'none', color: '#cc0000', fontWeight: 700, padding: '4px 10px', fontSize: 18, borderRadius: '50%' },
    addBtn: { cursor: 'pointer', backgroundColor: 'transparent', border: '2px dashed var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, borderRadius: 10, padding: 12 },
    formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    button: { cursor: 'pointer', backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)', fontWeight: 700, padding: '12px 30px', border: 'none', fontSize: 18, borderRadius: 12 },
    error: { color: 'var(--color-danger)', backgroundColor: '#fce4e4', padding: 20, borderRadius: 12, textAlign: 'center', marginTop: 30 },
    dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateAreas: '"summary summary" "metrics sentiment" "trends trends"', gap: 30 },
    card: { backgroundColor: 'var(--color-surface)', padding: 30, borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' },
    cardHeader: { fontWeight: 700, fontSize: 22, marginBottom: 20 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { borderBottom: '2px solid var(--color-border)', textAlign: 'left', fontWeight: 600, padding: 12 },
    td: { borderBottom: '1px solid var(--color-border)', padding: 10 },
    downloadBtn: { marginTop: 'auto', alignSelf: 'flex-start', backgroundColor: 'var(--color-success)', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 },
    linkButton: { background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '1em', fontWeight: 600, padding: 0 },
};

export default CompareAnalysis;
