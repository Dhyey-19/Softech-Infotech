"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon, IconName } from '../../components/Icons';

interface SidebarItem {
  label: string;
  view?: string;
  path?: string;
  icon: IconName;
}

interface NavGroup {
  title: string;
  items: SidebarItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  
  // Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  
  // Dropdown States
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mock Notifications for system alerts
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Low Stock Alert', desc: 'ASUS Motherboard Prime H510 is below 3 units.', time: '10 mins ago', type: 'warning', read: false },
    { id: 2, title: 'New Lead Assigned', desc: 'Reliance Refineries lead assigned to you.', time: '1 hr ago', type: 'info', read: false },
    { id: 3, title: 'Check In Success', desc: 'You checked in successfully at 09:32 AM.', time: '4 hrs ago', type: 'success', read: true },
  ]);

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Read view from search params
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || 'dashboard';
      setActiveView(view);
    };

    handleUrlChange();
    // Watch for URL changes on client-side
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [router, pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSidebarItemClick = (item: SidebarItem) => {
    setIsMobileOpen(false);
    if (item.path) {
      router.push(item.path);
    } else if (item.view) {
      router.push(`/dashboard?view=${item.view}`);
      setActiveView(item.view);
    }
  };

  const getBreadcrumbs = () => {
    if (pathname.includes('/users')) return ['Admin', 'Users'];
    if (pathname.includes('/brands')) return ['Masters', 'Brand Catalog'];
    if (pathname.includes('/attendance')) return ['HR & Staff', 'Attendance Logs'];
    
    if (activeView === 'events') return ['Admin', 'Events'];
    if (activeView === 'applications') return ['Admin', 'Apps Log'];
    
    if (activeView === 'customers') return ['Masters', 'Customers'];
    if (activeView === 'categories') return ['Masters', 'Categories'];
    if (activeView === 'servicecenters') return ['Masters', 'Service Centers'];
    
    if (activeView === 'orders') return ['Orders'];
    if (activeView === 'sales') return ['Sales'];
    if (activeView === 'replacements') return ['Replacements'];
    if (activeView === 'myattendance') return ['My Attendance'];
    if (activeView === 'bankqrs') return ['Bank QR'];
    if (activeView === 'profile') return ['Profile'];
    
    return ['Dashboard', 'Overview'];
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path) {
      return pathname === item.path;
    }
    if (item.view) {
      return pathname === '/dashboard' && activeView === item.view;
    }
    return false;
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const navigationGroups: NavGroup[] = [
    {
      title: 'Admin',
      items: [
        { label: 'Users', path: '/dashboard/users', icon: 'users' },
        { label: 'Events', view: 'events', icon: 'followups' },
        { label: 'Apps', view: 'applications', icon: 'tasks' }
      ]
    },
    {
      title: 'Masters',
      items: [
        { label: 'Customers', view: 'customers', icon: 'customers' },
        { label: 'Brands', path: '/dashboard/brands', icon: 'brands' },
        { label: 'Categories', view: 'categories', icon: 'categories' },
        { label: 'Service Centers', view: 'servicecenters', icon: 'assets' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', view: 'dashboard', icon: 'dashboard' },
        { label: 'Orders', view: 'orders', icon: 'stock' },
        { label: 'Sales', view: 'sales', icon: 'dollar' },
        { label: 'Replacements', view: 'replacements', icon: 'refresh' },
        { label: 'My Attendance', view: 'myattendance', icon: 'attendance' },
        { label: 'Bank QR', view: 'bankqrs', icon: 'opportunities' }
      ]
    }
  ];

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontWeight: 600 }}>Authenticating session...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
      
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        style={{
          width: isSidebarCollapsed ? '72px' : '260px',
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--sidebar-text)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          position: 'relative'
        }}
        className={`sidebar-panel ${isMobileOpen ? 'mobile-show' : ''}`}
      >
        <style>{`
          @media (max-width: 768px) {
            .sidebar-panel {
              position: fixed !important;
              left: 0;
              top: 0;
              bottom: 0;
              transform: translateX(-100%);
              width: 260px !important;
              transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .sidebar-panel.mobile-show {
              transform: translateX(0);
            }
          }
        `}</style>

        {/* Sidebar Header */}
        <div style={{
          height: '64px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#2563eb' }}>
                <Icon name="dashboard" size={18} style={{ color: '#fff' }} />
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                Softech <span style={{ color: '#3b82f6' }}>Infotech</span>
              </span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#2563eb' }}>
              <Icon name="dashboard" size={20} style={{ color: '#fff' }} />
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }}
              title="Collapse menu"
            >
              <Icon name="chevron-left" size={18} />
            </button>
          )}
        </div>

        {/* User Badge Section */}
        {!isSidebarCollapsed && (
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
            }}>
              {user.UserName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.UserName}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
                width: 'fit-content',
                marginTop: '4px',
                textTransform: 'uppercase'
              }}>
                {user.UserType || 'Staff'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }} className="no-scrollbar">
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {navigationGroups.map((group, groupIdx) => (
            <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!isSidebarCollapsed && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  padding: '0 20px',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  {group.title}
                </span>
              )}
              {group.items.map((item, itemIdx) => {
                const active = isItemActive(item);
                return (
                  <div
                    key={itemIdx}
                    onClick={() => handleSidebarItemClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: isSidebarCollapsed ? '10px 0' : '10px 20px',
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      cursor: 'pointer',
                      color: active ? '#ffffff' : '#94a3b8',
                      backgroundColor: active ? 'var(--sidebar-active)' : 'transparent',
                      borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon name={item.icon} size={18} style={{ flexShrink: 0, color: active ? '#3b82f6' : 'inherit' }} />
                    {!isSidebarCollapsed && (
                      <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 500 }}>
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {isSidebarCollapsed ? (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
              title="Expand menu"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/dashboard?view=profile')}
                className="btn btn-secondary"
                style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#fff' }}
              >
                <Icon name="profile" size={16} />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                <Icon name="logout" size={16} />
                Logout
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navbar */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          zIndex: 30
        }}>
          
          {/* Left Side: Mobile Menu Button & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsMobileOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--foreground)',
                cursor: 'pointer',
                display: 'none',
                padding: '4px'
              }}
              className="mobile-menu-btn"
            >
              ☰
            </button>
            <style>{`
              @media (max-width: 768px) {
                .mobile-menu-btn { display: flex !important; }
              }
            `}</style>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Softech Infotech</span>
                {getBreadcrumbs().map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span>/</span>
                    <span style={{ color: idx === getBreadcrumbs().length - 1 ? 'var(--foreground)' : 'var(--text-secondary)', fontWeight: idx === getBreadcrumbs().length - 1 ? 600 : 'normal' }}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Global Search, Theme, Notifications, User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Global Search Bar (Hidden on Mobile) */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="search-bar-desktop">
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }}>
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Global search..."
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '220px',
                  transition: 'all 0.15s ease'
                }}
                onFocus={e => { e.currentTarget.style.width = '280px'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={e => { e.currentTarget.style.width = '220px'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <style>{`
              @media (max-width: 600px) {
                .search-bar-desktop { display: none !important; }
              }
            `}</style>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--foreground)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--surface-hover)'
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            </button>

            {/* Notifications Popover */}
            <div style={{ position: 'relative' }} ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--surface-hover)',
                  position: 'relative'
                }}
              >
                <Icon name="notifications" size={18} />
                {unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--error)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  width: '320px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px 0',
                  zIndex: 100,
                  animation: 'scaleUp 0.15s ease-out forwards'
                }}>
                  <div style={{ padding: '0 16px 8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Notifications</span>
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: n.read ? 'transparent' : 'var(--primary-light)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: n.type === 'warning' ? 'var(--warning)' : 'var(--foreground)' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{n.time}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 16px 0 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => { setIsNotificationOpen(false); router.push('/dashboard?view=notifications'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View all system alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface-hover)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}>
                  {user.UserName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }} className="search-bar-desktop">
                  {user.UserName}
                </span>
                <Icon name="chevron-down" size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>

              {isProfileOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  width: '200px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px 0',
                  zIndex: 100,
                  animation: 'scaleUp 0.15s ease-out forwards'
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0 }}>{user.UserName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{user.UserType}</p>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <button
                      onClick={() => { setIsProfileOpen(false); router.push('/dashboard?view=profile'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.85rem' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon name="profile" size={16} />
                      My Profile
                    </button>
                    <button
                      onClick={() => { setIsProfileOpen(false); router.push('/dashboard?view=settings'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.85rem' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon name="settings" size={16} />
                      Account Settings
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0 0 0' }}>
                    <button
                      onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon name="logout" size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Container */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {children}
        </main>
      </div>

    </div>
  );
}
