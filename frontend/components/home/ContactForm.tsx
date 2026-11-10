"use client";

import { useEffect, useRef, useState } from "react";
import CategorySelect from "./CategorySelect";
import {
  EMPTY_FORM,
  normalizeBangladeshPhone,
  submitInquiry,
  validateInquiry,
  validateInquiryField,
  verifyFacebookLinkOnline,
  type InquiryForm,
} from "@/lib/inquiries";

type Errors = Partial<Record<keyof InquiryForm, string>>;

type FbVerifyState =
  | { status: "idle" }
  | { status: "checking"; url: string }
  | { status: "verified"; url: string; pageName?: string }
  | { status: "invalid"; url: string; message: string };

const Field = ({
  id,
  label,
  optional,
  error,
  statusMsg,
  statusKind,
  hint,
  children,
}: {
  id: keyof InquiryForm;
  label: string;
  optional?: boolean;
  error?: string;
  statusMsg?: string;
  statusKind?: "checking" | "ok";
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className={`cf-field ${error ? "has-err" : statusKind === "ok" ? "is-valid" : ""}`}>
    <label htmlFor={`cf-${id}`}>
      {label}
      {optional ? <small>optional</small> : <b aria-hidden="true">*</b>}
    </label>
    {children}
    {error ? (
      <p className="cf-err" role="alert">{error}</p>
    ) : statusMsg ? (
      <p className={statusKind === "ok" ? "cf-ok" : "cf-checking"} role="status">{statusMsg}</p>
    ) : hint ? (
      <p className="cf-hint">{hint}</p>
    ) : null}
  </div>
);

export default function ContactForm() {
  const [v, setV] = useState<InquiryForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [fbState, setFbState] = useState<FbVerifyState>({ status: "idle" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const fbAbortRef = useRef<AbortController | null>(null);

  const runFbVerify = async (rawUrl: string): Promise<boolean> => {
    const trimmed = rawUrl.trim();
    const formatErr = validateInquiryField("facebookUrl", trimmed);
    if (formatErr) {
      setFbState({ status: "idle" });
      setErrors((p) => ({ ...p, facebookUrl: formatErr }));
      return false;
    }

    if (fbState.status === "verified" && fbState.url === trimmed) {
      return true;
    }

    fbAbortRef.current?.abort();
    const ctrl = new AbortController();
    fbAbortRef.current = ctrl;
    setFbState({ status: "checking", url: trimmed });

    try {
      const res = await verifyFacebookLinkOnline(trimmed, ctrl.signal);
      if (ctrl.signal.aborted) return false;
      if (res.valid) {
        setFbState({ status: "verified", url: trimmed, pageName: res.pageName });
        setErrors((p) => ({ ...p, facebookUrl: undefined }));
        return true;
      } else {
        const msg = res.message || "This Facebook page could not be verified. Please check the link.";
        setFbState({ status: "invalid", url: trimmed, message: msg });
        setErrors((p) => ({ ...p, facebookUrl: msg }));
        return false;
      }
    } catch {
      return false;
    }
  };

  // Debounced live verification for Facebook page link once format is valid
  useEffect(() => {
    const trimmed = v.facebookUrl.trim();
    if (!trimmed || validateInquiryField("facebookUrl", trimmed)) {
      fbAbortRef.current?.abort();
      setFbState({ status: "idle" });
      return;
    }
    const timer = setTimeout(() => {
      void runFbVerify(trimmed);
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.facebookUrl]);

  const set = (k: keyof InquiryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setV((p) => ({ ...p, [k]: nextVal }));
    const isOptionalEmpty = (k === "email" || k === "website") && !nextVal.trim();
    if (isOptionalEmpty) {
      setErrors((p) => ({ ...p, [k]: undefined }));
    } else {
      const fieldErr = validateInquiryField(k, nextVal);
      setErrors((p) => ({ ...p, [k]: fieldErr }));
    }
  };

  const blur = (k: keyof InquiryForm) => () => {
    const fieldErr = validateInquiryField(k, v[k]);
    setErrors((p) => ({ ...p, [k]: fieldErr }));
    if (k === "facebookUrl" && !fieldErr && v.facebookUrl.trim()) {
      void runFbVerify(v.facebookUrl);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateInquiry(v);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }

    setBusy(true);
    setServerError("");
    try {
      const fbOk = await runFbVerify(v.facebookUrl);
      if (!fbOk) {
        document.getElementById("cf-facebookUrl")?.focus();
        setBusy(false);
        return;
      }
      await submitInquiry(v);
      setSent(true);
      setV(EMPTY_FORM);
      setErrors({});
      setFbState({ status: "idle" });
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

  const fbStatusMsg =
    fbState.status === "checking"
      ? "Verifying Facebook page link…"
      : fbState.status === "verified"
      ? fbState.pageName
        ? `✓ Verified Facebook page: ${fbState.pageName}`
        : "✓ Facebook page link verified"
      : undefined;

  return (
    <form className="cform" onSubmit={submit} noValidate>
      <div className="cf-head">
        <h3>Tell us about your project</h3>
        <p>Fill in the form and we&apos;ll get back to you. Takes about a minute.</p>
      </div>

      <div className="cf-grid">
        <Field id="name" label="Your name" error={errors.name}>
          <input
            id="cf-name"
            value={v.name}
            onChange={set("name")}
            onBlur={blur("name")}
            placeholder="e.g. Rahim Uddin"
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field
          id="phone"
          label="Phone number"
          error={errors.phone}
          statusKind={!errors.phone && normalizeBangladeshPhone(v.phone).length === 11 && /^01[3-9]\d{8}$/.test(normalizeBangladeshPhone(v.phone)) ? "ok" : undefined}
          statusMsg={!errors.phone && normalizeBangladeshPhone(v.phone).length === 11 && /^01[3-9]\d{8}$/.test(normalizeBangladeshPhone(v.phone)) ? "✓ Valid" : undefined}
        >
          <input
            id="cf-phone"
            type="tel"
            inputMode="tel"
            value={v.phone}
            onChange={set("phone")}
            onBlur={blur("phone")}
            placeholder="+8801XXXXXXXXX"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
          />
        </Field>

        <Field id="category" label="Your business field" error={errors.category}>
          <CategorySelect
            id="cf-category"
            value={v.category}
            onChange={(c) => {
              setV((p) => ({ ...p, category: c }));
              setErrors((p) => ({ ...p, category: validateInquiryField("category", c) }));
            }}
            onBlur={blur("category")}
            invalid={!!errors.category}
          />
        </Field>
        <Field id="email" label="Email" optional error={errors.email}>
          <input
            id="cf-email"
            type="email"
            value={v.email}
            onChange={set("email")}
            onBlur={blur("email")}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
        </Field>

        <Field
          id="facebookUrl"
          label="Facebook page link"
          error={errors.facebookUrl}
          statusMsg={fbStatusMsg}
          statusKind={fbState.status === "verified" ? "ok" : fbState.status === "checking" ? "checking" : undefined}
          hint="So we can see your brand before we call."
        >
          <input
            id="cf-facebookUrl"
            value={v.facebookUrl}
            onChange={set("facebookUrl")}
            onBlur={blur("facebookUrl")}
            placeholder="facebook.com/yourpage"
            inputMode="url"
            aria-invalid={!!errors.facebookUrl}
          />
        </Field>
        <Field id="website" label="Website" optional error={errors.website}>
          <input
            id="cf-website"
            value={v.website}
            onChange={set("website")}
            onBlur={blur("website")}
            placeholder="www.yourwebsite.com"
            inputMode="url"
            aria-invalid={!!errors.website}
          />
        </Field>

        <div className="cf-wide">
          <Field id="description" label="What do you need?" optional error={errors.description} hint="For example: product videos for my online clothing store, 10 reels a month.">
            <textarea
              id="cf-description"
              rows={4}
              value={v.description}
              onChange={set("description")}
              onBlur={blur("description")}
              placeholder="Tell us about your business and what you'd like us to make."
              aria-invalid={!!errors.description}
            />
          </Field>
        </div>
      </div>

      {serverError && <p className="cf-server" role="alert">{serverError}</p>}

      <button type="submit" className="btn btn-lime cf-submit" disabled={busy || fbState.status === "checking"}>
        {busy ? "Sending…" : fbState.status === "checking" ? "Verifying link…" : <>Send message <span className="arr">→</span></>}
      </button>
      <p className="cf-fine">We only use your details to contact you about this project.</p>
    </form>
  );
}
