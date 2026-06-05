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

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [oldBrandName, setOldBrandName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    BrandName: ''
  });

  const fetchBrands = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/brands');
      const data = await response.json();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `http://localhost:5000/api/brands/${encodeURIComponent(oldBrandName)}` : 'http://localhost:5000/api/brands';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchBrands();
      } else {
        alert(data.message || 'Error saving brand');
      }
    } catch (error) {
      alert('Error saving brand');
    }
  };

  const handleEdit = (brand: any) => { 
    setFormData({ BrandName: brand.BrandName }); 
    setOldBrandName(brand.BrandName);
    setIsEditing(true); 
    setIsModalOpen(true); 
  };
  
  const handleDelete = async (brandName: string) => {
    if (!confirm(`Are you sure you want to delete brand ${brandName}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/brands/${encodeURIComponent(brandName)}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchBrands();
      else alert(data.message || 'Error deleting brand');
    } catch (error) {
      alert('Error deleting brand');
    }
  };

  const openNewModal = () => {
    setFormData({ BrandName: '' });
    setOldBrandName('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading brands...</div>;

  return (
    <div className="page-padding" style={{ flex: 1, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#111111', margin: 0 }}>Manage Brands</h2>
        <button 
          onClick={openNewModal}
          style={{ backgroundColor: '#e60000', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(230,0,0,0.3)' }}>
          + Add New Brand
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#111111', color: '#fff' }}>
                <th style={{ padding: '15px' }}>Brand Name</th>
                <th style={{ padding: '15px', width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand, index) => (
                <tr key={brand.BrandName} style={{ borderBottom: '1px solid #eeeeee', backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{brand.BrandName}</td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={() => handleEdit(brand)} style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(brand.BrandName)} style={{ padding: '5px 10px', backgroundColor: 'transparent', color: '#e60000', border: '1px solid #e60000', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr><td colSpan={2} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No brands found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#111', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
              {isEditing ? 'Edit Brand' : 'Add New Brand'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <FloatingInput label="Brand Name" name="BrandName" value={formData.BrandName} onChange={handleInputChange} required={true} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '12px 25px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#333', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: '12px 25px', border: 'none', backgroundColor: '#e60000', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(230,0,0,0.2)', transition: 'background 0.2s' }}>
                  {isEditing ? 'Update Brand' : 'Save Brand'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
