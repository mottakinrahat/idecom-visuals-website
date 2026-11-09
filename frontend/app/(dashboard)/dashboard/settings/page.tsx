"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  useStudioStore,
  SOCIAL_PLATFORMS,
  getActiveSocials,
  resolveSocialHref,
  DEFAULT_SITE_SETTINGS,
  type SocialPlatformKey,
} from "@/components/dashboard/store";
import { Logo, SocialIcon } from "@/components/home/Shapes";
import { Upload, Trash2, RotateCcw, Check } from "@/components/dashboard/icons";
import { Button, Toaster, useToast } from "@/components/ui";
import { api, assetUrl } from "@/lib/api";

export default function SettingsPage() {
  return (
    <Toaster>
      <SettingsView />
    </Toaster>
  );
}

function SettingsView() {
  const { content, updateContent } = useStudioStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const settings = content.settings ?? DEFAULT_SITE_SETTINGS;
  const activeSocials = getActiveSocials(content);
  const waHref = resolveSocialHref("whatsapp", settings.socialLinks?.whatsapp);

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, SVG, JPG, WebP).");
      return;
    }
    setUploadingLogo(true);
    try {
      const { url: uploadedUrl } = await api.uploadImage(file);
      updateContent((prev) => ({
        ...prev,
        settings: {
          ...(prev.settings ?? DEFAULT_SITE_SETTINGS),
          logoUrl: uploadedUrl,
        },
      }));
      toast.success("Website logo updated");
    } catch {
      // Fallback to Data URL so logo upload works even if backend is offline
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (dataUrl) {
          updateContent((prev) => ({
            ...prev,
            settings: {
              ...(prev.settings ?? DEFAULT_SITE_SETTINGS),
              logoUrl: dataUrl,
            },
          }));
          toast.success("Website logo updated");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
    }
  };

  const setLogoUrl = (logoUrl: string) => {
    updateContent((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings ?? DEFAULT_SITE_SETTINGS),
        logoUrl,
      },
    }));
  };

  const setShowWordmark = (showWordmarkWithLogo: boolean) => {
    updateContent((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings ?? DEFAULT_SITE_SETTINGS),
        showWordmarkWithLogo,
      },
    }));
  };

  const setSocialLink = (key: SocialPlatformKey, value: string) => {
    updateContent((prev) => {
      const nextSettings = {
        ...(prev.settings ?? DEFAULT_SITE_SETTINGS),
        socialLinks: {
          ...(prev.settings?.socialLinks ?? DEFAULT_SITE_SETTINGS.socialLinks),
          [key]: value,
        },
      };
      const nextContact = { ...prev.contact };
      if (key === "whatsapp") {
        const digits = value.replace(/\D/g, "");
        nextContact.whatsappNumber = digits || value.trim();
      }
      return {
        ...prev,
        settings: nextSettings,
        contact: nextContact,
      };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--d-fg)]">Settings</h1>
          <p className="text-[13px] text-[var(--d-muted)] mt-0.5">
            Configure your website logo and social media links. Only social platforms with a link provided will appear on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/#contact"
            target="_blank"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[var(--d-line)] bg-[var(--d-card)] text-[13px] font-medium text-[var(--d-fg)] hover:border-[var(--d-accent)] transition-colors"
          >
            Preview Homepage ↗
          </Link>
          <Button
            variant="primary"
            onClick={() => toast.success("All settings saved and live on homepage")}
          >
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Website Logo */}
        <div className="lg:col-span-5 flex flex-col gap-5 p-6 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                Brand Identity
              </span>
              <h2 className="text-[16px] font-semibold text-[var(--d-fg)] mt-0.5">
                Website Logo
              </h2>
              <p className="text-[12.5px] text-[var(--d-muted)] mt-0.5">
                Displayed in the homepage navigation bar, footer, and dashboard sidebar.
              </p>
            </div>
            {settings.logoUrl && (
              <button
                type="button"
                onClick={() => {
                  setLogoUrl("");
                  toast.success("Reverted to default IDeCom SVG logo");
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--d-card2)] hover:bg-red-500/15 text-[12px] text-[var(--d-muted)] hover:text-red-500 transition-colors cursor-pointer"
                title="Reset to default logo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
            )}
          </div>

          {/* Live Navbar Preview (Dark Homepage Theme) */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--d-muted)]">
              Live Homepage Header Preview
            </span>
            <div
              className="rounded-xl p-4 border border-[#272C20] flex items-center justify-between"
              style={{
                background: "#121410",
                color: "#F1F4EA",
                "--fg": "#F1F4EA",
                "--muted": "#9AA18E",
                "--lime": "#9CF60A",
              } as React.CSSProperties}
            >
              <Logo />
              <span
                className="text-[11px] font-mono px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(156,246,10,0.12)",
                  color: "#9CF60A",
                  border: "1px solid rgba(156,246,10,0.25)",
                }}
              >
                {settings.logoUrl ? "Custom Logo" : "Default SVG"}
              </span>
            </div>
          </div>

          {/* Upload Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleLogoFile(file);
            }}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-[var(--d-line)] hover:border-[var(--d-accent)] bg-[var(--d-card2)]/60 p-5 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoFile(file);
                e.target.value = "";
              }}
            />
            {settings.logoUrl ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetUrl(settings.logoUrl)}
                  alt="Uploaded logo"
                  className="max-h-14 w-auto object-contain rounded"
                />
                <span className="text-[12px] text-[var(--d-accent)] font-medium">
                  {uploadingLogo ? "Uploading..." : "Click or drop another image to replace"}
                </span>
              </div>
            ) : (
              <>
                <span className="w-10 h-10 rounded-full bg-[var(--d-tint)] text-[var(--d-accent)] grid place-items-center">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-[var(--d-fg)]">
                    {uploadingLogo ? "Uploading logo..." : "Click to upload logo or drag & drop"}
                  </p>
                  <p className="text-[11.5px] text-[var(--d-muted)] mt-0.5">
                    PNG, SVG, WebP or JPG (transparent background recommended)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Or Paste Logo URL */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--d-fg)] mb-1.5">
              Or paste Logo Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.logoUrl?.startsWith("data:") ? "" : settings.logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder={
                  settings.logoUrl?.startsWith("data:")
                    ? "Uploaded local image active — paste URL to override"
                    : "https://.../logo.png"
                }
                className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-[13px] text-[var(--d-fg)] placeholder:text-[var(--d-muted)]"
              />
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="px-3 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-[var(--d-muted)] hover:text-red-500 hover:border-red-500/40 cursor-pointer"
                  title="Remove custom logo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Toggle Wordmark with Custom Logo */}
          {settings.logoUrl && (
            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] cursor-pointer">
              <div>
                <div className="text-[13px] font-medium text-[var(--d-fg)]">
                  Show &ldquo;IDeCom VISUALS&rdquo; text beside logo
                </div>
                <div className="text-[11.5px] text-[var(--d-muted)]">
                  Enable if your uploaded image is an icon mark without text
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.showWordmarkWithLogo)}
                onChange={(e) => setShowWordmark(e.target.checked)}
                className="w-4 h-4 accent-[var(--d-accent)] cursor-pointer"
              />
            </label>
          )}
        </div>

        {/* RIGHT COLUMN: Social & Messaging Links */}
        <div className="lg:col-span-7 flex flex-col gap-5 p-6 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                Conditional Social Icons
              </span>
              <h2 className="text-[16px] font-semibold text-[var(--d-fg)] mt-0.5">
                Social & Messaging Links
              </h2>
              <p className="text-[12.5px] text-[var(--d-muted)] mt-0.5">
                Only platforms with a link or number entered below will display their icon on the homepage. Leave a field blank to hide its icon.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[var(--d-tint)] text-[var(--d-accent)]">
              {activeSocials.length} {activeSocials.length === 1 ? "icon" : "icons"} active on homepage
            </span>
          </div>

          {/* Live Preview of Homepage Social Icons */}
          <div className="rounded-xl p-4 border border-[#272C20] bg-[#121410] text-[#F1F4EA] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9AA18E]">
                Live Homepage Social Icons Preview
              </span>
              <span className="text-[11px] font-mono text-[#9CF60A]">
                {activeSocials.length > 0
                  ? activeSocials.map((s) => s.label).join(" · ")
                  : "No icons visible (all links empty)"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold"
                  style={{ background: "#9CF60A", color: "#0A0B08" }}
                >
                  <SocialIcon name="whatsapp" size={16} />
                  Direct chat on WhatsApp
                </a>
              )}

              {activeSocials.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {activeSocials.map((s) => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${s.label}: ${s.href}`}
                      className="w-10 h-10 rounded-full border border-[#272C20] hover:border-[#9CF60A] text-[#F1F4EA] hover:text-[#9CF60A] grid place-items-center transition-colors"
                    >
                      <SocialIcon name={s.key} size={18} />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-[#9AA18E] italic">
                  Add a link below (e.g. Facebook or WhatsApp) to display its icon on the homepage.
                </p>
              )}
            </div>
          </div>

          {/* Platform Inputs */}
          <div className="flex flex-col gap-3.5">
            {SOCIAL_PLATFORMS.map((platform) => {
              const rawValue = settings.socialLinks?.[platform.key] ?? "";
              const resolvedHref = resolveSocialHref(platform.key, rawValue);
              const isVisible = Boolean(resolvedHref);

              return (
                <div
                  key={platform.key}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isVisible
                      ? "bg-[var(--d-card2)]/70 border-[var(--d-accent)]/40"
                      : "bg-[var(--d-card2)]/30 border-[var(--d-line)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-8 h-8 rounded-lg grid place-items-center transition-colors ${
                          isVisible
                            ? "bg-[var(--d-primary)] text-[#0A0B08]"
                            : "bg-[var(--d-card)] text-[var(--d-muted)] border border-[var(--d-line)]"
                        }`}
                      >
                        <SocialIcon name={platform.key} size={17} />
                      </span>
                      <div>
                        <span className="text-[13.5px] font-semibold text-[var(--d-fg)]">
                          {platform.label}
                        </span>
                        <span className="block text-[11px] text-[var(--d-muted)]">
                          {platform.hint}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          isVisible
                            ? "bg-[var(--d-tint)] text-[var(--d-accent)]"
                            : "bg-[var(--d-card)] text-[var(--d-muted)] border border-[var(--d-line)]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVisible ? "bg-[var(--d-accent)]" : "bg-[var(--d-muted)]/50"
                          }`}
                        />
                        {isVisible ? "Displayed on Home" : "Hidden"}
                      </span>

                      {rawValue && (
                        <button
                          type="button"
                          onClick={() => setSocialLink(platform.key, "")}
                          className="p-1.5 rounded-lg text-[var(--d-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title={`Clear ${platform.label} link`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={rawValue}
                    onChange={(e) => setSocialLink(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full h-10 px-3.5 rounded-lg bg-[var(--d-card)] border border-[var(--d-line)] text-[13px] text-[var(--d-fg)] placeholder:text-[var(--d-muted)]/60"
                  />

                  {isVisible && (
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--d-accent)]">
                      <span className="truncate">Links to: {resolvedHref}</span>
                      <a
                        href={resolvedHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 underline hover:opacity-80"
                      >
                        Test link ↗
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
