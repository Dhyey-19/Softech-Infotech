"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../components/Icons';

export default function Home() {
  const router = useRouter();
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
  }, []);

  const handleLoginRedirect = () => {
    router.push('/login');
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
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Gradients */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--primary-light) 0%, rgba(37,99,235,0) 70%)',
        top: '-100px',
        left: '-50px',
        opacity: 0.2,
        filter: 'blur(40px)',
        zIndex: 0
      }} />

      {/* Sticky Header Navbar */}
      <nav style={{
        height: '72px',
        borderBottom: '1px solid var(--border)',
        padding: '0 5%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37,99,235,0.2)'
          }}>
            <Icon name="dashboard" size={18} style={{ color: '#fff' }} />
          </div>
          <span>Softech <span style={{ color: '#2563eb' }}>Infotech</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--foreground)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-hover)'
            }}
            title="Toggle theme"
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
          </button>

          <button 
            onClick={handleLoginRedirect}
            className="btn btn-secondary"
            style={{
              borderRadius: '20px',
              padding: '8px 20px',
              border: '1px solid var(--border)',
              fontWeight: 700
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 5% 40px 5%',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: '840px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }} className="animate-fade-in">
          
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)',
            padding: '4px 12px',
            borderRadius: '20px'
          }}>
            Technology Solutions Partner since 2002
          </span>

          <h1 style={{
            fontSize: 'calc(2.5rem + 1.5vw)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--foreground)'
          }}>
            Enterprise Operations <br/>
            <span style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              CRM & ERP Platform
            </span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '640px',
            margin: '0 auto'
          }}>
            Integrated computing logs, hardware inventory trackers, and staff attendance punch-in registries managed under a single corporate ecosystem.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button 
              onClick={handleLoginRedirect}
              className="btn btn-primary"
              style={{
                borderRadius: '30px',
                padding: '14px 36px',
                fontSize: '1.05rem',
                boxShadow: '0 10px 20px rgba(37,99,235,0.2)'
              }}
            >
              Access Business Console
            </button>
          </div>

          {/* Platform Mock Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            width: '100%',
            marginTop: '60px'
          }}>
            {[
              { title: 'Interactive CRM', desc: 'Manage customers database pipelines and schedules.', icon: 'customers' },
              { title: 'Operations Stock', desc: 'Track hardware, assets inventories, and categories.', icon: 'inventory' },
              { title: 'HR Attendance', desc: 'Daily punch logging synced with Azure SQL databases.', icon: 'attendance' }
            ].map((feat, idx) => (
              <div key={idx} className="glass-card" style={{
                textAlign: 'left',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name={feat.icon as any} size={18} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{feat.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>{feat.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{
        height: '60px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5%',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        position: 'relative',
        zIndex: 5
      }}>
        <p>© Copyright 2026 Softech Infotech. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
