import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const renderCustomizedLabel = ({ cx, cy, data }) => {
    if (!data || data.length === 0) return null;
    const dominantSentiment = data.reduce((a, b) => (a.value > b.value ? a : b));
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const percent = total > 0 ? (dominantSentiment.value / total) * 100 : 0;
    if (total === 0) return null;

    return (
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="var(--color-text-primary)">
            <tspan x={cx} dy="-0.8em" fontSize="28px" fontWeight="600">{`${Math.round(percent)}%`}</tspan>
            <tspan x={cx} dy="1.4em" fontSize="16px" fill="var(--color-text-secondary)">{dominantSentiment.name}</tspan>
        </text>
    );
};

const DetailedSentiment = ({ sentimentData, allContent }) => {
    if (!sentimentData || sentimentData.total === 0) {
        return <div style={styles.placeholder}><p>No sentiment data available for a detailed breakdown.</p></div>;
    }

    const chartData = [
        { name: 'Positive', value: sentimentData.positive },
        { name: 'Negative', value: sentimentData.negative },
        { name: 'Neutral', value: sentimentData.neutral }
    ].filter(item => item.value > 0);
    const COLORS = {'Positive': 'var(--color-success)', 'Negative': 'var(--color-danger)', 'Neutral': '#A0AEC0'};

    const getTopCategories = (sentiment) => {
        const categories = allContent
            .filter(item => item.sentiment === sentiment && item.category)
            .reduce((acc, item) => {
                const category = item.category || 'Other';
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            }, {});
        return Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
    };

    const positiveCategories = getTopCategories('positive');
    const negativeCategories = getTopCategories('negative');
    const sampleMentions = allContent.filter(item => item.sentiment === 'positive' || item.sentiment === 'negative').slice(0, 4);

    return (
        <div style={styles.container}>
            <div style={styles.chartSection}>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie 
                            data={chartData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={70} 
                            outerRadius={90} 
                            paddingAngle={5} 
                            fill="#8884d8"
                        >
                            {chartData.map(entry => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                        </Pie>
                        <g>
                            {renderCustomizedLabel({ cx: '50%', cy: '50%', data: chartData })}
                        </g>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div style={styles.legendContainer}>
                    {chartData.map(entry => (
                        <div key={entry.name} style={styles.legendItem}>
                            <span style={{...styles.legendDot, backgroundColor: COLORS[entry.name]}}></span>
                            {entry.name} ({entry.value})
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.driversSection}>
                <h4 style={styles.subHeader}>Key Sentiment Categories</h4>
                <div style={styles.driverColumn}>
                    <h5 style={{color: 'var(--color-success)'}}>Positive Categories</h5>
                    {positiveCategories.length > 0 ? (
                        <ul>{positiveCategories.map(([category, count]) => <li key={category}>{category} <span style={styles.driverCount}>({count})</span></li>)}</ul>
                    ) : <p style={styles.noDataText}>None found</p>}
                </div>
                <div style={styles.driverColumn}>
                    <h5 style={{color: 'var(--color-danger)'}}>Negative Categories</h5>
                    {negativeCategories.length > 0 ? (
                        <ul>{negativeCategories.map(([category, count]) => <li key={category}>{category} <span style={styles.driverCount}>({count})</span></li>)}</ul>
                    ) : <p style={styles.noDataText}>None found</p>}
                </div>
            </div>

            <div style={styles.mentionsSection}>
                <h4 style={styles.subHeader}>Mention Examples</h4>
                {sampleMentions.length > 0 ? sampleMentions.map((item, i) => (
                    <div key={i} style={styles.mention}>
                        <span style={item.sentiment === 'positive' ? styles.mentionIndicatorPositive : styles.mentionIndicatorNegative}></span>
                        <p style={styles.mentionText}>{item.title || item.text}</p>
                        <span style={styles.reasonTag}>{item.reason}</span>
                    </div>
                )) : <div style={styles.placeholder}><p>No specific mentions to display.</p></div>}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gridTemplateAreas: '"chart drivers" "mentions mentions"', gap: '32px', alignItems: 'flex-start' },
    chartSection: { gridArea: 'chart', textAlign: 'center', borderRight: '1px solid var(--color-border)', paddingRight: '32px' },
    driversSection: { gridArea: 'drivers', display: 'flex', gap: '24px' },
    mentionsSection: { gridArea: 'mentions', borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '24px' },
    subHeader: { marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' },
    legendContainer: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' },
    legendItem: { display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-secondary)' },
    legendDot: { width: '10px', height: '10px', borderRadius: '50%', marginRight: '8px' },
    driverColumn: { flex: 1, 'h5': { marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }, 'ul': { margin: 0, paddingLeft: 0 }, 'li': { listStyle: 'none', marginBottom: 8, fontSize: 14 } },
    driverCount: { color: 'var(--color-text-secondary)', marginLeft: '4px' },
    mention: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' },
    mentionIndicatorPositive: { flexShrink: 0, width: '4px', height: '24px', borderRadius: '2px', backgroundColor: 'var(--color-success)' },
    mentionIndicatorNegative: { flexShrink: 0, width: '4px', height: '24px', borderRadius: '2px', backgroundColor: 'var(--color-danger)' },
    mentionText: { flexGrow: 1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 },
    reasonTag: { flexShrink: 0, fontSize: 12, padding: '4px 10px', borderRadius: '12px', fontWeight: 500, backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' },
    noDataText: { color: 'var(--color-text-secondary)', fontSize: '14px', fontStyle: 'italic' },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '150px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }
};

export default DetailedSentiment;
