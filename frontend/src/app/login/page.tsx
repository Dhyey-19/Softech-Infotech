"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../components/Icons';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Theme sync
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const saved = localStorage.getItem('rememberedUser');
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('rememberedUser', username);
        } else {
          localStorage.removeItem('rememberedUser');
        }
        
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Dynamic Background Circles */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--primary) 0%, rgba(37,99,235,0) 70%)',
        top: '-50px',
        left: '-50px',
        opacity: 0.15,
        filter: 'blur(30px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--secondary) 0%, rgba(29,78,216,0) 70%)',
        bottom: '-100px',
        right: '-100px',
        opacity: 0.15,
        filter: 'blur(40px)',
        zIndex: 0
      }} />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'none',
          border: 'none',
          color: 'var(--foreground)',
          cursor: 'pointer',
          padding: '10px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow)',
          zIndex: 10
        }}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={20} />
      </button>

      <div className="glass-card animate-scale-up" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px 32px',
        position: 'relative',
        zIndex: 5,
        boxShadow: 'var(--shadow-lg)'
      }}>
        
        {/* Branding Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(37,99,235,0.25)',
            marginBottom: '16px'
          }}>
            <Icon name="dashboard" size={24} style={{ color: '#ffffff' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Softech <span style={{ color: '#2563eb' }}>Infotech</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
            Sign in to access your CRM & ERP environment
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--error-light)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.8rem',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="e.g. Admin01"
              style={{ padding: '12px 14px' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--foreground)'
              }}>
                Password
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                Reset Pin
              </span>
            </div>
            
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Enter security key"
              style={{ padding: '12px 40px 12px 14px' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <Icon name={showPassword ? "sun" : "moon"} size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: 'var(--primary)',
                  borderRadius: '4px'
                }}
              />
              Remember username
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '12px 14px',
              fontSize: '0.95rem',
              width: '100%',
              marginTop: '10px'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span 
            style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }} 
            onClick={() => router.push('/')}
          >
            &larr; Return to main landing page
          </span>
        </p>
      </div>
    </div>
  );
}
