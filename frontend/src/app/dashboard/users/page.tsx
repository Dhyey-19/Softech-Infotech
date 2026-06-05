"use client";

import { useState, useEffect } from 'react';

const FloatingInput = ({ label, name, type = 'text', value, onChange, required = false, disabled = false, step }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || (value !== '' && value !== null && value !== undefined);

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <label 
        style={{
          position: 'absolute',
          left: '10px',
          top: active ? '-8px' : '14px',
          fontSize: active ? '0.75rem' : '0.9rem',
          color: active ? '#e60000' : '#888',
          backgroundColor: '#fff',
          padding: '0 4px',
          transition: 'all 0.2s ease-out',
          pointerEvents: 'none',
          fontWeight: active ? 'bold' : 'normal',
          zIndex: 1
        }}
      >
        {label} {required && '*'}
      </label>
      <input 
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        step={step}
        style={{ 
          width: '100%', 
          padding: '14px', 
          border: `1px solid ${active ? '#e60000' : '#ddd'}`, 
          borderRadius: '6px', 
          outline: 'none',
          boxSizing: 'border-box',
          backgroundColor: disabled ? '#f9f9f9' : 'transparent',
          color: '#111',
          transition: 'border-color 0.2s'
        }} 
      />
    </div>
  );
};

const FloatingSelect = ({ label, name, value, onChange, options }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || (value !== '' && value !== null && value !== undefined);

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <label 
        style={{
          position: 'absolute',
          left: '10px',
          top: active ? '-8px' : '14px',
          fontSize: active ? '0.75rem' : '0.9rem',
          color: active ? '#e60000' : '#888',
          backgroundColor: '#fff',
          padding: '0 4px',
          transition: 'all 0.2s ease-out',
          pointerEvents: 'none',
          fontWeight: active ? 'bold' : 'normal',
          zIndex: 1
        }}
      >
        {label}
      </label>
      <select 
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ 
          width: '100%', 
          padding: '14px', 
          border: `1px solid ${active ? '#e60000' : '#ddd'}`, 
          borderRadius: '6px', 
          outline: 'none',
          appearance: 'none',
          backgroundColor: 'transparent',
          boxSizing: 'border-box',
          color: '#111',
          position: 'relative',
          zIndex: 0,
          transition: 'border-color 0.2s'
        }} 
      >
        <option value="" disabled hidden></option>
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: '14px', top: '16px', pointerEvents: 'none', color: '#888', zIndex: -1 }}>▼</span>
    </div>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    UserName: '', Password: '', UserType: '', Email: '', Mobile: '', BusinessName: '', 
    Address: '', ContactNo: '', DeviceId: '', Salary: 0, Rate: 0, ShiftHours: 0, BreakHours: 0
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
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
      const url = isEditing ? `http://localhost:5000/api/users/${formData.UserName}` : 'http://localhost:5000/api/users';
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

  const handleEdit = (user: any) => { setFormData(user); setIsEditing(true); setIsModalOpen(true); };
  
  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/users/${username}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchUsers();
      else alert(data.message || 'Error deleting user');
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const openNewModal = () => {
    setFormData({
      UserName: '', Password: '', UserType: '', Email: '', Mobile: '', BusinessName: '', 
      Address: '', ContactNo: '', DeviceId: '', Salary: 0, Rate: 0, ShiftHours: 0, BreakHours: 0
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading users...</div>;

  return (
    <div style={{ padding: '40px', flex: 1, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#111111', margin: 0 }}>Manage Users</h2>
        <button 
          onClick={openNewModal}
          style={{ backgroundColor: '#e60000', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(230,0,0,0.3)' }}>
          + Add New User
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#111111', color: '#fff' }}>
                <th style={{ padding: '15px' }}>Username</th>
                <th style={{ padding: '15px' }}>Type</th>
                <th style={{ padding: '15px' }}>Email</th>
                <th style={{ padding: '15px' }}>Mobile</th>
                <th style={{ padding: '15px' }}>Business</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.UserName} style={{ borderBottom: '1px solid #eeeeee', backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.UserName}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: 'rgba(230,0,0,0.1)', color: '#e60000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {user.UserType || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>{user.Email}</td>
                  <td style={{ padding: '15px' }}>{user.Mobile}</td>
                  <td style={{ padding: '15px' }}>{user.BusinessName}</td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={() => handleEdit(user)} style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(user.UserName)} style={{ padding: '5px 10px', backgroundColor: 'transparent', color: '#e60000', border: '1px solid #e60000', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#111', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
              {isEditing ? 'Edit User' : 'Add New User'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <FloatingInput label="Username" name="UserName" value={formData.UserName} onChange={handleInputChange} required={true} disabled={isEditing} />
              <FloatingInput label="Password" name="Password" type="password" value={formData.Password} onChange={handleInputChange} required={!isEditing} />
              
              <FloatingSelect 
                label="User Type" 
                name="UserType" 
                value={formData.UserType || ''} 
                onChange={handleInputChange} 
                options={[{ label: 'Admin', value: 'Admin' }, { label: 'Standard', value: 'Standard' }]} 
              />
              
              <FloatingInput label="Email" name="Email" type="email" value={formData.Email || ''} onChange={handleInputChange} />
              <FloatingInput label="Mobile" name="Mobile" value={formData.Mobile || ''} onChange={handleInputChange} />
              <FloatingInput label="Business Name" name="BusinessName" value={formData.BusinessName || ''} onChange={handleInputChange} />
              
              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingInput label="Address" name="Address" value={formData.Address || ''} onChange={handleInputChange} />
              </div>
              
              <FloatingInput label="Contact No" name="ContactNo" value={formData.ContactNo || ''} onChange={handleInputChange} />
              <FloatingInput label="Device ID" name="DeviceId" value={formData.DeviceId || ''} onChange={handleInputChange} />
              
              <FloatingInput label="Salary" name="Salary" type="number" value={formData.Salary === 0 ? '' : formData.Salary} onChange={handleInputChange} />
              <FloatingInput label="Rate" name="Rate" type="number" value={formData.Rate === 0 ? '' : formData.Rate} onChange={handleInputChange} />
              <FloatingInput label="Shift Hours" name="ShiftHours" type="number" step="0.01" value={formData.ShiftHours === 0 ? '' : formData.ShiftHours} onChange={handleInputChange} />
              <FloatingInput label="Break Hours" name="BreakHours" type="number" step="0.01" value={formData.BreakHours === 0 ? '' : formData.BreakHours} onChange={handleInputChange} />

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '12px 25px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: '12px 25px', border: 'none', backgroundColor: '#e60000', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(230,0,0,0.2)', transition: 'background 0.2s' }}>
                  {isEditing ? 'Update User' : 'Save User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
