import React from 'react';
import { BarChart2, FileText, Users, LogOut, AtSign } from 'lucide-react';

const Sidebar = ({ mode, setMode, onLogout }) => {
    const navItems = [
        { id: 'single', label: 'Single Analysis', icon: FileText },
        { id: 'compare', label: 'Compare Analysis', icon: BarChart2 },
        { id: 'social', label: 'Social Analysis', icon: AtSign },
    ];

    return (
        <aside style={styles.sidebar}>
            <div style={styles.logo}>
                <Users size={28} style={{ color: 'var(--color-primary)' }}/>
                <h1 style={{fontSize: 20, fontWeight: 700}}>InsightAI</h1>
            </div>
            <nav>
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setMode(item.id)}
                                style={mode === item.id ? {...styles.navButton, ...styles.active} : styles.navButton}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div style={{ marginTop: 'auto' }}>
                <button onClick={onLogout} style={{...styles.navButton, ...styles.logoutButton}}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: { display: 'flex', flexDirection: 'column', width: '250px', backgroundColor: 'var(--color-surface)', padding: '24px', borderRight: '1px solid var(--color-border)' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', color: 'var(--color-text-primary)' },
    navButton: { display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '14px', border: 'none', borderRadius: 'var(--border-radius)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 16, textAlign: 'left', fontWeight: 500, transition: 'all 0.2s ease' },
    active: { backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)', fontWeight: 600 },
    logoutButton: { color: 'var(--color-danger)'}
};

export default Sidebar;
