"use client";

import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icons';

export default function AdminAttendancePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/attendance/admin`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching admin attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing shifts logs...</p>
      </div>
    );
  }

  return (
    <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Employee Shift Sheets</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Daily punch ledger logs and estimated wages calculations from Azure SQL.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAttendance}>
          <Icon name="refresh" size={16} /> Synchronize Sheets
        </button>
      </div>

      {/* Attendance Log Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee Profile</th>
              <th>Current Status</th>
              <th>Punches Timeline (IN/OUT)</th>
              <th>Working Time</th>
              <th>Est. Daily Wages</th>
            </tr>
          </thead>
          <tbody>
            {data.map(user => (
              <tr key={user.UserName}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      {user.UserName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{user.UserName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Overtime Base: ₹{user.Rate || 0}/hr
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.CurrentStatus === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                    {user.CurrentStatus === 'IN' ? 'Working' : 'Shift Out'}
                  </span>
                </td>
                <td>
                  {user.Logs.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No logged logs today</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {user.Logs.map((log: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            color: log.Type === 'IN' ? 'var(--success)' : 'var(--error)',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            width: '32px'
                          }}>
                            {log.Type}
                          </span>
                          <span>
                            {new Date(log.Time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {log.Auto && (
                            <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                              Auto-Out
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {user.TotalHours} hrs
                  {Number(user.TotalHours) > 5 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: 'normal', marginTop: '2px' }}>
                      Lunch break deducted (-0.5 hrs)
                    </div>
                  )}
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--success)' }}>
                  ₹{Number(user.CalculatedPay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No punch card files registered for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
