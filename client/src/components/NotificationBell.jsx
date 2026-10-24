import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ClipboardList } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

function timeAgo(value, language, t) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return t('Just now');
  const formatter = new Intl.RelativeTimeFormat(language === 'am' ? 'am-ET' : 'en-US', { numeric: 'auto' });
  if (seconds < 3600) return formatter.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return formatter.format(-Math.floor(seconds / 3600), 'hour');
  return formatter.format(-Math.floor(seconds / 86400), 'day');
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const refresh = useCallback(async () => {
    try {
      const result = await api('/notifications?limit=30');
      setItems(result.data || []);
      setUnread(Number(result.unread_count) || 0);
      setError('');
    } catch {
      setError(t('Notifications are temporarily unavailable.'));
    }
  }, [t]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [open]);

  async function markAllRead() {
    if (!unread) return;
    try { await api('/notifications/read-all', { method: 'PATCH' }); await refresh(); } catch { setError(t('Could not update notifications. Try again.')); }
  }

  async function openNotification(item) {
    if (!item.read_at) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
      setUnread((count) => Math.max(0, count - 1));
      try { await api(`/notifications/${item.id}/read`, { method: 'PATCH' }); } catch { refresh(); }
    }
    setOpen(false);
    navigate(`/reports/${item.report_id}`);
  }

  return <div className="notification-menu" ref={rootRef}>
    <button className="notification-trigger" type="button" aria-label={`${t('Notifications')}, ${unread} ${t('unread')}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) refresh(); }}>
      <Bell size={19} />{unread > 0 && <span className="notification-badge">{unread > 99 ? '99+' : unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <section className="notification-popover" aria-label={t('Notifications')}>
      <header className="notification-heading"><div><b>{t('Notifications')}</b><small>{unread ? `${unread} ${t('unread')}` : t('You’re all caught up')}</small></div><button type="button" onClick={markAllRead} disabled={!unread}><CheckCheck size={15} />{t('Mark all read')}</button></header>
      {error && <p className="notification-error" role="status">{error}</p>}
      <div className="notification-list">
        {!items.length && !error && <div className="notification-empty"><Bell size={22} /><span>{t('No notifications yet')}</span><small>{t('New reports and assignments will appear here.')}</small></div>}
        {items.map((item) => <button className={`notification-item ${item.read_at ? '' : 'unread'}`} key={item.id} type="button" onClick={() => openNotification(item)}>
          <span className="notification-item-icon"><ClipboardList size={16} /></span><span className="notification-item-copy"><b>{t(item.title)}</b><span>{t(item.body)}</span><small>{timeAgo(item.created_at, language, t)}</small></span>{!item.read_at && <i aria-label={t('Unread')} />}
        </button>)}
      </div>
    </section>}
  </div>;
}
