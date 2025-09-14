import React, { useState } from 'react';
import Sidebar from './Sidebar';
import SingleAnalysis from './SingleAnalysis';
import CompareAnalysis from './CompareAnalysis';
import SocialAnalysis from './SocialAnalysis';

const Dashboard = ({ onLogout }) => {
  const [mode, setMode] = useState('single');

  // Renders the correct component based on the selected mode
  const renderContent = () => {
    switch (mode) {
      case 'single':
        return <SingleAnalysis />;
      case 'compare':
        return <CompareAnalysis />;
      case 'social':
        return <SocialAnalysis />;
      default:
        return <SingleAnalysis />;
    }
  };

  return (
    <div style={styles.dashboardLayout}>
      <Sidebar mode={mode} setMode={setMode} onLogout={onLogout} />
      <main style={styles.mainContent}>
        {renderContent()}
      </main>
    </div>
  );
};

const styles = {
  dashboardLayout: { display: 'flex', height: '100vh', backgroundColor: 'var(--color-background)' },
  mainContent: { flex: 1, padding: '40px', overflowY: 'auto' }
};

export default Dashboard;
