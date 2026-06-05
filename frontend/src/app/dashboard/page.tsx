"use client";

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) return <div style={{ padding: '40px' }}>Loading profile data...</div>;

  return (
    <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 30px 0', color: '#111111' }}>Dashboard Overview</h2>
      
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
  );
}
