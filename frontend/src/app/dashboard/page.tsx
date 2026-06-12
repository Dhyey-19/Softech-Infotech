"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, IconName } from '../../components/Icons';

export default function DashboardPage() {
  const router = useRouter();

  // Auth & Session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>({ checkedIn: false, checkedOut: false, checkInTime: null, checkOutTime: null, totalHours: '0.00' });
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  // Real SQL Backend data states
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [replacements, setReplacements] = useState<any[]>([]);
  const [bankQrs, setBankQrs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // 2D QR Scanner & Cart States
  const [cart, setCart] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerActiveTab, setScannerActiveTab] = useState<'camera' | 'simulator'>('simulator');
  const [checkoutPayMode, setCheckoutPayMode] = useState('Cash');
  const [checkoutRemark, setCheckoutRemark] = useState('');
  const [checkoutChallanNo, setCheckoutChallanNo] = useState('');
  const [checkoutCashAmount, setCheckoutCashAmount] = useState(0);
  const [checkoutBankAmount, setCheckoutBankAmount] = useState(0);

  const demoItems = [
    { label: "Kingston 8GB DDR4 RAM (JSON)", payload: '{"ItemName": "Kingston 8GB DDR4 RAM", "Rate": 2200}' },
    { label: "Asus Prime H510 Motherboard (JSON)", payload: '{"ItemName": "Asus Prime H510 Motherboard", "Rate": 5400}' },
    { label: "HP Laserjet Printer M1005 (CSV)", payload: 'HP Laserjet Printer M1005, 18500' },
    { label: "SanDisk 64GB USB 3.0 (Pipe)", payload: 'SanDisk 64GB USB 3.0|650' },
    { label: "Logitech Keyboard & Mouse Combo (CSV)", payload: 'Logitech MK220 Keyboard Combo, 1400' }
  ];

  const handleScanSuccess = (decodedText: string) => {
    try {
      let itemName = '';
      let rate = 0;

      if (decodedText.trim().startsWith('{')) {
        const parsed = JSON.parse(decodedText);
        itemName = parsed.ItemName || parsed.itemName || parsed.item || '';
        rate = Number(parsed.Rate || parsed.rate || parsed.price || 0);
      } else if (decodedText.includes(',')) {
        const parts = decodedText.split(',');
        itemName = parts[0].trim();
        rate = Number(parts[1]?.trim() || 0);
      } else if (decodedText.includes('|')) {
        const parts = decodedText.split('|');
        itemName = parts[0].trim();
        rate = Number(parts[1]?.trim() || 0);
      } else {
        itemName = decodedText.trim();
        rate = 0;
      }

      if (!itemName) {
        alert("Could not extract item name from scanned QR code.");
        return;
      }

      addToCart(itemName, rate);
    } catch (err) {
      console.error(err);
      alert("Invalid QR format. Please use standard JSON, comma, or pipe-separated format.");
    }
  };

  const addToCart = (itemName: string, rate: number) => {
    setCart((prev) => {
      const idx = prev.findIndex(i => i.ItemName.toLowerCase() === itemName.toLowerCase());
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].Qty = Number(updated[idx].Qty) + 1;
        updated[idx].Amount = updated[idx].Qty * updated[idx].Rate;
        return updated;
      } else {
        return [...prev, { ItemName: itemName, Rate: rate, Qty: 1, Amount: rate }];
      }
    });
  };

  const updateCartItem = (index: number, field: 'Qty' | 'Rate', value: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        Amount: field === 'Qty' ? value * updated[index].Rate : updated[index].Qty * value
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.Amount || 0), 0);

  useEffect(() => {
    if (checkoutPayMode === 'Cash') {
      setCheckoutCashAmount(cartTotal);
      setCheckoutBankAmount(0);
    } else if (checkoutPayMode === 'Bank') {
      setCheckoutCashAmount(0);
      setCheckoutBankAmount(cartTotal);
    } else if (checkoutPayMode === 'Split') {
      if (Number(checkoutCashAmount) + Number(checkoutBankAmount) !== cartTotal) {
        setCheckoutCashAmount(cartTotal);
        setCheckoutBankAmount(0);
      }
    } else {
      setCheckoutCashAmount(0);
      setCheckoutBankAmount(0);
    }
  }, [checkoutPayMode, cartTotal]);

  useEffect(() => {
    let html5QrcodeScanner: any = null;
    
    if (isScanning && scannerActiveTab === 'camera') {
      import('html5-qrcode').then((module) => {
        html5QrcodeScanner = new module.Html5QrcodeScanner(
          "qr-reader-viewport",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        html5QrcodeScanner.render(
          (decodedText: string) => {
            handleScanSuccess(decodedText);
            setIsScanning(false);
          },
          (error: any) => {
            // silent fail
          }
        );
      }).catch(err => {
        console.error("Failed to load html5-qrcode dynamically", err);
      });
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch((err: any) => {
          console.error("Failed to clear html5-qrcode reader", err);
        });
      }
    };
  }, [isScanning, scannerActiveTab]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("No items in cart to checkout.");
      return;
    }

    const total = cartTotal;
    const paidSum = Number(checkoutCashAmount) + Number(checkoutBankAmount);

    if (checkoutPayMode === 'Split' && paidSum !== total) {
      alert(`Split payment details mismatch! Cash amount (₹${checkoutCashAmount}) + Bank amount (₹${checkoutBankAmount}) must sum up to the total of ₹${total}`);
      return;
    }

    if (!confirm(`Log checkout of ${cart.length} item(s) for a total of ₹${total.toLocaleString()}?`)) {
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const salesData = cart.map(item => {
      const ratio = total > 0 ? (item.Amount / total) : 0;
      let cashPart = 0;
      let bankPart = 0;
      
      if (checkoutPayMode === 'Cash') {
        cashPart = item.Amount;
      } else if (checkoutPayMode === 'Bank') {
        bankPart = item.Amount;
      } else if (checkoutPayMode === 'Split') {
        cashPart = Math.round(checkoutCashAmount * ratio);
        bankPart = item.Amount - cashPart;
      }

      return {
        SaleDate: new Date().toISOString(),
        ItemName: item.ItemName,
        Qty: item.Qty,
        Rate: item.Rate,
        Amount: item.Amount,
        PayMode: checkoutPayMode,
        Remark: checkoutRemark || 'Bulk checkout via QR Scanner',
        UserName: currentUser?.UserName || 'Staff',
        Cash: cashPart,
        Bank: bankPart,
        ChallanNo: checkoutChallanNo ? Number(checkoutChallanNo) : null
      };
    });

    try {
      const res = await fetch(`${baseUrl}/sales/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: salesData })
      });
      const data = await res.json();
      if (data.success) {
        alert("Batch sales order checked out successfully!");
        setCart([]);
        setCheckoutRemark('');
        setCheckoutChallanNo('');
        setIsScanning(false);
        fetchViewData();
      } else {
        alert(data.message || "Checkout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network checkout request failed.");
    }
  };

  // Search & Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal Control States
  const [modalType, setModalType] = useState<string | null>(null); // 'event' | 'application' | 'customer' | 'category' | 'servicecenter' | 'order' | 'sale' | 'replacement' | 'bankqr'
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Initialize Auth & View routing
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setCurrentUser(parsedUser);
    fetchAttendanceStatus(parsedUser.UserName);

    const checkViewParam = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || 'dashboard';
      setCurrentView(view);
      setSearchTerm('');
      setCurrentPage(1);
    };

    checkViewParam();
    window.addEventListener('popstate', checkViewParam);
    return () => window.removeEventListener('popstate', checkViewParam);
  }, [router]);

  // Fetch data for the active view from SQL Backend API
  useEffect(() => {
    if (!currentUser) return;
    fetchViewData();
  }, [currentView, currentUser]);

  const fetchViewData = async () => {
    setLoadingData(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
      if (currentView === 'dashboard') {
        // Load counts for cards
        const [cRes, oRes, sRes, rRes] = await Promise.all([
          fetch(`${baseUrl}/customers`).then(r => r.json()),
          fetch(`${baseUrl}/orders`).then(r => r.json()),
          fetch(`${baseUrl}/sales`).then(r => r.json()),
          fetch(`${baseUrl}/replacements`).then(r => r.json())
        ]);
        if (cRes.success) setCustomers(cRes.data);
        if (oRes.success) setOrders(oRes.data);
        if (sRes.success) setSales(sRes.data);
        if (rRes.success) setReplacements(rRes.data);
      } else if (currentView === 'events') {
        const res = await fetch(`${baseUrl}/events`);
        const data = await res.json();
        if (data.success) setEvents(data.data);
      } else if (currentView === 'applications') {
        const res = await fetch(`${baseUrl}/applications`);
        const data = await res.json();
        if (data.success) setApplications(data.data);
      } else if (currentView === 'customers') {
        const res = await fetch(`${baseUrl}/customers`);
        const data = await res.json();
        if (data.success) setCustomers(data.data);
      } else if (currentView === 'categories') {
        const res = await fetch(`${baseUrl}/categories`);
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } else if (currentView === 'servicecenters') {
        const res = await fetch(`${baseUrl}/servicecenters`);
        const data = await res.json();
        if (data.success) setServiceCenters(data.data);
      } else if (currentView === 'orders') {
        const res = await fetch(`${baseUrl}/orders`);
        const data = await res.json();
        if (data.success) setOrders(data.data);
      } else if (currentView === 'sales') {
        const res = await fetch(`${baseUrl}/sales`);
        const data = await res.json();
        if (data.success) setSales(data.data);
      } else if (currentView === 'replacements') {
        const [repRes, scRes] = await Promise.all([
          fetch(`${baseUrl}/replacements`).then(r => r.json()),
          fetch(`${baseUrl}/servicecenters`).then(r => r.json())
        ]);
        if (repRes.success) setReplacements(repRes.data);
        if (scRes.success) setServiceCenters(scRes.data);
      } else if (currentView === 'bankqrs') {
        const res = await fetch(`${baseUrl}/bankqrs`);
        const data = await res.json();
        if (data.success) setBankQrs(data.data);
      } else if (currentView === 'myattendance') {
        if (currentUser) {
          fetchAttendanceStatus(currentUser.UserName);
        }
      }
    } catch (err) {
      console.error('Error fetching view SQL data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- Attendance Punch Integration ---
  const fetchAttendanceStatus = async (username: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/attendance/status/${username}`);
      const data = await res.json();
      if (data.success) {
        setAttendanceStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendancePunch = async (action: 'checkin' | 'checkout') => {
    if (!currentUser) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/attendance/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.UserName })
      });
      const data = await res.json();
      if (data.success) {
        fetchAttendanceStatus(currentUser.UserName);
        alert(`Successfully ${action === 'checkin' ? 'checked in' : 'checked out'}`);
      } else {
        alert(data.message || `Error during ${action}`);
      }
    } catch (err) {
      console.error(err);
      alert('Connection error registering punch card logs.');
    }
  };

  // --- CRUD Actions ---
  const handleOpenForm = (type: string, mode: 'add' | 'edit' | 'view', item: any = null) => {
    setModalType(type);
    setModalMode(mode);
    setSelectedItem(item);
    if (mode === 'edit' || mode === 'view') {
      setFormData(item);
    } else {
      // Defaults for Add forms
      if (type === 'sale') {
        setFormData({ SaleDate: new Date().toISOString().slice(0, 16), Qty: 1, Rate: 0, Amount: 0, PayMode: 'Cash', UserName: currentUser?.UserName });
      } else if (type === 'replacement') {
        setFormData({ InwardDate: new Date().toISOString().split('T')[0], Status: 'Received' });
      } else if (type === 'event') {
        setFormData({ EventDate: new Date().toISOString().split('T')[0] });
      } else if (type === 'order') {
        setFormData({ UserName: currentUser?.UserName, Status: 'Pending' });
      } else if (type === 'bankqr') {
        setFormData({ IsActive: true });
      } else if (type === 'application') {
        setFormData({ SaleDate: new Date().toISOString().split('T')[0], AppExpDate: new Date().toISOString().split('T')[0], AppStatus: '1', SalePrice: 0, Renewal: 0, Activation: 0 });
      } else {
        setFormData({});
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      
      // Auto calculate Sale Amount
      if (modalType === 'sale' && (name === 'Qty' || name === 'Rate')) {
        const qty = Number(name === 'Qty' ? value : prev.Qty || 1);
        const rate = Number(name === 'Rate' ? value : prev.Rate || 0);
        updated.Amount = qty * rate;
      }
      return updated;
    });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    let url = '';
    let method = 'POST';
    let payload = { ...formData };

    try {
      if (modalType === 'event') {
        url = modalMode === 'edit' ? `${baseUrl}/events/${selectedItem.Id}` : `${baseUrl}/events`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'application') {
        url = modalMode === 'edit' ? `${baseUrl}/applications/${encodeURIComponent(selectedItem.AppName)}` : `${baseUrl}/applications`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'customer') {
        url = modalMode === 'edit' ? `${baseUrl}/customers/${encodeURIComponent(selectedItem.MobileNo)}` : `${baseUrl}/customers`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'category') {
        url = modalMode === 'edit' ? `${baseUrl}/categories/${encodeURIComponent(selectedItem.Category)}` : `${baseUrl}/categories`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'servicecenter') {
        url = modalMode === 'edit' ? `${baseUrl}/servicecenters/${encodeURIComponent(selectedItem.SendToName)}` : `${baseUrl}/servicecenters`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'order') {
        url = modalMode === 'edit' ? `${baseUrl}/orders/${selectedItem.Id}` : `${baseUrl}/orders`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'sale') {
        url = modalMode === 'edit' ? `${baseUrl}/sales/${selectedItem.Id}` : `${baseUrl}/sales`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'replacement') {
        url = modalMode === 'edit' ? `${baseUrl}/replacements/${selectedItem.ID}` : `${baseUrl}/replacements`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      } else if (modalType === 'bankqr') {
        url = modalMode === 'edit' ? `${baseUrl}/bankqrs/${selectedItem.QRID}` : `${baseUrl}/bankqrs`;
        method = modalMode === 'edit' ? 'PUT' : 'POST';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        setModalType(null);
        fetchViewData();
      } else {
        alert(resData.message || 'Error updating SQL database records');
      }
    } catch (err) {
      console.error(err);
      alert('Network request execution error.');
    }
  };

  const handleDeleteRecord = async (type: string, id: string | number) => {
    if (!confirm(`Are you sure you want to permanently delete this record?`)) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    let url = '';

    if (type === 'event') url = `${baseUrl}/events/${id}`;
    else if (type === 'application') url = `${baseUrl}/applications/${encodeURIComponent(id)}`;
    else if (type === 'customer') url = `${baseUrl}/customers/${encodeURIComponent(id)}`;
    else if (type === 'category') url = `${baseUrl}/categories/${encodeURIComponent(id)}`;
    else if (type === 'servicecenter') url = `${baseUrl}/servicecenters/${encodeURIComponent(id)}`;
    else if (type === 'order') url = `${baseUrl}/orders/${id}`;
    else if (type === 'sale') url = `${baseUrl}/sales/${id}`;
    else if (type === 'replacement') url = `${baseUrl}/replacements/${id}`;
    else if (type === 'bankqr') url = `${baseUrl}/bankqrs/${id}`;

    try {
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchViewData();
      } else {
        alert(data.message || 'Failed to delete database record');
      }
    } catch (err) {
      console.error(err);
      alert('Network delete request failed.');
    }
  };

  // --- Dynamic sorting helper ---
  const getSortedData = (dataArray: any[]) => {
    let result = [...dataArray];
    if (searchTerm) {
      result = result.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    if (sortBy) {
      result.sort((a, b) => {
        let fieldA = a[sortBy];
        let fieldB = b[sortBy];
        if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
        if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();
        if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const paginateData = (dataArray: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return dataArray.slice(startIndex, startIndex + itemsPerPage);
  };

  // --- Sub-View Component Renderers ---

  const renderDashboard = () => {
    const totalSalesAmount = sales.reduce((a, b) => a + Number(b.Amount || 0), 0);
    const activeReplacementsCount = replacements.filter(r => r.Status !== 'Delivered to Customer' && r.Status !== 'Delivered').length;
    const pendingOrdersCount = orders.filter(o => o.Status !== 'Completed').length;

    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Welcome & Punch Status Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '4px solid #2563eb' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem' }}>
              {currentUser?.UserName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Welcome Back, {currentUser?.UserName}!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Softech Infotech Operations Portal</p>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-primary">{currentUser?.UserType}</span>
                <span className="badge badge-success">Online</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ borderTop: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Shift Punch Card</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>Punch state tracked in SQL database</p>
              </div>
              <span className={`badge ${attendanceStatus.checkedIn ? 'badge-success' : 'badge-danger'}`}>
                {attendanceStatus.checkedIn ? 'Shift In' : 'Shift Out'}
              </span>
            </div>
            {attendanceLoading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Syncing...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Shift Working Hours:</span>
                  <strong style={{ color: 'var(--foreground)' }}>{attendanceStatus.totalHours || '0.00'} hrs</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleAttendancePunch('checkin')} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--success)' }} disabled={attendanceStatus.checkedIn}>Check In</button>
                  <button onClick={() => handleAttendancePunch('checkout')} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--error)' }} disabled={!attendanceStatus.checkedIn}>Check Out</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 2D Scanner and Cart Checkout Module */}
        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', borderTop: '4px solid var(--primary)', padding: '24px' }}>
          
          {/* Left Side: Scanner Interface */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="search" size={20} style={{ color: 'var(--primary)' }} />
                2D Scanner & Barcode Checkout
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>Scan product QR codes or barcode labels to build a batch order.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
              <button 
                onClick={() => { setScannerActiveTab('simulator'); setIsScanning(false); }}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: scannerActiveTab === 'simulator' ? '2px solid var(--primary)' : 'none',
                  color: scannerActiveTab === 'simulator' ? 'var(--foreground)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                💻 Desktop Simulator
              </button>
              <button 
                onClick={() => { setScannerActiveTab('camera'); }}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: scannerActiveTab === 'camera' ? '2px solid var(--primary)' : 'none',
                  color: scannerActiveTab === 'camera' ? 'var(--foreground)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                📷 Live Camera Scan
              </button>
            </div>

            {/* Tab Panels */}
            {scannerActiveTab === 'camera' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                {isScanning ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div 
                      id="qr-reader-viewport" 
                      style={{ 
                        width: '100%', 
                        maxWidth: '350px', 
                        aspectRatio: '1', 
                        overflow: 'hidden', 
                        borderRadius: '12px', 
                        border: '2px solid var(--primary)', 
                        backgroundColor: '#000',
                        position: 'relative' 
                      }}
                    >
                      {/* Laser Line Animation overlay */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                        animation: 'scanLaser 2s linear infinite',
                        zIndex: 10
                      }} />
                      <style>{`
                        @keyframes scanLaser {
                          0% { top: 0%; }
                          50% { top: 100%; }
                          100% { top: 0%; }
                        }
                      `}</style>
                    </div>
                    <button onClick={() => setIsScanning(false)} className="btn btn-secondary" style={{ backgroundColor: 'var(--error)', color: '#fff' }}>Stop Camera</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="search" size={28} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grant camera permissions to start real-time scanning.</p>
                    <button onClick={() => setIsScanning(true)} className="btn btn-primary">Start QR Scanner</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Simulated Preset Clicks */}
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Click to Simulate Product Scan:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {demoItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleScanSuccess(item.payload);
                        }}
                        className="btn btn-secondary glass-card-hover"
                        style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px' }}
                      >
                        ⚡ {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paste Raw input */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Manual Raw QR Code Input:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      id="manual-qr-input" 
                      placeholder="e.g. SSD 500GB, 3500  or JSON" 
                      className="form-input" 
                      style={{ fontSize: '0.85rem' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val.trim()) {
                            handleScanSuccess(val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const inputEl = document.getElementById('manual-qr-input') as HTMLInputElement;
                        if (inputEl && inputEl.value.trim()) {
                          handleScanSuccess(inputEl.value);
                          inputEl.value = '';
                        }
                      }} 
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    >
                      Process Scan
                    </button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Type values and press Enter or click Process Scan.</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Shopping Cart / Order Finish Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Scanned Ledger Cart ({cart.length})</h4>
                {cart.length > 0 && (
                  <button 
                    onClick={() => setCart([])}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart List */}
              <div style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', backgroundColor: 'var(--surface-hover)' }}>
                {cart.length === 0 ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '40px 0' }}>
                    Cart is empty. Scan products to list them here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.ItemName}>
                            {item.ItemName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Subtotal: ₹{Number(item.Amount || 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Qty & Rate Inputs */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Qty</span>
                            <input 
                              type="number" 
                              value={item.Qty} 
                              min="1"
                              className="form-input" 
                              style={{ width: '55px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'center' }} 
                              onChange={(e) => updateCartItem(idx, 'Qty', Number(e.target.value))} 
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Rate (₹)</span>
                            <input 
                              type="number" 
                              value={item.Rate} 
                              min="0"
                              className="form-input" 
                              style={{ width: '75px', padding: '2px 4px', fontSize: '0.8rem', textAlign: 'right' }} 
                              onChange={(e) => updateCartItem(idx, 'Rate', Number(e.target.value))} 
                            />
                          </div>

                          <button 
                            onClick={() => removeFromCart(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '6px 4px 0 4px' }}
                            title="Remove item"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--success)' }}>₹{cartTotal.toLocaleString()}</span>
                </div>

                <div className="grid-cols-2-form" style={{ gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Pay Mode</label>
                    <select 
                      value={checkoutPayMode} 
                      className="form-input" 
                      style={{ fontSize: '0.8rem', padding: '6px' }}
                      onChange={(e) => setCheckoutPayMode(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Split">Split Payment</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Challan No</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 10052"
                      value={checkoutChallanNo} 
                      className="form-input" 
                      style={{ fontSize: '0.8rem', padding: '6px' }}
                      onChange={(e) => setCheckoutChallanNo(e.target.value)}
                    />
                  </div>
                </div>

                {checkoutPayMode === 'Split' && (
                  <div className="grid-cols-2-form" style={{ gap: '12px', animation: 'fadeIn 0.2s ease' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cash Portion (₹)</label>
                      <input 
                        type="number" 
                        value={checkoutCashAmount} 
                        className="form-input" 
                        style={{ fontSize: '0.8rem', padding: '6px' }}
                        onChange={(e) => setCheckoutCashAmount(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Bank Portion (₹)</label>
                      <input 
                        type="number" 
                        value={checkoutBankAmount} 
                        className="form-input" 
                        style={{ fontSize: '0.8rem', padding: '6px' }}
                        onChange={(e) => setCheckoutBankAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Remarks / Memo</label>
                  <input 
                    type="text" 
                    placeholder="Reference, client details, notes..."
                    value={checkoutRemark} 
                    className="form-input" 
                    style={{ fontSize: '0.8rem', padding: '6px' }}
                    onChange={(e) => setCheckoutRemark(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleCheckout} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  <Icon name="check" size={18} />
                  Finish Order & Invoice
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Quick Actions */}
        <div>
          <h4 style={{ marginBottom: '14px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Register Sale', icon: 'dollar', type: 'sale', color: '#10b981' },
              { label: 'Create Order', icon: 'stock', type: 'order', color: '#3b82f6' },
              { label: 'Inward Replacement', icon: 'refresh', type: 'replacement', color: '#ef4444' },
              { label: 'Add Customer', icon: 'customers', type: 'customer', color: '#8b5cf6' },
              { label: 'Register Event', icon: 'followups', type: 'event', color: '#f59e0b' }
            ].map(act => (
              <button
                key={act.label}
                onClick={() => handleOpenForm(act.type, 'add')}
                className="btn btn-secondary glass-card-hover"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center', padding: '16px', height: '100px', textAlign: 'center', borderRadius: '12px' }}
              >
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--surface-hover)', color: act.color }}>
                  <Icon name={act.icon as IconName} size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { label: 'Registered Customers', count: customers.length, desc: 'Mobile profiles', icon: 'customers', color: '#3b82f6' },
            { label: 'Pending Orders', count: pendingOrdersCount, desc: 'Needs dispatch', icon: 'stock', color: '#f59e0b' },
            { label: 'Total Item Sales', count: `₹${totalSalesAmount.toLocaleString()}`, desc: 'Total invoicing', icon: 'dollar', color: '#10b981' },
            { label: 'Pending Replacements', count: activeReplacementsCount, desc: 'Sent to service center', icon: 'refresh', color: '#ef4444' }
          ].map(kpi => (
            <div key={kpi.label} className="glass-card glass-card-hover" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{kpi.label}</span>
                <div style={{ color: kpi.color, padding: '4px', borderRadius: '6px', backgroundColor: 'var(--surface-hover)' }}>
                  <Icon name={kpi.icon as IconName} size={16} />
                </div>
              </div>
              <h2 style={{ fontSize: '1.8rem', marginTop: '10px', fontWeight: 800 }}>{kpi.count}</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>{kpi.desc}</span>
            </div>
          ))}
        </div>

        {/* Analytics SVG Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card">
            <h4 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 700 }}>Invoiced Sales Trend (Last 6 Months)</h4>
            <div style={{ position: 'relative', height: '200px' }}>
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="40" y1="160" x2="480" y2="160" stroke="var(--border)" strokeWidth="1" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="40" y1="40" x2="480" y2="40" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3" />
                
                <text x="30" y="44" fontSize="9" textAnchor="end" fill="var(--text-secondary)">₹1.0L</text>
                <text x="30" y="104" fontSize="9" textAnchor="end" fill="var(--text-secondary)">₹50K</text>
                <text x="30" y="164" fontSize="9" textAnchor="end" fill="var(--text-secondary)">₹0</text>

                <text x="70" y="180" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">Jan</text>
                <text x="150" y="180" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">Feb</text>
                <text x="230" y="180" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">Mar</text>
                <text x="310" y="180" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">Apr</text>
                <text x="390" y="180" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">May</text>
                <text x="470" y="180" fontSize="9" textAnchor="middle" fill="var(--text-secondary)">Jun</text>

                <path d="M 70 120 Q 150 90 230 110 T 310 70 T 390 50 T 470 45 L 470 160 L 70 160 Z" fill="url(#salesGrad)" />
                <path d="M 70 120 Q 150 90 230 110 T 310 70 T 390 50 T 470 45" fill="none" stroke="#10b981" strokeWidth="3" />
                
                <circle cx="70" cy="120" r="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
                <circle cx="150" cy="90" r="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
                <circle cx="230" cy="110" r="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
                <circle cx="310" cy="70" r="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
                <circle cx="390" cy="50" r="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
                <circle cx="470" cy="45" r="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
              </svg>
            </div>
          </div>

          <div className="glass-card">
            <h4 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 700 }}>Replacement Status Distribution</h4>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '170px' }}>
              <div style={{ flex: 1 }}>
                <svg viewBox="0 0 120 120" style={{ width: '120px', height: '120px' }}>
                  <circle cx="60" cy="60" r="45" fill="none" stroke="var(--border)" strokeWidth="14" />
                  <circle cx="60" cy="60" r="45" fill="none" stroke="#ef4444" strokeWidth="14" strokeDasharray="282" strokeDashoffset="140" strokeLinecap="round" transform="rotate(-90 60 60)" />
                  <circle cx="60" cy="60" r="45" fill="none" stroke="#10b981" strokeWidth="14" strokeDasharray="282" strokeDashoffset="220" strokeLinecap="round" transform="rotate(80 60 60)" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#ef4444' }} />
                  <span>Pending SC Approval: {replacements.filter(r=>r.Status==='Sent to SC').length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#10b981' }} />
                  <span>Delivered Logs: {replacements.filter(r=>r.Status==='Delivered' || r.Status==='Delivered to Customer').length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--border)' }} />
                  <span>Received/Others: {replacements.filter(r=>r.Status==='Received').length}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  };

  const renderEvents = () => {
    const sorted = getSortedData(events);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Corporate Calendar Events</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTEvents catalog</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('event', 'add')}>
            <Icon name="plus" size={16} /> Add Event
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search events..." className="form-input" style={{ width: '260px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('Id')}>ID</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('EventName')}>Event Name</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('PersonName')}>Person Name</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('EventDate')}>Event Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(ev => (
                <tr key={ev.Id}>
                  <td style={{ fontWeight: 'bold' }}>{ev.Id}</td>
                  <td>{ev.EventName}</td>
                  <td>{ev.PersonName}</td>
                  <td>{ev.EventDate ? new Date(ev.EventDate).toISOString().split('T')[0] : 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('event', 'edit', ev)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('event', ev.Id)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No events registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderApps = () => {
    const sorted = getSortedData(applications);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Software Applications Licensing</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTApplications tracking</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('application', 'add')}>
            <Icon name="plus" size={16} /> Register App License
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search app name, client..." className="form-input" style={{ width: '260px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('AppName')}>App Name</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ClientName')}>Client Name</th>
                <th>Client Phone</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('AppExpDate')}>Expiry Date</th>
                <th>Sale Price</th>
                <th>Renewal Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(app => (
                <tr key={app.AppName}>
                  <td style={{ fontWeight: 'bold' }}>{app.AppName}</td>
                  <td>{app.ClientName}</td>
                  <td>{app.ClientMNo}</td>
                  <td>{app.AppExpDate ? new Date(app.AppExpDate).toISOString().split('T')[0] : 'N/A'}</td>
                  <td style={{ fontWeight: 'bold' }}>₹{Number(app.SalePrice || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold' }}>₹{Number(app.Renewal || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${app.AppStatus === '1' ? 'badge-success' : 'badge-danger'}`}>
                      {app.AppStatus === '1' ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('application', 'edit', app)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('application', app.AppName)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No applications registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderCustomers = () => {
    const sorted = getSortedData(customers);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Customers Directory</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTCustomer registry</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('customer', 'add')}>
            <Icon name="plus" size={16} /> Add Customer
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search customer, business, mobile..." className="form-input" style={{ width: '280px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('MobileNo')}>Mobile Number</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('CustomerName')}>Customer Name</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('BusinessName')}>Business Name</th>
                <th>Address</th>
                <th>Alternate Mobile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(cust => (
                <tr key={cust.MobileNo}>
                  <td style={{ fontWeight: 'bold' }}>{cust.MobileNo}</td>
                  <td>{cust.CustomerName}</td>
                  <td>{cust.BusinessName}</td>
                  <td>{cust.Address}</td>
                  <td>{cust.AlternetNo || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('customer', 'edit', cust)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('customer', cust.MobileNo)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No customers registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderCategories = () => {
    const sorted = getSortedData(categories);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Item Categories</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTItemCategory database registry</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('category', 'add')}>
            <Icon name="plus" size={16} /> Add Category
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search category..." className="form-input" style={{ width: '260px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container" style={{ maxWidth: '600px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('Category')}>Category Name</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(cat => (
                <tr key={cat.Category}>
                  <td style={{ fontWeight: 'bold' }}>{cat.Category}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('category', 'edit', cat)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('category', cat.Category)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No categories registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderServiceCenters = () => {
    const sorted = getSortedData(serviceCenters);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Service Centers Directory</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTItemSendTo catalog</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('servicecenter', 'add')}>
            <Icon name="plus" size={16} /> Add Service Center
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search service center name, brand..." className="form-input" style={{ width: '260px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('SendToName')}>Service Center Name</th>
                <th>Brand Focus</th>
                <th>Contact Mobile</th>
                <th>Address Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(sc => (
                <tr key={sc.SendToName}>
                  <td style={{ fontWeight: 'bold' }}>{sc.SendToName}</td>
                  <td><span className="badge badge-primary">{sc.Brand}</span></td>
                  <td>{sc.MobileNo}</td>
                  <td>{sc.Address}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('servicecenter', 'edit', sc)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('servicecenter', sc.SendToName)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No service centers registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderOrders = () => {
    const sorted = getSortedData(orders);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Purchase Item Orders</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTItemOrder tracking</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('order', 'add')}>
            <Icon name="plus" size={16} /> Create Order
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search orders..." className="form-input" style={{ width: '260px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('Id')}>Order ID</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ItemName')}>Item Name</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('UserName')}>Assigned Staff</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(ord => (
                <tr key={ord.Id}>
                  <td style={{ fontWeight: 'bold' }}>ORD-{ord.Id}</td>
                  <td>{ord.ItemName}</td>
                  <td>{ord.UserName}</td>
                  <td>
                    <span className={`badge ${ord.Status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {ord.Status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('order', 'edit', ord)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('order', ord.Id)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No orders registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderSales = () => {
    const sorted = getSortedData(sales);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Billing & Item Sales Ledger</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTSales database logs</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('sale', 'add')}>
            <Icon name="plus" size={16} /> Register Item Sale
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search sales by item name, remark, cashier..." className="form-input" style={{ width: '280px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ItemName')}>Item Sold</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('Amount')}>Total Amount</th>
                <th>Payment Mode</th>
                <th>Staff/Cashier</th>
                <th>Challan No</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(sale => (
                <tr key={sale.Id}>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {sale.SaleDate ? new Date(sale.SaleDate).toISOString().split('T')[0] : 'N/A'}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{sale.ItemName}</td>
                  <td>{sale.Qty} units</td>
                  <td>₹{Number(sale.Rate || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                    ₹{Number(sale.Amount || 0).toLocaleString()}
                  </td>
                  <td><span className="badge badge-primary">{sale.PayMode}</span></td>
                  <td>{sale.UserName}</td>
                  <td style={{ fontFamily: 'monospace' }}>{sale.ChallanNo || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('sale', 'edit', sale)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('sale', sale.Id)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No sales logged.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderReplacements = () => {
    const sorted = getSortedData(replacements);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Item Replacements & Courier Logs</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DTItemReplacement catalog</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('replacement', 'add')}>
            <Icon name="plus" size={16} /> Register Replacement Inward
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search customer, brand, serial, courier..." className="form-input" style={{ width: '280px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Inward Date</th>
                <th>Category / Brand</th>
                <th>Serial / Model</th>
                <th>Customer Details</th>
                <th>Service Center</th>
                <th>Courier Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(rep => (
                <tr key={rep.ID}>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {rep.InwardDate ? new Date(rep.InwardDate).toISOString().split('T')[0] : 'N/A'}
                  </td>
                  <td>
                    <strong>{rep.BrandName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rep.Category}</div>
                  </td>
                  <td>
                    <div>SN: <span style={{ fontFamily: 'monospace' }}>{rep.SerialNo}</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model: {rep.Model}</div>
                  </td>
                  <td>
                    <strong>{rep.CustomerName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mob: {rep.CustomerMNo}</div>
                  </td>
                  <td>
                    <strong>{rep.SendToName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rep.SCAddress ? rep.SCAddress.substring(0, 20) + '...' : ''}</div>
                  </td>
                  <td>
                    <div>No: {rep.CourierNo || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date: {rep.CourierDate ? new Date(rep.CourierDate).toISOString().split('T')[0] : 'Not Sent'}</div>
                  </td>
                  <td>
                    <span className={`badge ${rep.Status === 'Delivered' || rep.Status === 'Delivered to Customer' ? 'badge-success' : 'badge-warning'}`}>
                      {rep.Status || 'Received'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('replacement', 'edit', rep)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('replacement', rep.ID)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No replacements registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderMyAttendance = () => {
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div className="glass-card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3>My Punch Logs & Shifts History</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Punch logs for today's active shift session</p>
            </div>
            <span className={`badge ${attendanceStatus.checkedIn ? 'badge-success' : 'badge-danger'}`}>
              {attendanceStatus.checkedIn ? 'Checked In' : 'Checked Out'}
            </span>
          </div>

          {attendanceLoading ? (
            <p>Loading attendance data...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid-cols-2-form" style={{ gap: '20px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface-hover)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Shift Working Hours</span>
                  <h2 style={{ marginTop: '4px' }}>{attendanceStatus.totalHours || '0.00'} hrs</h2>
                </div>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface-hover)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overtime Hourly Rate</span>
                  <h2 style={{ marginTop: '4px' }}>₹{currentUser?.Rate || 0}/hr</h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleAttendancePunch('checkin')} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--success)' }} disabled={attendanceStatus.checkedIn}>Punch Check In</button>
                <button onClick={() => handleAttendancePunch('checkout')} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--error)' }} disabled={!attendanceStatus.checkedIn}>Punch Check Out</button>
              </div>

              {/* Punch Logs Timeline */}
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>Punch Actions Register</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {attendanceStatus.logs && attendanceStatus.logs.map((log: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface-hover)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: log.LogType === 'IN' ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>{log.LogType}</span>
                        <span>{new Date(log.LogTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {log.IsAutoCheckout && <span className="badge badge-danger">Auto-Out</span>}
                    </div>
                  ))}
                  {(!attendanceStatus.logs || attendanceStatus.logs.length === 0) && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '10px' }}>No punches recorded for today.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBankQrs = () => {
    const sorted = getSortedData(bankQrs);
    const paginated = paginateData(sorted);
    return (
      <div className="page-padding animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Bank QR & Smart QR Management</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>SmartQRCodes catalog</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm('bankqr', 'add')}>
            <Icon name="plus" size={16} /> Create Bank QR
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search business name, category, QRID..." className="form-input" style={{ width: '280px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('QRID')}>QR ID Number</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('BusinessName')}>Business Name</th>
                <th>Mobile Number</th>
                <th>Category Focus</th>
                <th>Working Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(qr => (
                <tr key={qr.QRID}>
                  <td style={{ fontWeight: 'bold' }}>{qr.QRID}</td>
                  <td>{qr.BusinessName}</td>
                  <td>{qr.Mobile}</td>
                  <td>{qr.Category}</td>
                  <td>
                    <span className={`badge ${qr.IsActive ? 'badge-success' : 'badge-danger'}`}>
                      {qr.IsActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleOpenForm('bankqr', 'edit', qr)}><Icon name="edit" size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteRecord('bankqr', qr.QRID)}><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No Bank QR records registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(sorted.length)}
      </div>
    );
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
        <button className="btn btn-secondary" style={{ padding: '6px 12px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>Prev</button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {currentPage} of {totalPages}</span>
        <button className="btn btn-secondary" style={{ padding: '6px 12px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next</button>
      </div>
    );
  };

  const renderActiveView = () => {
    if (loadingData) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '80px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Connecting SQL database parameters...</p>
        </div>
      );
    }
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'events': return renderEvents();
      case 'applications': return renderApps();
      case 'customers': return renderCustomers();
      case 'categories': return renderCategories();
      case 'servicecenters': return renderServiceCenters();
      case 'orders': return renderOrders();
      case 'sales': return renderSales();
      case 'replacements': return renderReplacements();
      case 'myattendance': return renderMyAttendance();
      case 'bankqrs': return renderBankQrs();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ minHeight: '100%' }}>
      {renderActiveView()}

      {/* --- FORM DIALOG DIALOGS --- */}
      {modalType && (
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
          <div className="glass-card animate-scale-up" style={{ width: '95%', maxWidth: '600px', backgroundColor: 'var(--surface)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{modalMode} {modalType === 'bankqr' ? 'Bank QR' : modalType === 'servicecenter' ? 'Service Center' : modalType}</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setModalType(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* EVENT FORM */}
              {modalType === 'event' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Event Name *</label>
                    <input type="text" name="EventName" required className="form-input" value={formData.EventName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Person Name *</label>
                    <input type="text" name="PersonName" required className="form-input" value={formData.PersonName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Event Date *</label>
                    <input type="date" name="EventDate" required className="form-input" value={formData.EventDate || ''} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* APPLICATION/APP FORM */}
              {modalType === 'application' && (
                <div className="grid-cols-2-form">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>App Name *</label>
                    <input type="text" name="AppName" required className="form-input" value={formData.AppName || ''} onChange={handleInputChange} disabled={modalMode === 'edit'} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Client Name</label>
                    <input type="text" name="ClientName" className="form-input" value={formData.ClientName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Client Mobile</label>
                    <input type="text" name="ClientMNo" className="form-input" maxLength={10} value={formData.ClientMNo || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Sale Date</label>
                    <input type="date" name="SaleDate" className="form-input" value={formData.SaleDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Expiry Date</label>
                    <input type="date" name="AppExpDate" className="form-input" value={formData.AppExpDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Sale Price (₹)</label>
                    <input type="number" name="SalePrice" className="form-input" value={formData.SalePrice || 0} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Renewal Price (₹)</label>
                    <input type="number" name="Renewal" className="form-input" value={formData.Renewal || 0} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Activation Cost (₹)</label>
                    <input type="number" name="Activation" className="form-input" value={formData.Activation || 0} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Version No</label>
                    <input type="text" name="verno" className="form-input" placeholder="e.g. v2.1" value={formData.verno || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Device Binding ID</label>
                    <input type="text" name="DeviceID" className="form-input" value={formData.DeviceID || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>License Security Key</label>
                    <input type="text" name="SecretKey" className="form-input" value={formData.SecretKey || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>App Status</label>
                    <select name="AppStatus" className="form-input" value={formData.AppStatus || '1'} onChange={handleInputChange}>
                      <option value="1">Active</option>
                      <option value="0">Expired</option>
                    </select>
                  </div>
                </div>
              )}

              {/* CUSTOMER FORM */}
              {modalType === 'customer' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mobile Number *</label>
                    <input type="text" name="MobileNo" required maxLength={10} className="form-input" placeholder="10-digit number" value={formData.MobileNo || ''} onChange={handleInputChange} disabled={modalMode === 'edit'} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Customer Name *</label>
                    <input type="text" name="CustomerName" required className="form-input" value={formData.CustomerName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Business Name</label>
                    <input type="text" name="BusinessName" className="form-input" value={formData.BusinessName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Address Location</label>
                    <input type="text" name="Address" className="form-input" value={formData.Address || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Alternate Number</label>
                    <input type="text" name="AlternetNo" className="form-input" maxLength={10} value={formData.AlternetNo || ''} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* CATEGORY FORM */}
              {modalType === 'category' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Category Name *</label>
                    <input type="text" name="Category" required className="form-input" value={formData.Category || ''} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* SERVICE CENTER FORM */}
              {modalType === 'servicecenter' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Service Center Name *</label>
                    <input type="text" name="SendToName" required className="form-input" value={formData.SendToName || ''} onChange={handleInputChange} disabled={modalMode === 'edit'} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Brand Focus *</label>
                    <input type="text" name="Brand" required className="form-input" placeholder="e.g. Dell, HP, ASUS" value={formData.Brand || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Contact Mobile</label>
                    <input type="text" name="MobileNo" className="form-input" maxLength={10} value={formData.MobileNo || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Address Location</label>
                    <input type="text" name="Address" className="form-input" value={formData.Address || ''} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* ORDER FORM */}
              {modalType === 'order' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Item Name *</label>
                    <input type="text" name="ItemName" required className="form-input" value={formData.ItemName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Staff Username *</label>
                    <input type="text" name="UserName" required className="form-input" value={formData.UserName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Order Status</label>
                    <select name="Status" className="form-input" value={formData.Status || 'Pending'} onChange={handleInputChange}>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </>
              )}

              {/* SALE FORM */}
              {modalType === 'sale' && (
                <div className="grid-cols-2-form">
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Sale Timestamp *</label>
                    <input type="datetime-local" name="SaleDate" required className="form-input" value={formData.SaleDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Challan No</label>
                    <input type="number" name="ChallanNo" className="form-input" value={formData.ChallanNo || ''} onChange={handleInputChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Item/Model Name *</label>
                    <input type="text" name="ItemName" required className="form-input" value={formData.ItemName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Quantity *</label>
                    <input type="number" name="Qty" required className="form-input" value={formData.Qty || 1} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Rate (₹) *</label>
                    <input type="number" name="Rate" required className="form-input" value={formData.Rate || 0} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Total Amount Calculated (₹)</label>
                    <input type="number" name="Amount" className="form-input" value={formData.Amount || 0} disabled />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Cash Amount Paid (₹)</label>
                    <input type="number" name="Cash" className="form-input" value={formData.Cash || 0} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Bank Amount Paid (₹)</label>
                    <input type="number" name="Bank" className="form-input" value={formData.Bank || 0} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Payment Mode</label>
                    <select name="PayMode" className="form-input" value={formData.PayMode || 'Cash'} onChange={handleInputChange}>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="GPay">UPI / GPay</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Remark Notes</label>
                    <input type="text" name="Remark" className="form-input" value={formData.Remark || ''} onChange={handleInputChange} />
                  </div>
                </div>
              )}

              {/* REPLACEMENT FORM */}
              {modalType === 'replacement' && (
                <div className="grid-cols-2-form">
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Inward Date *</label>
                    <input type="date" name="InwardDate" required className="form-input" value={formData.InwardDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Invoice Date</label>
                    <input type="date" name="InvDate" className="form-input" value={formData.InvDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Invoice Number</label>
                    <input type="text" name="InvNo" className="form-input" value={formData.InvNo || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Item Status</label>
                    <select name="Status" className="form-input" value={formData.Status || 'Received'} onChange={handleInputChange}>
                      <option value="Received">Received</option>
                      <option value="Sent to SC">Sent to SC</option>
                      <option value="Returned from SC">Returned from SC</option>
                      <option value="Delivered to Customer">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Item Category</label>
                    <input type="text" name="Category" className="form-input" placeholder="e.g. RAM, SSD" value={formData.Category || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Brand Manufacturer</label>
                    <input type="text" name="BrandName" className="form-input" placeholder="e.g. Crucial, ASUS" value={formData.BrandName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Item Model</label>
                    <input type="text" name="Model" className="form-input" value={formData.Model || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Serial Number *</label>
                    <input type="text" name="SerialNo" required className="form-input" value={formData.SerialNo || ''} onChange={handleInputChange} />
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Customer Information</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Customer Name *</label>
                    <input type="text" name="CustomerName" required className="form-input" value={formData.CustomerName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Customer Mobile *</label>
                    <input type="text" name="CustomerMNo" required maxLength={10} className="form-input" value={formData.CustomerMNo || ''} onChange={handleInputChange} />
                  </div>

                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Service Center Information</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Send to Service Center</label>
                    <select name="SendToName" className="form-input" value={formData.SendToName || ''} onChange={e => {
                      const selectedCenter = serviceCenters.find(sc => sc.SendToName === e.target.value);
                      setFormData((prev: any) => ({
                        ...prev,
                        SendToName: e.target.value,
                        SCAddress: selectedCenter ? selectedCenter.Address : '',
                        SCMNo: selectedCenter ? selectedCenter.MobileNo : ''
                      }));
                    }}>
                      <option value="">-- Choose Center --</option>
                      {serviceCenters.map(sc => (
                        <option key={sc.SendToName} value={sc.SendToName}>{sc.SendToName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Service Center Address</label>
                    <input type="text" name="SCAddress" className="form-input" value={formData.SCAddress || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Service Center Mobile</label>
                    <input type="text" name="SCMNo" className="form-input" maxLength={10} value={formData.SCMNo || ''} onChange={handleInputChange} />
                  </div>

                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Courier dispatch / Return Log</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Courier Dispatch Date</label>
                    <input type="date" name="CourierDate" className="form-input" value={formData.CourierDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Courier Receipt Number</label>
                    <input type="text" name="CourierNo" className="form-input" value={formData.CourierNo || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Courier Return Date</label>
                    <input type="date" name="ReturnDate" className="form-input" value={formData.ReturnDate || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Returned SN</label>
                    <input type="text" name="ReturnSerialNo" className="form-input" value={formData.ReturnSerialNo || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Repair Charges (₹)</label>
                    <input type="text" name="RepCharges" className="form-input" value={formData.RepCharges || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Delivery to Customer Date</label>
                    <input type="date" name="DeliveryDate" className="form-input" value={formData.DeliveryDate || ''} onChange={handleInputChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Remarks Summary</label>
                    <input type="text" name="Remark" className="form-input" value={formData.Remark || ''} onChange={handleInputChange} />
                  </div>
                </div>
              )}

              {/* BANK QR FORM */}
              {modalType === 'bankqr' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>QR ID Number *</label>
                    <input type="number" name="QRID" required className="form-input" placeholder="e.g. 1001" value={formData.QRID || ''} onChange={handleInputChange} disabled={modalMode === 'edit'} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Business Name *</label>
                    <input type="text" name="BusinessName" required className="form-input" value={formData.BusinessName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Associated Mobile *</label>
                    <input type="number" name="Mobile" required className="form-input" value={formData.Mobile || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>QR Category Focus</label>
                    <input type="text" name="Category" className="form-input" placeholder="e.g. Shop, UPI merchant" value={formData.Category || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>QR Status</label>
                    <select name="IsActive" className="form-input" value={formData.IsActive ? 'true' : 'false'} onChange={e => setFormData((prev: any) => ({ ...prev, IsActive: e.target.value === 'true' }))}>
                      <option value="true">Active</option>
                      <option value="false">Suspended</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
