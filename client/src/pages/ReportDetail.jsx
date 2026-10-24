import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, MessageCircle, ShieldCheck, UserRound } from 'lucide-react';
import { api, mediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, InlineMessage, Loading, PriorityBadge, ReportCard, StatusBadge } from '../components/Shared';
import PriorityBrief from '../components/PriorityBrief';
import { useLanguage } from '../context/LanguageContext';

export default function ReportDetail() {
  const { id } = useParams(); const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [report, setReport] = useState(null); const [updates, setUpdates] = useState([]); const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(null);
  async function load() {
    setLoading(true); setError('');
    try {
      const [r, history] = await Promise.all([api(`/reports/${id}`), api(`/reports/${id}/updates`)]);
      setReport(r.data); setUpdates(history.data);
      if (r.data.status !== 'resolved' && r.data.status !== 'rejected') {
        const similar = await api('/reports/check-duplicates', { method: 'POST', body: JSON.stringify(r.data) }).catch(() => ({ data: [] }));
        setMatches(similar.data.map((item) => item.report).filter((item) => String(item.id) !== String(id)).slice(0, 2));
      } else setMatches([]);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);
  async function confirm() {
    setBusy(true); setMessage(null);
    try { await api(`/reports/${id}/confirm`, { method: 'POST' }); setMessage({ type: 'success', text: t('Thanks for confirming this report. Your support helps the team see what matters.') }); await load(); }
    catch (e) { setMessage({ type: 'error', text: t(e.status === 409 ? 'You’ve already confirmed this report.' : e.message) }); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="content-page"><Loading label={t('Opening report…')} /></div>;
  if (error) return <div className="content-page"><ErrorState message={t(error)} onRetry={load} /><Link className="back-link" to="/reports"><ArrowLeft size={15} /> {t('Back to reports')}</Link></div>;
  const date = new Date(report.created_at);
  return <div className="content-page detail-page">
    <Link className="back-link" to="/reports"><ArrowLeft size={15} /> {t('All reports')}</Link>
    <div className="detail-layout"><article className="detail-main"><div className="detail-topline"><span className="category-label">{t(report.category_name || report.category.replaceAll('_',' '))}</span><PriorityBadge priority={report.priority} /><StatusBadge status={report.status} /></div><h1 className="detail-title">{report.title}</h1><div className="detail-meta"><span><MapPin size={15} />{report.neighborhood}{report.landmark ? ` · ${report.landmark}` : ''}</span><span><Clock3 size={15} />{t('Reported')} {date.toLocaleDateString(locale, { year:'numeric', month:'long', day:'numeric' })}</span><span>#{String(report.id).padStart(4,'0')}</span></div>{report.image_url && <figure className="report-photo"><img src={mediaUrl(report.image_url)} alt={t('Photo showing:') + ` ${report.title}`} loading="lazy" /><figcaption>{t('Photo submitted with this report')}</figcaption></figure>}{report.resolution_image_url && <figure className="report-photo resolution-photo"><img src={mediaUrl(report.resolution_image_url)} alt={t('Approved repair completion for:') + ` ${report.title}`} loading="lazy"/><figcaption>{t(report.status === 'resolved' ? 'Completion photo approved by an admin' : 'Completion photo submitted for admin review')}</figcaption></figure>}<div className="detail-description">{report.description}</div><PriorityBrief brief={report.priority_brief}/>
      {user?.role !== 'staff' && <div className="detail-confirm"><div className="confirm-symbol"><MessageCircle size={20} /></div><div><b>{t('Know this needs attention too?')}</b><p>{t('Confirming helps your neighbors and local team understand the impact.')}</p></div>{user ? <button className="btn btn-primary" disabled={busy || ['resolved','rejected'].includes(report.status)} onClick={confirm}>{busy ? t('Confirming…') : <><Check size={16} /> {t('I see this too')} · {report.confirmations || 0}</>}</button> : <Link className="btn btn-primary" to="/login?returnTo=/reports">{t('Sign in to confirm')}</Link>}</div>}
      {message && <div className="mt-3"><InlineMessage type={message.type}>{message.text}</InlineMessage></div>}
      {matches.length > 0 && <section className="similar-section"><div className="subsection-title"><div><p className="eyebrow">{t('SOMETHING SIMILAR?')}</p><h2>{t('Related reports nearby')}</h2></div><span>{t('Suggestions only')}</span></div><div className="report-grid">{matches.map((item) => <ReportCard key={item.id} report={item} />)}</div></section>}
    </article><aside className="detail-aside"><section className="side-card"><p className="eyebrow">{t('PROGRESS SO FAR')}</p><h2>{t('Report timeline')}</h2>{updates.length ? <ol className="timeline">{updates.map((item, i) => <li key={item.id} className="timeline-item"><span className={`timeline-marker ${i === updates.length - 1 ? 'latest' : ''}`} />{i < updates.length - 1 && <span className="timeline-line" />}<div><b>{t(({ under_review:'Under review', pending_verification:'Pending verification', in_progress:'In progress', reported:'Reported', resolved:'Resolved', rejected:'Closed' })[item.new_status] || 'Report updated')}</b><time>{new Date(item.created_at).toLocaleString(locale, { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}</time>{item.note && <p>{item.note}</p>}{item.image_url && <figure className="timeline-proof"><img src={mediaUrl(item.image_url)} alt={t('Staff completion proof')} loading="lazy"/><figcaption>{t(item.new_status === 'resolved' ? 'Admin-approved completion photo' : 'Completion photo submitted for review')}</figcaption></figure>}{item.updated_by && <small><UserRound size={12} /> {item.updated_by}</small>}</div></li>)}</ol> : <EmptyState title={t('Just getting started')} text={t('Updates will appear here as the report moves forward.')} />}</section>
      <section className="side-note"><ShieldCheck size={19} /><div><b>{t('Every update is accountable')}</b><p>{t('Changes are recorded so neighbors can follow progress clearly.')}</p></div></section></aside></div>
    {user?.role !== 'staff' && <div className="detail-footer-cta"><div><b>{t('Know another issue that needs attention?')}</b><span>{t('Every report helps create a clearer picture.')}</span></div><Link className="text-link" to="/report/new">{t('Share a report')} <ArrowRight size={15} /></Link></div>}
  </div>;
}
