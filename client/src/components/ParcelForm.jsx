import { useEffect, useRef, useState } from 'react';
import { formatLabel } from '../utils/format.js';
import {
  FIELD_ORDER,
  initialValues,
  serverErrorsToFields,
  toPayload,
  validate,
} from '../utils/parcelForm.js';

function Field({ name, label, required, error, hint, children }) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={`parcel-${name}`} className="field__label">
        {label}
        {required && <span className="field__required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`parcel-${name}-error`} className="field__error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  );
}

export default function ParcelForm({
  meta,
  parcel = null,
  location,
  onLocationChange,
  onSubmit,
  onCancel,
  submitLabel = 'Save parcel',
}) {
  const [values, setValues] = useState(() => initialValues(meta, location, parcel));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const { limits } = meta;

  useEffect(() => {
    if (!location) return;
    setValues((v) =>
      Number(v.lat) === location.lat && Number(v.lng) === location.lng
        ? v
        : { ...v, lat: String(location.lat), lng: String(location.lng) },
    );
    setErrors(({ lat, lng, ...rest }) => rest);
  }, [location]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && !e.target.closest?.('dialog') && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onCancel]);

  const inputProps = (name) => ({
    id: `parcel-${name}`,
    name,
    value: values[name],
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `parcel-${name}-error` : undefined,
    disabled: saving,
    onChange: (e) => {
      const next = { ...values, [name]: e.target.value };
      setValues(next);
      if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);

      if (name === 'lat' || name === 'lng') {
        const lat = Number(next.lat);
        const lng = Number(next.lng);
        if (next.lat.trim() && next.lng.trim() && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          onLocationChange({ lat, lng });
        }
      }
    },
  });

  const focusFirstError = (errs) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.elements[first]?.focus();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const clientErrors = validate(values, limits);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      focusFirstError(clientErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      const fieldErrors = serverErrorsToFields(err.details);
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? 'Please fix the highlighted fields.' : err.message);
      focusFirstError(fieldErrors);
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} className="parcel-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      )}

      <Field name="title" label="Title" required error={errors.title}>
        <input {...inputProps('title')} type="text" maxLength={limits.titleMax} autoFocus placeholder="e.g. Plot 7, Sarjapur Road" />
      </Field>

      <div className="field-row">
        <Field name="landUse" label="Land use" required error={errors.landUse}>
          <select {...inputProps('landUse')}>
            <option value="">Choose…</option>
            {meta.landUses.map((v) => (
              <option key={v} value={v}>
                {formatLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field name="status" label="Status" error={errors.status}>
          <select {...inputProps('status')}>
            {meta.statuses.map((v) => (
              <option key={v} value={v}>
                {formatLabel(v)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="field-row">
        <Field name="ownerName" label="Owner" error={errors.ownerName}>
          <input {...inputProps('ownerName')} type="text" maxLength={limits.ownerNameMax} />
        </Field>
        <Field name="areaSqm" label="Area (m²)" error={errors.areaSqm}>
          <input {...inputProps('areaSqm')} type="number" min="0" step="any" inputMode="decimal" />
        </Field>
      </div>

      <div className="field-row">
        <Field name="lat" label="Latitude" required error={errors.lat}>
          <input {...inputProps('lat')} type="number" step="any" inputMode="decimal" />
        </Field>
        <Field name="lng" label="Longitude" required error={errors.lng}>
          <input {...inputProps('lng')} type="number" step="any" inputMode="decimal" />
        </Field>
      </div>
      <p className="field__hint field__hint--block">Click the map or drag the red pin to change the location.</p>

      <Field
        name="description"
        label="Description"
        error={errors.description}
        hint={`${values.description.length} / ${limits.descriptionMax}`}
      >
        <textarea {...inputProps('description')} rows={3} maxLength={limits.descriptionMax} />
      </Field>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
