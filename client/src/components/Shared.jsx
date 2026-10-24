import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, LoaderCircle, MapPin, MessageCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const statuses = {
  reported: ['Reported', 'badge-slate'], under_review: ['Under review', 'badge-amber'],
  pending_verification: ['Pending verification', 'badge-amber'],
  in_progress: ['In progress', 'badge-blue'], resolved: ['Resolved', 'badge-green'], rejected: ['Closed', 'badge-red'],
};

export function StatusBadge({ status }) {
  const { t } = useLanguage();
  const [label, style] = statuses[status] || ['Unknown', 'badge-slate'];
  return <span className={`badge ${style}`}><span className="badge-dot" />{t(label)}</span>;
}

export function PriorityBadge({ priority }) {
  const { t } = useLanguage();
  if (!priority || priority === 'medium') return null;
  return <span className={`priority priority-${priority}`}>{t(priority[0].toUpperCase() + priority.slice(1))}</span>;
}

export function ReportCard({ report }) {
  const { language, locale, t } = useLanguage();
  const date = new Date(report.created_at);
  const category = report.category_name || report.category.replaceAll('_', ' ');
  const translatedCategory = t(category) === category ? t(category.replace(/\b\w/g, (letter) => letter.toUpperCase())) : t(category);
  return (
    <Link to={`/reports/${report.id}`} className="report-card group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="category-label">{translatedCategory}</span><PriorityBadge priority={report.priority} /></div>
          <h3 className="line-clamp-2 text-base font-bold text-ink group-hover:text-leaf">{report.title}</h3></div>
        <ArrowRight size={18} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-leaf" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1"><MapPin size={13} />{report.neighborhood}</span><span className="inline-flex items-center gap-1"><Clock3 size={13} />{Number.isNaN(date.getTime()) ? t('Recently') : date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span><span className="inline-flex items-center gap-1"><MessageCircle size={13} />{Number(report.confirmations || 0)} {language === 'am' ? 'ማረጋገጫ' : 'confirmations'}</span></div>
      <div className="mt-4 flex items-center justify-between"><StatusBadge status={report.status} /><span className="text-[11px] text-muted">#{String(report.id).padStart(4, '0')}</span></div>
    </Link>
  );
}

export function Loading({ label = 'Loading' }) { const { t } = useLanguage(); return <div className="state-card"><LoaderCircle size={23} className="animate-spin text-leaf" /><span>{t(label)}</span></div>; }

export function ErrorState({ message, onRetry }) { const { t } = useLanguage(); return <div role="alert" className="state-card state-error"><AlertCircle size={21} /><div className="flex-1"><p className="font-semibold">{t('Couldn’t load this right now')}</p><p className="mt-1 text-sm opacity-80">{t(message)}</p></div>{onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}><RefreshCw size={14} />{t('Retry')}</button>}</div>; }

export function EmptyState({ title = 'Nothing here yet', text = 'When there is an update, it will show up here.' }) { const { t } = useLanguage(); return <div className="empty-state"><div className="empty-icon"><CheckCircle2 size={23} /></div><h3>{t(title)}</h3><p>{t(text)}</p></div>; }

export function InlineMessage({ type = 'error', children }) { const { t } = useLanguage(); return <div className={`inline-message ${type}`} role={type === 'error' ? 'alert' : 'status'}>{type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{typeof children === 'string' ? t(children) : children}</div>; }

export function PageHeading({ eyebrow, title, description, action }) { const { t } = useLanguage(); return <div className="page-heading"><div><p className="eyebrow">{t(eyebrow)}</p><h1>{t(title)}</h1>{description && <p className="page-description">{t(description)}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>; }
