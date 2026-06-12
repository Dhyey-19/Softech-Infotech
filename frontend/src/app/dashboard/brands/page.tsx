"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/Icons';

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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/brands`);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const url = isEditing ? `${baseUrl}/brands/${encodeURIComponent(oldBrandName)}` : `${baseUrl}/brands`;
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/brands/${encodeURIComponent(brandName)}`, { method: 'DELETE' });
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading brands data...</p>
      </div>
    );
  }

  return (
    <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Brand Master Catalog</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Manage item brands and manufacturer catalogs in operations database.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Icon name="plus" size={16} /> Add New Brand
        </button>
      </div>

      {/* Brands List Table */}
      <div className="custom-table-container" style={{ maxWidth: '640px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Brand Name Identifier</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(brand => (
              <tr key={brand.BrandName}>
                <td style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{brand.BrandName}</td>
                <td>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }} 
                      onClick={() => handleEdit(brand)}
                      title="Edit brand name"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 0 }} 
                      onClick={() => handleDelete(brand.BrandName)}
                      title="Delete brand"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No active brands registered in catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Brand Creation dialog */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card animate-scale-up" style={{ width: '90%', maxWidth: '440px', backgroundColor: 'var(--surface)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '14px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0 }}>
                {isEditing ? 'Modify Brand Name' : 'Register New Brand'}
              </h3>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Brand Name *
                </label>
                <input 
                  type="text" 
                  name="BrandName" 
                  required 
                  className="form-input" 
                  placeholder="e.g. Intel, AMD, Seagate"
                  value={formData.BrandName} 
                  onChange={handleInputChange} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Register Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
