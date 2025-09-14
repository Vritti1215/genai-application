import React, { useState } from 'react';

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signIn') {
      if (email && password) onLogin();
    } else {
      if (name && email && password) {
        alert('Account created! Please sign in.');
        setMode('signIn');
      }
    }
  };

  const title = mode === 'signIn' ? 'Sign In to Your Account' : 'Create a New Account';
  const subtitle = mode === 'signIn' ? 'Welcome back! Please enter your details.' : 'Join us! It only takes a minute.';
  const buttonText = mode === 'signIn' ? 'Sign In' : 'Create Account';
  const toggleText = mode === 'signIn' ? "Don't have an account?" : "Already have an account?";
  const toggleLinkText = mode === 'signIn' ? "Sign Up" : "Sign In";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="var(--color-primary)" />
            <path d="M12 12L22 7" stroke="var(--color-surface)" strokeWidth="2"/>
            <path d="M12 12V22" stroke="var(--color-surface)" strokeWidth="2"/>
            <path d="M12 12L2 7" stroke="var(--color-surface)" strokeWidth="2"/>
          </svg>
          <span style={styles.logoText}>HELLO!</span>
        </div>
        
        <h2 style={styles.authTitle}>Welcome Back</h2>
        <p style={styles.authSubtitle}>Enter your credentials to access your dashboard.</p>

        
        <form onSubmit={handleSubmit}>
          {mode === 'signUp' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Name</label>
              <input type="text" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required 
              placeholder="Your Name"

             />
            </div>
          )}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input type="email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required 
            placeholder="you@company.com"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input type="password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required 
            placeholder="••••••••"
            />
          </div>
          <button type="submit" style={styles.button}>{buttonText}</button>
        </form>

        <p style={styles.footerText}>
          {toggleText}{' '}
          <span style={styles.link} onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
            {toggleLinkText}
          </span>
        </p>
      </div>
    </div>
  );
};

// --- Styles for AuthPage ---
const styles = {
    container: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'20px' },
    card: { width:'100%', maxWidth:'400px', padding:'40px', backgroundColor:'var(--color-surface)', borderRadius:'var(--border-radius)', boxShadow:'var(--shadow-md)', textAlign:'center' },
    logoContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' },
    logoText: { fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)' },
    title: { fontSize:'28px', fontWeight:700, color:'var(--color-text-primary)', marginBottom:'8px' },
    subtitle: { color:'var(--color-text-secondary)', marginBottom:'32px' },
    inputGroup: { marginBottom:'20px', textAlign:'left' },
    label: { display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-primary)' },
    input: { width:'100%', padding:'12px 16px', fontSize:'16px', border:'1px solid var(--color-border)', borderRadius:'8px', boxSizing:'border-box' },
    button: { width:'100%', padding:'12px', fontSize:'16px', fontWeight:600, color:'var(--color-surface)', backgroundColor:'var(--color-primary)', border:'none', borderRadius:'8px', cursor:'pointer', marginTop:'16px', transition:'background-color 0.2s' },
    footerText: { marginTop: '32px', color: 'var(--color-text-secondary)' },
    link: { color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }
};

export default AuthPage;
