"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/Icons';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    UserName: '', Password: '', UserType: '', Mobile: '', DeviceId: '', Salary: 0, Rate: 0, ShiftHours: 0, BreakHours: 0
  });

  const fetchUsers = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Salary' || name === 'Rate' || name === 'ShiftHours' || name === 'BreakHours' 
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const url = isEditing ? `${baseUrl}/users/${formData.UserName}` : `${baseUrl}/users`;
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        alert(data.message || 'Error saving user');
      }
    } catch (error) {
      alert('Error saving user');
    }
  };

  const handleEdit = (user: any) => { 
    setFormData(user); 
    setIsEditing(true); 
    setIsModalOpen(true); 
  };
  
  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/users/${username}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchUsers();
      else alert(data.message || 'Error deleting user');
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const openNewModal = () => {
    setFormData({
      UserName: '', Password: '', UserType: 'Staff', Mobile: '', DeviceId: '', Salary: 0, Rate: 0, ShiftHours: 0, BreakHours: 0
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading user records...</p>
      </div>
    );
  }

  return (
    <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Manage System Users</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Configure access credentials, salary rates, and parameters.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Icon name="plus" size={16} /> Add New User
        </button>
      </div>

      {/* Users Grid/Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Access Type</th>
              <th>Contact Phone</th>
              <th>Device ID</th>
              <th>Hourly Rate (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.UserName}>
                <td style={{ fontWeight: 'bold' }}>{user.UserName}</td>
                <td>
                  <span className={`badge ${user.UserType === 'Admin' ? 'badge-primary' : 'badge-success'}`}>
                    {user.UserType || 'Staff'}
                  </span>
                </td>
                <td>{user.Mobile || 'Not Configured'}</td>
                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {user.DeviceId || 'No binding'}
                </td>
                <td style={{ fontWeight: 'bold' }}>₹{user.Rate || 0}/hr</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleEdit(user)} title="Edit profile">
                      <Icon name="edit" size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDelete(user.UserName)} title="Delete account">
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No system users registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card animate-scale-up" style={{
            width: '90%',
            maxWidth: '640px',
            backgroundColor: 'var(--surface)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '14px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0 }}>
                {isEditing ? `Edit User: ${formData.UserName}` : 'Add New User'}
              </h3>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid-cols-2-form">
              
              <div style={{ gridColumn: '1 / -1' }}>
                <style>{`
                  .form-grid-item { display: flex; flexDirection: column; gap: 6px; }
                  .form-label { font-size: 0.8rem; font-weight: 600; color: var(--foreground); }
                `}</style>
              </div>

              <div className="form-grid-item">
                <span className="form-label">Username *</span>
                <input 
                  type="text" 
                  name="UserName" 
                  required 
                  className="form-input" 
                  value={formData.UserName} 
                  onChange={handleInputChange} 
                  disabled={isEditing} 
                />
              </div>

              <div className="form-grid-item">
                <span className="form-label">{isEditing ? 'Password (Leave empty to keep current)' : 'Password *'}</span>
                <input 
                  type="password" 
                  name="Password" 
                  required={!isEditing} 
                  className="form-input" 
                  value={formData.Password} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-grid-item">
                <span className="form-label">Role Type</span>
                <select name="UserType" className="form-input" value={formData.UserType || 'Staff'} onChange={handleInputChange}>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div className="form-grid-item">
                <span className="form-label">Mobile Number</span>
                <input 
                  type="text" 
                  name="Mobile" 
                  className="form-input" 
                  value={formData.Mobile || ''} 
                  onChange={handleInputChange} 
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }} className="form-grid-item">
                <span className="form-label">Hardware Device ID Binding</span>
                <input 
                  type="text" 
                  name="DeviceId" 
                  className="form-input" 
                  placeholder="Binding ID for punch card/machine login (Optional)"
                  value={formData.DeviceId || ''} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-grid-item">
                <span className="form-label">Monthly Base Salary (₹)</span>
                <input 
                  type="number" 
                  name="Salary" 
                  className="form-input" 
                  value={formData.Salary || ''} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-grid-item">
                <span className="form-label">Hourly Overtime Rate (₹)</span>
                <input 
                  type="number" 
                  name="Rate" 
                  className="form-input" 
                  value={formData.Rate || ''} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-grid-item">
                <span className="form-label">Shift Hours Limit</span>
                <input 
                  type="number" 
                  step="0.01" 
                  name="ShiftHours" 
                  className="form-input" 
                  value={formData.ShiftHours || ''} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-grid-item">
                <span className="form-label">Shift Break Hours</span>
                <input 
                  type="number" 
                  step="0.01" 
                  name="BreakHours" 
                  className="form-input" 
                  value={formData.BreakHours || ''} 
                  onChange={handleInputChange} 
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Create Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
