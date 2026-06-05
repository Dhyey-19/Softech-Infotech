"use client";

import Image from 'next/image';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Softech <span>Infotech</span>
        </div>
        <div className={styles.navLinks}>
          <button 
            onClick={handleLoginRedirect}
            style={{
              background: 'transparent',
              border: '2px solid var(--primary)',
              color: 'var(--primary)',
              padding: '8px 24px',
              borderRadius: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Login
          </button>
        </div>
      </nav>

      <section id="home" className={styles.hero} style={{ flex: 1, padding: '0 5%', display: 'flex', alignItems: 'center' }}>
        <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '800px', marginTop: '80px' }}>
          
          <h1 className={`${styles.title} animate-fade-in`} style={{ fontSize: '4rem', marginBottom: '20px' }}>
            Welcome to <br/> <span>Softech Infotech</span>
          </h1>
          
          <p className={styles.subtitle} style={{ fontSize: '1.2rem', marginBottom: '40px', color: 'var(--text-secondary)' }}>
            Your trusted Technology Partner since 2002. We provide modern hardware, network solutions, and custom software tailored to empower your business.
          </p>

          <button 
            onClick={handleLoginRedirect} 
            style={{ padding: '16px 40px', fontSize: '1.2rem', borderRadius: '30px', boxShadow: '0 10px 20px rgba(230,0,0,0.2)' }}
            className="animate-fade-in"
          >
            Access Dashboard
          </button>
          
        </div>
      </section>

      <footer className={styles.footer} style={{ borderTop: 'none', padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>© Copyright 2025 Softech Infotech. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
