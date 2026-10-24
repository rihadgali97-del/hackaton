import { ArrowUpRight, Info, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function PriorityScore({ brief }) {
  const { t } = useLanguage();
  if (!brief) return <span className="priority-score priority-score-watch">{t('Awaiting signal')}</span>;
  return <span className={`priority-score priority-score-${brief.level}`} title={t(brief.recommendation)}>{brief.score} · {t(brief.label)}</span>;
}

export default function PriorityBrief({ brief }) {
  const { language, t } = useLanguage();
  if (!brief) return null;
  return <section className={`priority-brief priority-brief-${brief.level}`} aria-labelledby="priority-brief-title">
    <div className="priority-brief-heading"><span className="priority-brief-icon"><ShieldAlert size={17}/></span><div><p className="eyebrow">{t('FIXNEARME CIVIC INTELLIGENCE')}</p><h2 id="priority-brief-title">{t('Priority brief')}</h2></div><PriorityScore brief={brief}/></div>
    <p className="priority-recommendation"><ArrowUpRight size={15}/>{t(brief.recommendation)}</p>
    <div className="priority-meter" role="img" aria-label={language === 'am' ? `የማኅበረሰቡ ቅድሚያ ምልክት ${brief.score} ከ100` : `Community priority signal ${brief.score} out of 100`}><span style={{ width: `${brief.score}%` }}/></div>
    <ul className="priority-reasons">{brief.reasons.map((reason, index) => {
      const neighbors = reason.label.match(/^(\d+) neighbors confirmed this report$/);
      const openDays = reason.label.match(/^Open for (\d+) days$/);
      const selectedPriority = reason.label.match(/^([A-Z]+) selected priority$/);
      const label = language === 'am' && neighbors ? `${neighbors[1]} ጎረቤቶች ይህን ሪፖርት አረጋግጠዋል`
        : language === 'am' && openDays ? `${openDays[1]} ቀናት ክፍት ሆኖ ቆይቷል`
          : language === 'am' && selectedPriority ? `${t(selectedPriority[1][0] + selectedPriority[1].slice(1).toLowerCase())} ቅድሚያ ተመርጧል`
            : t(reason.label);
      return <li key={`${reason.label}-${index}`}><span>{label}</span><b>+{reason.points}</b></li>;
    })}</ul>
    <p className="priority-disclaimer"><Info size={13}/> {t('Assistive signal only. Staff should review the report before deciding how to respond.')}</p>
  </section>;
}
