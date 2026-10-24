import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { api } from '../services/api';
import { InlineMessage, PageHeading, ReportCard } from '../components/Shared';
import ReportMap from '../components/ReportMap';
import { useLanguage } from '../context/LanguageContext';

const initial = { title: '', description: '', category: '', neighborhood: '', landmark: '', latitude: '', longitude: '' };

export default function NewReport() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initial); const [errors, setErrors] = useState({}); const [matches, setMatches] = useState([]);
  const [checking, setChecking] = useState(false); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState(null); const [checked, setChecked] = useState(false);
  const [image, setImage] = useState(null); const [imageError, setImageError] = useState(''); const [imagePreview, setImagePreview] = useState(''); const imageInput = useRef(null);
  const [categories, setCategories] = useState([]); const [categoryError, setCategoryError] = useState('');
  const [locating, setLocating] = useState(false); const [locationMessage, setLocationMessage] = useState('');
  const [locationToolsOpen, setLocationToolsOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { if (imagePreview) return () => URL.revokeObjectURL(imagePreview); }, [imagePreview]);
  useEffect(() => { api('/categories').then((result) => setCategories(result.data)).catch((error) => setCategoryError(error.message)); }, []);
  function set(key, value) { setForm((old) => ({ ...old, [key]: value })); setErrors((old) => ({ ...old, [key]: undefined })); setMessage(null); setChecked(false); }
  function chooseMapLocation(location) {
    setForm((old) => ({ ...old, latitude: location.latitude.toFixed(7), longitude: location.longitude.toFixed(7) }));
    setErrors((old) => ({ ...old, latitude: undefined, longitude: undefined, coordinates: undefined }));
    setLocationMessage(t('Problem location selected. Click somewhere else on the map to move the pin.'));
    setChecked(false);
  }
  function useCurrentLocation() {
    setLocationMessage('');
    if (!navigator.geolocation) { setLocationMessage(t('Location is not available in this browser.')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      chooseMapLocation({ latitude: coords.latitude, longitude: coords.longitude });
      setLocationMessage(t('Current location added') + ` (±${Math.round(coords.accuracy)} ${t('meters accuracy')}).`);
      setLocationToolsOpen(true);
      setLocating(false);
    }, (error) => {
      setLocationMessage(error.code === 1 ? t('Location permission was denied. Allow location access in your browser, or place the pin on the map.') : t('Could not get your location. Try selecting a point on the map.'));
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  function validate() {
    const next = {};
    if (form.title.trim().length < 5) next.title = t('Please use at least 5 characters.');
    if (form.description.trim().length < 10) next.description = t('Add at least 10 characters so the team knows what to look for.');
    if (!categories.some((category) => category.slug === form.category)) next.category = categoryError || t('Choose an active issue category.');
    if (form.neighborhood.trim().length < 2) next.neighborhood = t('Enter the neighborhood.');
    setErrors(next); return Object.keys(next).length === 0;
  }
  function body() { return { title: form.title.trim(), description: form.description.trim(), category: form.category, neighborhood: form.neighborhood.trim(), landmark: form.landmark.trim() || null, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null }; }
  function chooseImage(event) {
    const file = event.target.files?.[0];
    setImageError(''); setImagePreview(''); setImage(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setImageError('Choose a JPEG, PNG, or WebP image.'); event.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { setImageError('The image must be 5 MB or smaller.'); event.target.value = ''; return; }
    setImage(file); setImagePreview(URL.createObjectURL(file));
  }
  function removeImage() { setImage(null); setImageError(''); setImagePreview(''); if (imageInput.current) imageInput.current.value = ''; }
  async function checkDuplicates(event) {
    event.preventDefault(); if (!validate()) return;
    setChecking(true); setMessage(null);
    try { const response = await api('/reports/check-duplicates', { method: 'POST', body: JSON.stringify(body()) }); setMatches(response.data || []); setChecked(true); }
    catch (e) { setMessage({ type: 'error', text: `${t('We couldn’t check for similar reports')}: ${e.message} ${t('You can still submit your report.')}` }); }
    finally { setChecking(false); }
  }
  async function submit(event) {
    event.preventDefault(); if (!validate()) return;
    setSubmitting(true); setMessage(null);
    try {
      const formData = new FormData();
      Object.entries(body()).forEach(([key, value]) => { if (value !== null && value !== '') formData.append(key, String(value)); });
      if (image) formData.append('image', image);
      const response = await api('/reports', { method: 'POST', body: formData });
      navigate(`/reports/${response.data.id}`, { state: { created: true } });
    }
    catch (e) {
      const fieldErrors = Object.fromEntries((e.details || []).map((item) => [item.field, item.message]));
      setErrors((old) => ({ ...old, ...fieldErrors }));
      setMessage({ type: 'error', text: e.message });
    } finally { setSubmitting(false); }
  }
  return <div className="content-page form-page">
    <Link className="back-link" to="/"><ArrowLeft size={15} /> {t('Back to overview')}</Link>
    <PageHeading eyebrow={t('MAKE IT VISIBLE')} title={t('Report a problem')} description={t('A few clear details help your local team understand what’s happening and where.')} />
    <div className="form-layout"><form className="report-form" onSubmit={submit} noValidate>
      {message && <InlineMessage type={message.type}>{message.text}</InlineMessage>}
      <div className="form-section-head"><span>01</span><div><h2>{t('What’s going on?')}</h2><p>{t('Tell us what you noticed. Keep it clear and specific.')}</p></div></div>
      <label className="field">{t('Report title')} <span className="required">*</span><input maxLength="180" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('e.g. Streetlight out on Maple Avenue')} aria-invalid={Boolean(errors.title)} />{errors.title && <small className="field-error">{errors.title}</small>}<small className="field-hint">{form.title.length}/180 {t('characters')}</small></label>
      <label className="field">{t('Description')} <span className="required">*</span><textarea rows="5" maxLength="5000" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t('What happened? When did you first notice it? Any details that could help the team find it?')} aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}<small className="field-hint">{t('A helpful description gets the right attention.')}</small></label>
      <label className="field">{t('Type of issue')} <span className="required">*</span><select value={form.category} onChange={(e) => set('category', e.target.value)} aria-invalid={Boolean(errors.category)} disabled={!categories.length}><option value="">{categories.length ? t('Choose a category') : t('Loading categories…')}</option>{categories.map((category) => <option value={category.slug} key={category.slug}>{t(category.name)}</option>)}</select>{errors.category && <small className="field-error">{errors.category}</small>}</label>
      <div className="form-section-head second"><span>02</span><div><h2>{t('Help us find it')}</h2><p>{t('A neighborhood and landmark give the team a good starting point.')}</p></div></div>
      <label className="field">{t('Neighborhood')} <span className="required">*</span><input maxLength="120" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} placeholder={t('e.g. Bole')} aria-invalid={Boolean(errors.neighborhood)} />{errors.neighborhood && <small className="field-error">{errors.neighborhood}</small>}</label>
      <label className="field">{t('Nearby landmark')} <span className="optional">{t('OPTIONAL')}</span><input maxLength="255" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} placeholder={t('A building, shop, school, or nearby street')} /><small className="field-hint">{t('For example, “opposite Bole clinic entrance”.')}</small></label>
      <div className="field image-field"><span>{t('Photo of the problem')} <span className="optional">{t('OPTIONAL')}</span></span><label className={`image-picker ${imagePreview ? 'has-image' : ''}`}><input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /><span className="image-picker-mark"><MapPin size={18} /></span><span className="image-picker-copy"><b>{image ? image.name : t('Add a photo')}</b><small>JPEG, PNG, or WebP · {t('up to 5 MB')}</small></span><span className="image-picker-button">{t('Browse')}</span></label>{imageError && <small className="field-error" role="alert">{imageError}</small>}{imagePreview && <div className="image-preview"><img src={imagePreview} alt={t('Preview of the image attached to this report')} /><button type="button" onClick={removeImage}>{t('Remove photo')}</button></div>}<small className="field-hint">{t('A clear photo helps the local team understand what to look for. Please avoid including people’s faces.')}</small></div>
      <section className="location-panel" aria-labelledby="problem-location-title"><div className="location-panel-heading"><span className="location-panel-icon"><MapPin size={17}/></span><div><h3 id="problem-location-title">{t('Pinpoint the problem')}</h3><p>{t('Share your device location while you’re at the issue. Your browser will ask you to allow access.')}</p></div></div><button type="button" className={`btn ${form.latitude && form.longitude ? 'btn-secondary' : 'btn-primary'} locate-button`} onClick={useCurrentLocation} disabled={locating}>{locating ? t('Finding your location…') : <><MapPin size={15}/> {form.latitude && form.longitude ? t('Update my location') : t('Use my current location')}</>}</button>{locationMessage && <small className="location-message" role="status">{locationMessage}</small>}{form.latitude && form.longitude && <div className="location-selected"><CheckCircle2 size={15}/><span>{t('Problem location is attached to this report')}</span></div>}<details className="coordinates" open={locationToolsOpen} onToggle={(event) => setLocationToolsOpen(event.currentTarget.open)}><summary>{form.latitude && form.longitude ? t('Adjust the pin on the map') : t('Choose the problem location on a map')}</summary><p className="map-picker-instruction">{t('Click the map to place or move the pin. If you can’t share device location, you can still choose the spot here.')}</p>{locationToolsOpen && <ReportMap reports={[]} selectedLocation={form.latitude && form.longitude ? {latitude:Number(form.latitude),longitude:Number(form.longitude)} : null} onPick={chooseMapLocation} className="location-picker-map" />}</details></section>
      <div className="form-divider" /><button type="button" onClick={checkDuplicates} disabled={checking || submitting} className="btn btn-secondary duplicate-check"><Sparkles size={16} />{checking ? t('Checking nearby reports…') : t('Check for similar reports')}<ArrowRight size={15} /></button>
      {checked && matches.length > 0 && <div className="duplicate-results"><div className="duplicate-heading"><TriangleAlert size={18} /><div><b>We found some reports that may be related</b><span>These are suggestions. You can still submit a new report.</span></div></div><div className="duplicate-list">{matches.slice(0, 3).map(({ report, score, reasons }) => <Link key={report.id} to={`/reports/${report.id}`} className="duplicate-item"><span><b>{report.title}</b><small>{report.neighborhood} · {reasons.join(' · ')}</small></span><span className="similarity-score">{score}% match <ArrowRight size={13} /></span></Link>)}</div></div>}
      {checked && matches.length === 0 && <div className="duplicate-clear"><CheckCircle2 size={16} /> {t('No close matches found. Your report is ready to go.')}</div>}
      <div className="submit-row"><span><ShieldCheck size={15} /> {t('Your report will be visible to the community.')}</span><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('Sending report…') : <>{t('Submit report')} <ArrowRight size={16} /></>}</button></div>
    </form><aside className="form-aside"><div className="aside-note"><span className="aside-note-icon"><Sparkles size={19} /></span><p className="eyebrow">{t('A GOOD REPORT HELPS')}</p><h3>{t('Small details make a big difference.')}</h3><p>{t('Include a nearby landmark or describe when you noticed the issue. It helps your neighbors and local teams act with confidence.')}</p></div><div className="aside-example"><b>{t('What happens next?')}</b><div className="mini-step"><span>1</span><p>{t('Your report appears in the community feed.')}</p></div><div className="mini-step"><span>2</span><p>{t('Neighbors can confirm if they’ve seen it too.')}</p></div><div className="mini-step"><span>3</span><p>{t('Local staff share updates as work progresses.')}</p></div></div><div className="privacy-note"><ShieldCheck size={16} /><span>{t('Report submissions are public. Avoid adding personal or sensitive information.')}</span></div></aside></div>
  </div>;
}
