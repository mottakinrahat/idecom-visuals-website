"use client";

import { useState } from "react";
import CategorySelect from "./CategorySelect";
import { EMPTY_FORM, submitInquiry, validateInquiry, type InquiryForm } from "@/lib/inquiries";

type Errors = Partial<Record<keyof InquiryForm, string>>;

const Field = ({ id, label, optional, error, hint, children }: { id: keyof InquiryForm; label: string; optional?: boolean; error?: string; hint?: string; children: React.ReactNode }) => (
  <div className={`cf-field ${error ? "has-err" : ""}`}>
    <label htmlFor={`cf-${id}`}>
      {label}
      {optional ? <small>optional</small> : <b aria-hidden="true">*</b>}
    </label>
    {children}
    {error ? <p className="cf-err" role="alert">{error}</p> : hint ? <p className="cf-hint">{hint}</p> : null}
  </div>
);

export default function ContactForm() {
  const [v, setV] = useState<InquiryForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: keyof InquiryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateInquiry(v);
    setErrors(found);
    if (Object.keys(found).length) {
      // jump to the first problem
      const first = Object.keys(found)[0];
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }
    setBusy(true);
    setServerError("");
    try {
      await submitInquiry(v);
      setSent(true);
      setV(EMPTY_FORM);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="cform cf-done" role="status">
        <span className="cf-tick" aria-hidden="true">✓</span>
        <h3>Thank you! We got your message.</h3>
        <p>Our team will call or message you within 24 hours.</p>
        <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={submit} noValidate>
      <div className="cf-head">
        <h3>Tell us about your project</h3>
        <p>Fill in the form and we&apos;ll get back to you. Takes about a minute.</p>
      </div>

      <div className="cf-grid">
        <Field id="name" label="Your name" error={errors.name}>
          <input id="cf-name" value={v.name} onChange={set("name")} placeholder="e.g. Rahim Uddin" autoComplete="name" aria-invalid={!!errors.name} />
        </Field>
        <Field id="phone" label="Phone number" error={errors.phone}>
          <input id="cf-phone" type="tel" value={v.phone} onChange={set("phone")} placeholder="01XXX XXXXXX" autoComplete="tel" aria-invalid={!!errors.phone} />
        </Field>

        <Field id="category" label="Your business field" error={errors.category}>
          <CategorySelect id="cf-category" value={v.category} onChange={(c) => { setV((p) => ({ ...p, category: c })); if (errors.category) setErrors((p) => ({ ...p, category: undefined })); }} invalid={!!errors.category} />
        </Field>
        <Field id="email" label="Email" optional error={errors.email}>
          <input id="cf-email" type="email" value={v.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" aria-invalid={!!errors.email} />
        </Field>

        <Field id="facebookUrl" label="Facebook page link" error={errors.facebookUrl} hint="So we can see your brand before we call.">
          <input id="cf-facebookUrl" value={v.facebookUrl} onChange={set("facebookUrl")} placeholder="facebook.com/yourpage" inputMode="url" aria-invalid={!!errors.facebookUrl} />
        </Field>
        <Field id="website" label="Website" optional error={errors.website}>
          <input id="cf-website" value={v.website} onChange={set("website")} placeholder="www.yourwebsite.com" inputMode="url" aria-invalid={!!errors.website} />
        </Field>

        <div className="cf-wide">
          <Field id="description" label="What do you need?" error={errors.description} hint="For example: product videos for my online clothing store, 10 reels a month.">
            <textarea id="cf-description" rows={4} value={v.description} onChange={set("description")} placeholder="Tell us about your business and what you'd like us to make." aria-invalid={!!errors.description} />
          </Field>
        </div>
      </div>

      {serverError && <p className="cf-server" role="alert">{serverError}</p>}

      <button type="submit" className="btn btn-lime cf-submit" disabled={busy}>
        {busy ? "Sending…" : <>Send message <span className="arr">→</span></>}
      </button>
      <p className="cf-fine">We only use your details to contact you about this project.</p>
    </form>
  );
}
