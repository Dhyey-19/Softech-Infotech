"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMastersOpen, setIsMastersOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
      <style>{`
        .sidebar {
          transition: transform 0.3s ease;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-header {
            display: flex !important;
          }
          .mobile-overlay {
            display: block !important;
          }
        }
      `}</style>

      {/* Mobile Overlay */}
      <div 
        className="mobile-overlay"
        onClick={() => setIsSidebarOpen(false)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 15,
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ 
        width: '260px', 
        backgroundColor: '#111111', 
        color: '#ffffff',
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ 
          padding: '25px', 
          borderBottom: '1px solid #333333',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#e60000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#e60000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#e60000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Softech <span style={{ color: '#e60000' }}>Infotech</span></span>
        </div>

        {/* User Info inside Drawer */}
        <div style={{ padding: '20px 25px', borderBottom: '1px solid #333333', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e60000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
            {user.UserName.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ color: '#aaaaaa', fontSize: '0.8rem' }}>Welcome back,</span>
            <strong style={{ color: '#ffffff', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.UserName}</strong>
          </div>
        </div>

        <nav className="no-scrollbar" style={{ flex: 1, padding: '20px 0', overflowY: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li 
              onClick={() => router.push('/dashboard')}
              style={{ padding: '15px 25px', borderLeft: '4px solid #e60000', backgroundColor: 'rgba(230,0,0,0.1)', color: '#ffffff', cursor: 'pointer', fontWeight: '600' }}>
              Dashboard
            </li>
            
            {/* Admin Menu */}
            <li 
              style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
              onMouseOver={e => e.currentTarget.style.color = '#fff'} 
              onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}
              onClick={() => {
                setIsAdminOpen(!isAdminOpen);
                if (!isAdminOpen) setIsMastersOpen(false);
              }}
            >
              <span>Admin</span>
              <span style={{ fontSize: '0.8rem', transition: 'transform 0.3s', transform: isAdminOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </li>
            {isAdminOpen && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, backgroundColor: '#1a1a1a' }}>
                <li 
                  onClick={(e) => { e.stopPropagation(); router.push('/dashboard/users'); }}
                  style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} 
                  onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} 
                  onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>
                  Users
                </li>
                <li style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Attendence</li>
                <li style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Events</li>
                <li style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Approve Apps</li>
              </ul>
            )}

            {/* Masters Menu */}
            <li 
              style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
              onMouseOver={e => e.currentTarget.style.color = '#fff'} 
              onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}
              onClick={() => {
                setIsMastersOpen(!isMastersOpen);
                if (!isMastersOpen) setIsAdminOpen(false);
              }}
            >
              <span>Masters</span>
              <span style={{ fontSize: '0.8rem', transition: 'transform 0.3s', transform: isMastersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </li>
            {isMastersOpen && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, backgroundColor: '#1a1a1a' }}>
                <li style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Customers</li>
                <li onClick={(e) => { e.stopPropagation(); router.push('/dashboard/brands'); }} style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Brands</li>
                <li style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Categories</li>
                <li style={{ padding: '12px 25px 12px 45px', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '50px'; }} onMouseOut={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.paddingLeft = '45px'; }}>Service Centers</li>
              </ul>
            )}

            {/* Other Menus */}
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>Orders</li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>Sales</li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>Replacements</li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>My Attendence</li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>Bank QR</li>
          </ul>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #333333' }}>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: '1px solid #e60000',
              color: '#e60000',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e60000'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#e60000'; }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* Mobile Header */}
        <div className="mobile-header" style={{ 
          display: 'none', 
          padding: '15px 20px', 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #ddd',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#e60000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#e60000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#e60000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111' }}>Softech</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#111', padding: '0 5px' }}
          >
            ☰
          </button>
        </div>

        {/* Dynamic Content */}
        {children}
      </main>
    </div>
  );
}
