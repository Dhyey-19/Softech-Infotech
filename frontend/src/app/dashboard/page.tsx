"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar Drawer */}
      <aside style={{ 
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

        <nav style={{ flex: 1, padding: '20px 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid #e60000', backgroundColor: 'rgba(230,0,0,0.1)', color: '#ffffff', cursor: 'pointer', fontWeight: '600' }}>
              Dashboard Home
            </li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>
              My Profile
            </li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>
              Settings
            </li>
            <li style={{ padding: '15px 25px', borderLeft: '4px solid transparent', color: '#aaaaaa', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#aaaaaa'}>
              Support Tickets
            </li>
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

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ 
          backgroundColor: '#ffffff', 
          padding: '20px 40px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#111111' }}>Dashboard Overview</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#666666' }}>Welcome back, <strong>{user.UserName}</strong></span>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e60000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.UserName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            padding: '30px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderTop: '4px solid #e60000',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#111111' }}>Profile Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <p style={{ color: '#888888', fontSize: '0.9rem', marginBottom: '5px' }}>Username</p>
                <p style={{ fontWeight: '600', color: '#111111' }}>{user.UserName}</p>
              </div>
              <div>
                <p style={{ color: '#888888', fontSize: '0.9rem', marginBottom: '5px' }}>Business Name</p>
                <p style={{ fontWeight: '600', color: '#111111' }}>{user.BusinessName || 'N/A'}</p>
              </div>
              <div>
                <p style={{ color: '#888888', fontSize: '0.9rem', marginBottom: '5px' }}>Email Address</p>
                <p style={{ fontWeight: '600', color: '#111111' }}>{user.Email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ color: '#888888', fontSize: '0.9rem', marginBottom: '5px' }}>Account Type</p>
                <p style={{ fontWeight: '600', color: '#111111' }}>
                  <span style={{ backgroundColor: 'rgba(230,0,0,0.1)', color: '#e60000', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>
                    {user.UserType || 'Standard'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Dummy Widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <h4 style={{ color: '#111111', marginBottom: '15px' }}>Recent Activity</h4>
              <p style={{ color: '#888888', fontSize: '0.9rem' }}>No recent activity to show.</p>
            </div>
            <div style={{ backgroundColor: '#111111', color: '#ffffff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <h4 style={{ marginBottom: '15px', color: '#e60000' }}>System Status</h4>
              <p style={{ fontSize: '0.9rem' }}>All systems are operational.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
