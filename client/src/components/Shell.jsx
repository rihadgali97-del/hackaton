import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, CircleUserRound, Leaf, LogOut, Menu, Plus, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';

export default function Shell() {
  const { user, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const navigate = useNavigate();
  const links = [
    { to: '/', label: t('Overview'), end: true },
    { to: '/reports', label: t('Explore reports') },
    ...(user?.role === 'staff' ? [{ to: '/staff', label: t('My assignments') }] : []),
    ...(['admin', 'super_admin'].includes(user?.role) ? [
      { to: '/admin', label: t('Admin'), end: true },
      { to: '/admin/categories', label: t('Categories') },
      { to: '/admin/staff', label: t('Staff') },
    ] : []),
  ];
  function logout() { signOut(); setMobileOpen(false); setUserOpen(false); navigate('/'); }
  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner">
      <Link to="/" className="brand"><span className="brand-mark"><Leaf size={18} fill="currentColor" /></span><span>fixnear<span className="brand-light">me</span><small>{t('NEIGHBORHOOD ACTION')}</small></span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{link.label}</NavLink>)}</nav>
      <div className="top-actions"><button type="button" className="language-toggle" onClick={toggleLanguage} aria-label={language === 'en' ? 'Switch language to Amharic' : 'Switch language to English'}>{language === 'en' ? 'አማ' : 'EN'}</button>{user?.role !== 'staff' && <Link to="/report/new" className="btn btn-primary nav-cta"><Plus size={16} strokeWidth={2.5} />{t('Report an issue')}</Link>}
        {['admin', 'super_admin', 'staff'].includes(user?.role) && <NotificationBell />}
        {user ? <div className="user-menu"><button className="user-chip" onClick={() => setUserOpen(!userOpen)} aria-expanded={userOpen}><span className="avatar">{user.name?.slice(0, 1).toUpperCase()}</span><span className="user-chip-copy"><b>{user.name?.split(' ')[0]}</b><small>{t(user.role === 'super_admin' ? 'Super admin' : user.role === 'admin' ? 'Administrator' : user.role === 'staff' ? 'Staff' : 'Resident')}</small></span><ChevronDown size={15} /></button>{userOpen && <div className="user-dropdown"><div className="dropdown-person"><b>{user.name}</b><span>{user.email}</span></div><button onClick={logout}><LogOut size={15} />{t('Sign out')}</button></div>}</div> : <Link to="/login" className="login-link">{t('Sign in')} <ArrowUpRight size={15} /></Link>}
        <button className="mobile-menu" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>{mobileOpen && <div className="mobile-nav">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileOpen(false)}>{link.label}</NavLink>)}{user?.role !== 'staff' && <Link to="/report/new" onClick={() => setMobileOpen(false)}><Plus size={16} /> {t('Report an issue')}</Link>}{user ? <button onClick={logout}><LogOut size={16} /> {t('Sign out')}</button> : <Link to="/login" onClick={() => setMobileOpen(false)}><CircleUserRound size={16} /> {t('Sign in')}</Link>}<button type="button" onClick={toggleLanguage}>{language === 'en' ? 'በአማርኛ ይቀይሩ' : 'Switch to English'}</button></div>}</header>
    <main className="main-content"><Outlet /></main>
    <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><span className="footer-leaf"><Leaf size={16} /></span><b>FixNearMe</b><span>{t('Small fixes. Stronger neighborhoods.')}</span></div><div className="footer-right"><span><ShieldCheck size={14} /> {t('Community-powered · Locally focused')}</span><span>© 2026 FixNearMe</span></div></div></footer>
  </div>;
}
