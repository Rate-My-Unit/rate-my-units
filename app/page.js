"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldCheck, MapPin, Smile, Building2, Wifi, Star, Stethoscope, PartyPopper,
  UtensilsCrossed, Users, Briefcase, Heart, DollarSign, ThumbsUp, ThumbsDown,
  Search, Plus, ArrowLeft, ArrowLeftRight, Menu, X, Lock,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;
const ADMIN_USER_ID = "2d793bf4-08af-4382-b074-47c5ef968611";

const UNIT_CATEGORIES = [
  { key: "ratios", label: "Staffing ratios", icon: Users },
  { key: "management", label: "Management", icon: Briefcase },
  { key: "culture", label: "Culture", icon: Heart },
  { key: "pay", label: "Pay", icon: DollarSign },
];
const HOSPITAL_CATEGORIES = [
  { key: "safety", label: "Safety", icon: ShieldCheck },
  { key: "location", label: "Location", icon: MapPin },
  { key: "happiness", label: "Happiness", icon: Smile },
  { key: "facilities", label: "Facilities", icon: Building2 },
  { key: "internet", label: "Internet", icon: Wifi },
  { key: "reputation", label: "Reputation", icon: Star },
  { key: "respiratory", label: "Respiratory Dept.", icon: Stethoscope },
  { key: "social", label: "Social", icon: PartyPopper },
  { key: "food", label: "Food", icon: UtensilsCrossed },
];

function avg(reviews, key) {
  if (!reviews || !reviews.length) return 0;
  return reviews.reduce((s, r) => s + (r[key] || 0), 0) / reviews.length;
}
function overallAvg(reviews, categories) {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + categories.reduce((cs, c) => cs + (r[c.key] || 0), 0) / categories.length, 0);
  return sum / reviews.length;
}
function helpfulScore(r) {
  return (r.helpful_up || 0) - (r.helpful_down || 0);
}
function scoreBg(score) {
  if (!score) return "#DDE3DC";
  if (score >= 3.8) return "#A9F0CE";
  if (score >= 3.0) return "#FCE985";
  return "#F8AFAF";
}
function scoreTextColor(score) {
  if (!score) return "#5B6B63";
  if (score >= 3.8) return "#0F5132";
  if (score >= 3.0) return "#7A5B00";
  return "#7A1313";
}

const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "piss", "cock",
  "whore", "slut", "faggot", "retard", "nigger", "nigga", "twat", "wanker",
  "motherfucker", "dumbass", "jackass", "douchebag", "prick", "pussy",
];
function containsProfanity(text) {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
}

const inputStyle = { borderColor: "#D7E6F3", fontFamily: "'Inter'", color: "#16324A" };

function ScorePill({ score, size = "md", width }) {
  const dims = size === "lg" ? { px: "18px", py: "10px", font: "1.6rem", minWidth: "84px" } : size === "sm" ? { px: "8px", py: "3px", font: "0.8rem", minWidth: undefined } : { px: "12px", py: "6px", font: "1.05rem", minWidth: "68px" };
  return (
    <span className="inline-flex items-center justify-center rounded-xl font-extrabold" style={{ background: scoreBg(score), color: scoreTextColor(score), padding: `${dims.py} ${dims.px}`, fontFamily: "'Poppins'", fontSize: dims.font, minWidth: dims.minWidth, width: width, boxSizing: "border-box" }}>
      {score ? score.toFixed(1) : "—"}
    </span>
  );
}
function Stars({ value, onChange, size = 20 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={onChange ? () => onChange(n) : undefined} style={{ lineHeight: 0 }} aria-label={`${n} of 5`}>
          <Star size={size} fill={n <= value ? "#3E8EDE" : "none"} stroke="#3E8EDE" strokeWidth={1.6} />
        </button>
      ))}
    </div>
  );
}
function VitalsPanel({ reviews, categories }) {
  const score = overallAvg(reviews, categories);
  return (
    <div className="rounded-2xl p-5 flex items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, #EAF3FB, #DCEBFA)", border: "1px solid #D7E6F3" }}>
      <div>
        <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ fontFamily: "'Inter'", color: "#64809A" }}>
          Overall quality · {reviews.length} report{reviews.length === 1 ? "" : "s"}
        </div>
        <div className="mt-2"><ScorePill score={score} size="lg" /></div>
      </div>
    </div>
  );
}
function CategoryList({ reviews, categories }) {
  return (
    <div className="rounded-2xl overflow-hidden mt-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      {categories.map((c, i) => {
        const v = avg(reviews, c.key);
        const Icon = c.icon;
        return (
          <div key={c.key} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid #EEF4FA" }}>
            <div className="flex items-center gap-3">
              <div className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: "#EAF3FB" }}>
                <Icon size={17} color="#3E8EDE" strokeWidth={2} />
              </div>
              <span style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: "14.5px", color: "#16324A" }}>{c.label}</span>
            </div>
            <ScorePill score={v} size="sm" />
          </div>
        );
      })}
    </div>
  );
}
function HelpfulVote({ review, userVote, onVote }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <span style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#64809A" }}>Helpful?</span>
      <button onClick={() => onVote(review.id, "up")} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ color: userVote === "up" ? "#0F5132" : "#64809A", background: userVote === "up" ? "#A9F0CE" : "#F1F6FB" }}>
        <ThumbsUp size={13} strokeWidth={2.2} /><span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "12px" }}>{review.helpful_up || 0}</span>
      </button>
      <button onClick={() => onVote(review.id, "down")} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ color: userVote === "down" ? "#7A1313" : "#64809A", background: userVote === "down" ? "#F8AFAF" : "#F1F6FB" }}>
        <ThumbsDown size={13} strokeWidth={2.2} /><span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "12px" }}>{review.helpful_down || 0}</span>
      </button>
    </div>
  );
}
function ReviewCard({ review, categories, userVote, onVote, currentUserId, onDelete, onReport }) {
  const [confirming, setConfirming] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportReason, setReportReason] = useState("Names a coworker or patient");
  const isMine = currentUserId && review.user_id === currentUserId;

  function submitReport() {
    onReport(review.id, reportReason);
    setReporting(false);
    setReportSent(true);
  }

  return (
    <div className="py-4" style={{ borderTop: "1px solid #EEF4FA" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A", fontSize: "0.95rem" }}>{review.role}</span>
          {review.verified && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'", fontWeight: 700, fontSize: "10.5px" }}>
              <ShieldCheck size={11} /> Verified
            </span>
          )}
        </div>
        <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{(review.created_at || "").slice(0, 10)}</div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {categories.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: scoreBg(review[c.key]), color: scoreTextColor(review[c.key]), fontFamily: "'Inter'", fontWeight: 700, fontSize: "11px" }}>
            {c.label} {review[c.key]}
          </span>
        ))}
      </div>
      <p style={{ fontFamily: "'Inter'", fontSize: "14.5px", lineHeight: 1.6, color: "#33475A" }}>{review.comment}</p>
      <div className="flex items-center justify-between">
        <HelpfulVote review={review} userVote={userVote} onVote={onVote} />
        {isMine && !confirming && (
          <button onClick={() => setConfirming(true)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Delete</button>
        )}
        {isMine && confirming && (
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#7A1313" }}>Delete this report?</span>
            <button onClick={() => onDelete(review.id)} className="text-[12px] font-bold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Yes</button>
            <button onClick={() => setConfirming(false)} className="text-[12px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
          </div>
        )}
        {!isMine && onReport && (reportSent ? (
          <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>Reported</span>
        ) : !reporting ? (
          <button onClick={() => setReporting(true)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Report</button>
        ) : null)}
      </div>
      {!isMine && reporting && !reportSent && (
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="border rounded-full px-2 py-1 text-[12px]" style={{ borderColor: "#D7E6F3", fontFamily: "'Inter'", color: "#16324A", background: "#FFFFFF" }}>
            <option>Names a coworker or patient</option>
            <option>Profanity or harassment</option>
            <option>False information</option>
            <option>Other</option>
          </select>
          <button onClick={submitReport} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Send</button>
          <button onClick={() => setReporting(false)} className="text-[12px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
function ReviewSortControl({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-full px-3 py-1.5 text-[12.5px]" style={{ borderColor: "#D7E6F3", fontFamily: "'Inter'", fontWeight: 500, color: "#16324A", background: "#FFFFFF" }}>
      <option value="newest">Newest</option>
      <option value="helpful">Most helpful</option>
    </select>
  );
}
function TextInput(props) {
  return <input {...props} className={`w-full border rounded-xl px-3.5 py-2.5 text-sm ${props.className || ""}`} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function PrimaryButton({ children, onClick, color = "#3E8EDE" }) {
  return <button onClick={onClick} className="px-4 py-2.5 rounded-xl text-sm text-white font-semibold" style={{ background: color, fontFamily: "'Inter'" }}>{children}</button>;
}
function GhostButton({ children, onClick }) {
  return <button onClick={onClick} className="px-4 py-2.5 rounded-xl text-sm" style={{ fontFamily: "'Inter'", fontWeight: 500, color: "#64809A" }}>{children}</button>;
}
function CompareButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold" style={{ border: "2px solid #3E8EDE", color: "#3E8EDE", background: "#FFFFFF", fontFamily: "'Inter'" }}>
      <ArrowLeftRight size={15} /> {label}
    </button>
  );
}

// ---------- Auth bar (email magic-link sign in) ----------
function AuthBar({ user, onOpenSignIn, onSignOut }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="hidden sm:inline">{user.email}</span>
        <button onClick={onSignOut} className="text-[12.5px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Sign out</button>
      </div>
    );
  }
  return (
    <button onClick={onOpenSignIn} className="px-3.5 py-2 rounded-full text-[13px] font-semibold" style={{ border: "2px solid #3E8EDE", color: "#3E8EDE", background: "#FFFFFF", fontFamily: "'Inter'" }}>
      Sign in
    </button>
  );
}

function AuthPanel({ onClose }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [screen, setScreen] = useState("auth"); // "auth" | "forgot" | "forgotSent"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [resendMsg, setResendMsg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (screen !== "auth" || checkEmail) return;
    let cancelled = false;
    function renderWidget() {
      if (cancelled || !turnstileRef.current || !window.turnstile) return;
      if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
      try {
        if (widgetIdRef.current) {
          try { window.turnstile.remove(widgetIdRef.current); } catch (e) {}
        }
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
        });
      } catch (e) {
        // If the widget can't render for any reason, fail quietly rather than crashing the panel.
      }
    }
    if (window.turnstile) {
      renderWidget();
    } else {
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check);
          renderWidget();
        }
      }, 300);
      return () => { cancelled = true; clearInterval(check); };
    }
    return () => { cancelled = true; };
  }, [screen, checkEmail, mode]);

  useEffect(() => {
    if (!checkEmail) return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [checkEmail]);

  async function handleForgotSubmit() {
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    setSubmitting(false);
    if (err) setError(err.message);
    else setScreen("forgotSent");
  }

  async function handleSubmit() {
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!captchaToken) { setError("Please complete the verification check above."); return; }
    setError("");
    setSubmitting(true);
    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password, options: { captchaToken } });
      if (err) setError(err.message);
      else setCheckEmail(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      if (err) setError(err.message);
      else onClose();
    }
    setSubmitting(false);
  }

  async function handleResend() {
    setResendMsg("");
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    if (err) setResendMsg(err.message);
    else setResendMsg("Sent again — check your email.");
    setCountdown(30);
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      <div className="absolute inset-0" style={{ background: "rgba(22,50,74,0.35)" }} onClick={checkEmail || screen === "forgotSent" ? undefined : onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl p-5" style={{ background: "#FFFFFF" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>
            {screen === "forgot" || screen === "forgotSent" ? "Reset password" : mode === "signup" ? "Create account" : "Sign in"}
          </span>
          {!checkEmail && screen !== "forgotSent" && <button onClick={onClose}><X size={18} color="#64809A" /></button>}
        </div>

        {screen === "forgot" && (
          <div className="space-y-3">
            <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }}>Enter the email you signed up with — we'll send a link to reset your password.</p>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
            <div className="flex gap-2">
              <PrimaryButton onClick={handleForgotSubmit}>{submitting ? "Sending…" : "Send reset link"}</PrimaryButton>
              <GhostButton onClick={() => { setScreen("auth"); setError(""); }}>Back</GhostButton>
            </div>
          </div>
        )}

        {screen === "forgotSent" && (
          <div>
            <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-4">
              Check your email — we sent a link to {email} to reset your password.
            </p>
            <PrimaryButton onClick={onClose}>OK</PrimaryButton>
          </div>
        )}

        {screen === "auth" && (checkEmail ? (
          <div>
            <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-4">
              Almost there — we sent a confirmation link to {email}. Click it, then come back and sign in with your new password.
            </p>
            {countdown > 0 ? (
              <p style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#64809A" }} className="mb-3">Didn't get it? You can resend in {countdown}s.</p>
            ) : (
              <button onClick={handleResend} className="text-[13px] font-semibold mb-3 block" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Send another verification email</button>
            )}
            {resendMsg && <p style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#0F5132" }} className="mb-3">{resendMsg}</p>}
            <PrimaryButton onClick={onClose}>OK</PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex rounded-full p-1" style={{ background: "#EAF3FB" }}>
              <button onClick={() => { setMode("signin"); setError(""); }} className="flex-1 py-1.5 rounded-full text-[13px] font-semibold" style={{ fontFamily: "'Inter'", background: mode === "signin" ? "#FFFFFF" : "transparent", color: "#16324A" }}>Sign in</button>
              <button onClick={() => { setMode("signup"); setError(""); }} className="flex-1 py-1.5 rounded-full text-[13px] font-semibold" style={{ fontFamily: "'Inter'", background: mode === "signup" ? "#FFFFFF" : "transparent", color: "#16324A" }}>Create account</button>
            </div>
            <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>Your email is never shown publicly.</p>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" />
            {mode === "signin" && (
              <button onClick={() => { setScreen("forgot"); setError(""); }} className="text-[12.5px] font-semibold block" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Forgot password?</button>
            )}
            <div ref={turnstileRef} />
            {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
            <PrimaryButton onClick={handleSubmit}>{submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</PrimaryButton>
            {mode === "signup" && (
              <p style={{ fontFamily: "'Inter'", fontSize: "11px", color: "#93A7B8" }} className="text-center pt-1">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


function SignInPrompt({ onOpenSignIn }) {
  return (
    <div className="rounded-2xl p-5 mt-4 text-center" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-3">You'll need to sign in first — it just takes an email link.</p>
      <PrimaryButton onClick={onOpenSignIn}>Sign in</PrimaryButton>
    </div>
  );
}

function VerificationSubmittedModal({ onClose }) {
  return (
    <div className="fixed inset-0" style={{ zIndex: 70 }}>
      <div className="absolute inset-0" style={{ background: "rgba(22,50,74,0.45)" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl p-5" style={{ background: "#FFFFFF" }}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={20} color="#0F9D6A" />
          <span style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>Verification received!</span>
        </div>
        <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A", lineHeight: 1.6 }} className="mb-4">
          Our team is currently reviewing your information to make sure everything looks good on our end. This process usually takes a few business days. In the meantime, feel free to post! We will automatically update your account and post with a verified symbol for the specific hospital once you're approved!
        </p>
        <PrimaryButton onClick={onClose} color="#0F9D6A">OK</PrimaryButton>
      </div>
    </div>
  );
}

function HospitalVerifyPanel({ user, hospitalId, hospitalName, unitName, unitType, onOpenSignIn, embedded, submitLabel = "Submit proof" }) {
  const [status, setStatus] = useState("loading"); // "loading" | "none" | "pending" | "verified"
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showSubmitted, setShowSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !hospitalId) { setStatus("none"); return; }
    let cancelled = false;
    supabase.from("hospital_verifications").select("status").eq("user_id", user.id).eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => { if (!cancelled) setStatus(data && data[0] ? data[0].status : "none"); });
    return () => { cancelled = true; };
  }, [user, hospitalId]);

  async function handleUpload() {
    if (!hospitalId) { setError("Search for and select your hospital above first."); return; }
    if (!file) { setError("Attach a file before submitting."); return; }
    setError("");
    setUploading(true);
    const path = `${user.id}/${hospitalId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("verification-proof").upload(path, file);
    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setUploading(false);
      return;
    }
    const { error: insErr } = await supabase.from("hospital_verifications").insert({
      user_id: user.id,
      hospital_id: hospitalId,
      file_path: path,
      unit_name: unitName || null,
      unit_type: unitType || null,
    });
    setUploading(false);
    if (insErr) { setError(`Something went wrong saving your request: ${insErr.message}`); return; }
    setStatus("pending");
    setShowSubmitted(true);
  }

  if (!user) return <SignInPrompt onOpenSignIn={onOpenSignIn} />;
  if (status === "loading") return null;

  return (
    <div className={embedded ? "" : "rounded-2xl p-5"} style={embedded ? {} : { border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      {showSubmitted && <VerificationSubmittedModal onClose={() => setShowSubmitted(false)} />}
      {status === "verified" && (
        <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#0F5132", fontWeight: 600 }} className="flex items-center gap-1.5">
          <ShieldCheck size={16} /> You're Verified for {hospitalName} — every report you post here shows the badge.
        </p>
      )}
      {status === "pending" && (
        <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#7A5B00", fontWeight: 600 }}>Your verification for {hospitalName} is submitted and pending review.</p>
      )}
      {status === "none" && (
        <div>
          <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-3">
            Upload something showing you worked at {hospitalName}! A badge photo, pay stub, or assignment letter. It's reviewed privately and never shown publicly.
          </p>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm mb-3" style={{ fontFamily: "'Inter'", color: "#33475A" }} />
          {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }} className="mb-2">{error}</p>}
          <PrimaryButton onClick={handleUpload} color="#0F9D6A">{uploading ? "Uploading…" : submitLabel}</PrimaryButton>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ categories, reviewType, hospitalId, hospitalName, onSubmit, onCancel, onDone, rolePlaceholder, user, onOpenSignIn }) {
  const [role, setRole] = useState("");
  const [ratings, setRatings] = useState(Object.fromEntries(categories.map((c) => [c.key, 0])));
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "verify"

  if (!user) return <SignInPrompt onOpenSignIn={onOpenSignIn} />;

  async function handleSubmit() {
    if (!role.trim() || !comment.trim() || Object.values(ratings).some((v) => v === 0)) {
      setError("Fill in your role, every rating, and a comment before submitting.");
      return;
    }
    if (containsProfanity(comment) || containsProfanity(role)) {
      setError("Please keep it respectful — remove any profanity before posting.");
      return;
    }
    setSubmitting(true);
    const result = await onSubmit({ role: role.trim(), comment: comment.trim(), ...ratings });
    setSubmitting(false);
    if (result?.id) {
      setStep("verify");
    } else if (result?.error?.code === "23505") {
      setError("You've already posted a report here — each account can only post once per hospital or unit.");
    } else {
      setError("Your report couldn't be posted. You may have hit today's 5-report limit, or something else blocked it. If this keeps happening, contact support@ratemyunit.org.");
    }
  }

  if (step === "verify") {
    return (
      <div className="rounded-2xl p-5 mt-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
        <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>✓ Report posted</div>
        <HospitalVerifyPanel user={user} hospitalId={hospitalId} hospitalName={hospitalName} onOpenSignIn={onOpenSignIn} embedded />
        <div className="pt-3"><GhostButton onClick={onDone}>Done</GhostButton></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mt-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "'Inter'", color: "#64809A" }}>File your report</div>
      <div className="rounded-xl px-3.5 py-2.5 mb-4" style={{ background: "#FCE985" }}>
        <p style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#5A4300", lineHeight: 1.5 }}>
          Keep it respectful and anonymous — don't name coworkers or managers, and don't describe specific patients or patient situations, even without a name. No profanity. Accounts that don't follow this get banned.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Your role</label>
          <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder={rolePlaceholder} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((c) => (
            <div key={c.key}>
              <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>{c.label}</label>
              <Stars value={ratings[c.key]} onChange={(n) => setRatings((r) => ({ ...r, [c.key]: n }))} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="What should someone applying here know?" className="w-full border rounded-xl px-3.5 py-2.5 text-sm" style={inputStyle} />
        </div>
        {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
        <div className="flex gap-2">
          <PrimaryButton onClick={handleSubmit}>{submitting ? "Posting…" : "Post report"}</PrimaryButton>

          <GhostButton onClick={onCancel}>Cancel</GhostButton>
        </div>
      </div>
    </div>
  );
}

function ClaimBadge({ status, name }) {
  if (!status || status === "unclaimed") {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ fontFamily: "'Inter'", color: "#64809A", background: "#EAF3FB" }}>Unclaimed</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A5B00", background: "#FCE985" }}>Claim pending{name ? ` · ${name}` : ""}</span>;
}

function ClaimForm({ onSubmit, onCancel, user, onOpenSignIn }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!user) return <SignInPrompt onOpenSignIn={onOpenSignIn} />;

  function handleSubmit() {
    if (!name.trim() || !title.trim()) {
      setError("Name and title are required.");
      return;
    }
    onSubmit({ claim_status: "pending", claim_name: name.trim(), claim_title: title.trim() });
  }

  return (
    <div className="rounded-2xl p-5 mt-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-3">Claiming a unit lets your hospital respond to reports and confirm listing details.</p>
      <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#0F5132", fontWeight: 600 }} className="mb-3">
        Your name and title are used only for internal verification. They are never shared with anyone — including the hospital you work at — and are never shown publicly.
      </p>
      <div className="space-y-3">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Nurse Manager" />
        {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
        <div className="flex gap-2">
          <PrimaryButton onClick={handleSubmit}>Submit claim</PrimaryButton>
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
        </div>
      </div>
    </div>
  );
}

function AddUnitForm({ hospitals, onSubmit, onCancel, user, onOpenSignIn }) {
  const [hospitalMode, setHospitalMode] = useState("search"); // "search" | "new"
  const [query, setQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [newHospitalName, setNewHospitalName] = useState("");
  const [newHospitalCity, setNewHospitalCity] = useState("");
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");

  if (!user) return <SignInPrompt onOpenSignIn={onOpenSignIn} />;

  const matches = useMemo(() => {
    if (!query.trim() || selectedHospital) return [];
    const q = query.toLowerCase();
    return hospitals.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)).slice(0, 6);
  }, [query, hospitals, selectedHospital]);

  function handleSubmit() {
    if (!name.trim() || !type.trim()) { setError("Unit name and unit type are required."); return; }
    if (hospitalMode === "search") {
      if (!selectedHospital) { setError("Search for and select a hospital, or switch to add a new one."); return; }
      onSubmit({
        hospitalId: selectedHospital.id,
        hospitalMeta: { id: selectedHospital.id, name: selectedHospital.name, city: selectedHospital.city },
        newHospital: null,
        unit: { name: name.trim(), floor: floor.trim() || "—", type: type.trim() },
      });
    } else {
      if (!newHospitalName.trim() || !newHospitalCity.trim()) { setError("Enter the hospital's name and city."); return; }
      const dup = hospitals.find((h) => h.name.trim().toLowerCase() === newHospitalName.trim().toLowerCase());
      if (dup) { setError(`"${newHospitalName.trim()}" is already added — search for it instead.`); return; }
      setError("");
      onSubmit({
        hospitalId: null,
        hospitalMeta: null,
        newHospital: { name: newHospitalName.trim(), city: newHospitalCity.trim() },
        unit: { name: name.trim(), floor: floor.trim() || "—", type: type.trim() },
      });
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-4">Don't see your unit — or your hospital — listed? Add it below.</p>
      <div className="space-y-3">
        <div>
          <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Hospital</label>

          {hospitalMode === "new" ? (
            <div className="space-y-2">
              <button onClick={() => { setHospitalMode("search"); setNewHospitalName(""); setNewHospitalCity(""); setError(""); }} className="text-[12.5px] font-semibold" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>← Search for an existing hospital instead</button>
              <div className="grid grid-cols-2 gap-3">
                <TextInput value={newHospitalName} onChange={(e) => setNewHospitalName(e.target.value)} placeholder="Hospital name" />
                <TextInput value={newHospitalCity} onChange={(e) => setNewHospitalCity(e.target.value)} placeholder="City, State" />
              </div>
            </div>
          ) : selectedHospital ? (
            <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ border: "1px solid #D7E6F3", background: "#EAF3FB" }}>
              <div>
                <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "13.5px", color: "#16324A" }}>{selectedHospital.name}</div>
                <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{selectedHospital.city}</div>
              </div>
              <button onClick={() => setSelectedHospital(null)} className="text-[12.5px] font-semibold" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Change</button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hospital name or city…" className="flex-1 border rounded-xl px-3.5 py-2.5 text-sm" style={inputStyle} />
                <button onClick={() => { setHospitalMode("new"); setNewHospitalName(query.trim()); setQuery(""); setError(""); }} className="px-3 rounded-xl text-[12.5px] font-semibold flex-shrink-0" style={{ fontFamily: "'Inter'", color: "#0F9D6A", border: "1px solid #0F9D6A" }}>+ New hospital</button>
              </div>
              {matches.length > 0 && (
                <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid #D7E6F3" }}>
                  {matches.map((h) => (
                    <button key={h.id} onClick={() => { setSelectedHospital(h); setQuery(""); }} className="w-full text-left px-3.5 py-2.5" style={{ background: "#FFFFFF", borderTop: "1px solid #EEF4FA" }}>
                      <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "13.5px", color: "#16324A" }}>{h.name}</div>
                      <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{h.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Unit name, e.g. Cardiac ICU" />
          <TextInput value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor / wing (optional)" />
        </div>
        <TextInput value={type} onChange={(e) => setType(e.target.value)} placeholder="Unit type, e.g. ICU, Med-Surg, Oncology" />
        {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
        <div className="flex gap-2">
          <PrimaryButton onClick={handleSubmit} color="#0F9D6A">Add unit</PrimaryButton>
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
        </div>
      </div>
    </div>
  );
}

function CompareView({ type, base, hospitals, onBack }) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(null);
  const categories = type === "hospital" ? HOSPITAL_CATEGORIES : UNIT_CATEGORIES;

  const candidates = useMemo(() => {
    if (type === "hospital") return hospitals.filter((h) => h.id !== base.id);
    return hospitals.flatMap((h) => (h.units || []).map((u) => ({ ...u, hospital: h }))).filter((u) => u.id !== base.id);
  }, [hospitals, type, base]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates.filter((c) => (type === "hospital" ? c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) : c.name.toLowerCase().includes(q) || c.hospital.name.toLowerCase().includes(q)));
  }, [candidates, query, type]);

  const baseReviews = type === "hospital" ? base.hospital_reviews : base.unit_reviews;
  const baseScore = overallAvg(baseReviews, categories);
  const targetReviews = target ? (type === "hospital" ? target.hospital_reviews : target.unit_reviews) : [];
  const targetScore = target ? overallAvg(targetReviews, categories) : 0;

  function sideLabel(item, t) {
    if (t === "hospital") return item.city || "";
    const hName = item.hospital ? item.hospital.name : item.hospitalName;
    const hCity = item.hospital ? item.hospital.city : item.hospitalCity;
    return [hName, hCity].filter(Boolean).join(" · ");
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-4 font-medium" style={{ fontFamily: "'Inter'", color: "#64809A" }}><ArrowLeft size={15} /> Back</button>
      <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Compare {type === "hospital" ? "hospitals" : "units"}</div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-3.5 text-center" style={{ background: "#EAF3FB", border: "1px solid #D7E6F3" }}>
          <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.92rem", color: "#16324A", lineHeight: 1.3 }}>{base.name}</div>
          <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mt-0.5">{sideLabel(base, type)}</div>
        </div>
        <div className="rounded-xl p-3.5 text-center" style={{ background: target ? "#EAF3FB" : "#F4F8FC", border: "1px solid #D7E6F3" }}>
          {target ? (
            <>
              <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.92rem", color: "#16324A", lineHeight: 1.3 }}>{target.name}</div>
              <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mt-0.5">{sideLabel(target, type)}</div>
            </>
          ) : <div style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#93A7B8" }}>Pick a {type === "hospital" ? "hospital" : "unit"} below</div>}
        </div>
      </div>

      {!target && (
        <div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#64809A" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={type === "hospital" ? "Search a hospital to compare…" : "Search a unit to compare…"} className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm" style={{ ...inputStyle, background: "#FFFFFF" }} />
          </div>
          <div className="space-y-2">
            {filtered.slice(0, 12).map((c) => {
              const cReviews = type === "hospital" ? c.hospital_reviews : c.unit_reviews;
              return (
                <button key={c.id} onClick={() => setTarget(c)} className="w-full text-left rounded-xl p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
                  <div>
                    <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>{c.name}</div>
                    {type === "unit" && <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{c.hospital.name}</div>}
                    {type === "hospital" && <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{c.city}</div>}
                  </div>
                  <ScorePill score={overallAvg(cReviews, categories)} size="sm" />
                </button>
              );
            })}
            {filtered.length === 0 && <p className="py-6 text-center" style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }}>No matches.</p>}
          </div>
        </div>
      )}

      {target && (
        <div className="rounded-2xl p-5" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
          <div className="grid grid-cols-3 items-center pb-4 mb-1" style={{ borderBottom: "3px solid #16324A" }}>
            <div className="flex justify-start"><ScorePill score={baseScore} size="md" width="76px" /></div>
            <span className="text-center" style={{ fontFamily: "'Inter'", fontSize: "11px", fontWeight: 700, color: "#64809A" }}>OVERALL</span>
            <div className="flex justify-end"><ScorePill score={targetScore} size="md" width="76px" /></div>
          </div>
          {categories.map((c) => {
            const bv = avg(baseReviews, c.key);
            const tv = avg(targetReviews, c.key);
            const Icon = c.icon;
            return (
              <div key={c.key} className="grid grid-cols-3 items-center py-3.5" style={{ borderTop: "2px solid #C7DCF0" }}>
                <div><ScorePill score={bv} size="sm" /></div>
                <span className="text-center flex items-center justify-center gap-1.5" style={{ fontFamily: "'Inter'", fontSize: "12.5px", fontWeight: 600, color: "#16324A" }}><Icon size={14} color="#3E8EDE" /> {c.label}</span>
                <div className="flex justify-end"><ScorePill score={tv} size="sm" /></div>
              </div>
            );
          })}
          <button onClick={() => setTarget(null)} className="text-[12.5px] mt-4 font-medium" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Choose a different comparison</button>
        </div>
      )}
    </div>
  );
}

function UnitView({ hospital, unit, onBack, onBackToHospital, onAddReview, onDeleteReview, onReportPost, onVote, userVotes, onCompare, onGetVerified, user, onOpenSignIn, autoOpenReview }) {
  const [showForm, setShowForm] = useState(!!autoOpenReview);
  const [reviewSort, setReviewSort] = useState("newest");

  const reviews = unit.unit_reviews || [];
  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (reviewSort === "helpful") arr.sort((a, b) => helpfulScore(b) - helpfulScore(a));
    else arr.reverse();
    arr.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    return arr;
  }, [reviews, reviewSort]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ fontFamily: "'Inter'", color: "#64809A" }}><ArrowLeft size={15} /> Back</button>
        <button onClick={onBackToHospital} className="text-[13px] font-semibold" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>{hospital.name}</button>
      </div>
      <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Floor {unit.floor} · {unit.type}</div>
      <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.7rem", color: "#16324A" }}>{unit.name}</h1>
      <div className="flex items-center justify-between mb-3 mt-1">
        <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#64809A" }}>{hospital.name} · {hospital.city}</p>
        <CompareButton onClick={onCompare} label="Compare" />
      </div>

      <div className="rounded-xl px-3.5 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: "#A9F0CE" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} color="#0F5132" />
          <span style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#0F5132", fontWeight: 500 }}>Worked here?</span>
        </div>
        <button onClick={() => onGetVerified(hospital)} className="text-[12.5px] font-bold flex-shrink-0" style={{ fontFamily: "'Inter'", color: "#0F5132" }}>Get Verified</button>
      </div>

      <VitalsPanel reviews={reviews} categories={UNIT_CATEGORIES} />
      <CategoryList reviews={reviews} categories={UNIT_CATEGORIES} />

      <div className="flex items-center justify-between mt-6 mb-1">
        <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.05rem", color: "#16324A" }}>Reports ({reviews.length})</h2>
        <div className="flex items-center gap-2">
          <ReviewSortControl value={reviewSort} onChange={setReviewSort} />
          {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-white font-semibold" style={{ background: "#0F9D6A", fontFamily: "'Inter'" }}><Plus size={14} /> File a report</button>}
        </div>
      </div>

      {showForm && <ReviewForm categories={UNIT_CATEGORIES} reviewType="unit" hospitalId={hospital.id} hospitalName={hospital.name} rolePlaceholder="e.g. RN, Nights" user={user} onOpenSignIn={onOpenSignIn} onCancel={() => setShowForm(false)} onSubmit={(rev) => onAddReview(unit.id, rev)} onDone={() => setShowForm(false)} />}

      <div>
        {reviews.length === 0 && <p className="py-6 text-center" style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }}>No reports yet on this unit. Be the first to file one.</p>}
        {sortedReviews.map((r) => <ReviewCard key={r.id} review={r} categories={UNIT_CATEGORIES} userVote={userVotes[r.id]} onVote={(id, dir) => onVote("unit", id, dir)} currentUserId={user?.id} onDelete={(id) => onDeleteReview("unit", id)} onReport={(id, reason) => onReportPost("unit", id, reason)} />)}
      </div>
    </div>
  );
}

function HospitalView({ hospital, onBack, onSelectUnit, onAddReview, onDeleteReview, onReportPost, onVote, userVotes, onCompare, onOpenAddUnit, onGetVerified, user, onOpenSignIn }) {
  const [tab, setTab] = useState("overview");
  const [sort, setSort] = useState("rating-desc");
  const [showForm, setShowForm] = useState(false);
  const [reviewSort, setReviewSort] = useState("newest");

  const units = hospital.units || [];
  const hReviews = hospital.hospital_reviews || [];

  const sortedUnits = useMemo(() => {
    const arr = [...units];
    if (sort === "rating-desc") arr.sort((a, b) => overallAvg(b.unit_reviews, UNIT_CATEGORIES) - overallAvg(a.unit_reviews, UNIT_CATEGORIES));
    if (sort === "rating-asc") arr.sort((a, b) => overallAvg(a.unit_reviews, UNIT_CATEGORIES) - overallAvg(b.unit_reviews, UNIT_CATEGORIES));
    if (sort === "most-reviewed") arr.sort((a, b) => (b.unit_reviews || []).length - (a.unit_reviews || []).length);
    if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [units, sort]);

  const sortedHospitalReviews = useMemo(() => {
    const arr = [...hReviews];
    if (reviewSort === "helpful") arr.sort((a, b) => helpfulScore(b) - helpfulScore(a));
    else arr.reverse();
    arr.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    return arr;
  }, [hReviews, reviewSort]);

  const TabButton = ({ tkey, label }) => (
    <button onClick={() => setTab(tkey)} className="px-3.5 py-2 rounded-full text-[13px] font-semibold" style={{ fontFamily: "'Inter'", color: tab === tkey ? "#FFFFFF" : "#16324A", background: tab === tkey ? "#3E8EDE" : "#EAF3FB" }}>{label}</button>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-4 font-medium" style={{ fontFamily: "'Inter'", color: "#64809A" }}><ArrowLeft size={15} /> All hospitals</button>
      <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.7rem", color: "#16324A" }}>{hospital.name}</h1>
      <div className="flex items-center justify-between mb-4 mt-1">
        <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#64809A" }}>{hospital.city}</p>
        <CompareButton onClick={onCompare} label="Compare" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <TabButton tkey="overview" label="Hospital ratings" />
        <TabButton tkey="units" label={`View all units at this hospital (${units.length})`} />
      </div>

      {tab === "overview" && (
        <div>
          <div className="rounded-xl px-3.5 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: "#A9F0CE" }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} color="#0F5132" />
              <span style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#0F5132", fontWeight: 500 }}>Worked here?</span>
            </div>
            <button onClick={() => onGetVerified(hospital)} className="text-[12.5px] font-bold flex-shrink-0" style={{ fontFamily: "'Inter'", color: "#0F5132" }}>Get Verified</button>
          </div>
          <VitalsPanel reviews={hReviews} categories={HOSPITAL_CATEGORIES} />
          <CategoryList reviews={hReviews} categories={HOSPITAL_CATEGORIES} />
          <div className="flex items-center justify-between mt-6 mb-1">
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.05rem", color: "#16324A" }}>Reports ({hReviews.length})</h2>
            <div className="flex items-center gap-2">
              <ReviewSortControl value={reviewSort} onChange={setReviewSort} />
              {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-white font-semibold" style={{ background: "#0F9D6A", fontFamily: "'Inter'" }}><Plus size={14} /> Rate this hospital</button>}
            </div>
          </div>
          {showForm && <ReviewForm categories={HOSPITAL_CATEGORIES} reviewType="hospital" hospitalId={hospital.id} hospitalName={hospital.name} rolePlaceholder="e.g. RN, Emergency" user={user} onOpenSignIn={onOpenSignIn} onCancel={() => setShowForm(false)} onSubmit={(rev) => onAddReview(hospital.id, rev)} onDone={() => setShowForm(false)} />}
          <div>
            {hReviews.length === 0 && <p className="py-6 text-center" style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }}>No hospital-wide reports yet. Be the first to file one.</p>}
            {sortedHospitalReviews.map((r) => <ReviewCard key={r.id} review={r} categories={HOSPITAL_CATEGORIES} userVote={userVotes[r.id]} onVote={(id, dir) => onVote("hospital", id, dir)} currentUserId={user?.id} onDelete={(id) => onDeleteReview("hospital", id)} onReport={(id, reason) => onReportPost("hospital", id, reason)} />)}
          </div>
        </div>
      )}

      {tab === "units" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-full px-3 py-1.5 text-[12.5px]" style={{ ...inputStyle, background: "#FFFFFF", fontWeight: 500 }}>
              <option value="rating-desc">Highest rated</option>
              <option value="rating-asc">Lowest rated</option>
              <option value="most-reviewed">Most reviewed</option>
              <option value="name">Name A–Z</option>
            </select>
            <button onClick={onOpenAddUnit} className="text-[12.5px] font-semibold" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>Can't find your unit? Add it</button>
          </div>
          <div className="space-y-3">
            {sortedUnits.map((u) => {
              const score = overallAvg(u.unit_reviews, UNIT_CATEGORIES);
              return (
                <button key={u.id} onClick={() => onSelectUnit(u)} className="w-full text-left rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest font-semibold mb-0.5" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Floor {u.floor} · {u.type}</div>
                    <div className="flex items-center gap-2">
                      <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.02rem", color: "#16324A" }}>{u.name}</div>
                    </div>
                    <div style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#64809A" }}>{(u.unit_reviews || []).length} report{(u.unit_reviews || []).length === 1 ? "" : "s"}</div>
                  </div>
                  <ScorePill score={score} size="md" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AllUnitsView({ hospitals, onSelectUnit, onOpenAddUnit }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("rating-desc");

  const flatUnits = useMemo(() => hospitals.flatMap((h) => (h.units || []).map((u) => ({ ...u, hospital: h }))), [hospitals]);
  const types = useMemo(() => ["all", ...new Set(flatUnits.map((u) => u.type))], [flatUnits]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let arr = flatUnits.filter((u) => {
      const matchesQuery = u.name.toLowerCase().includes(q) || u.hospital.name.toLowerCase().includes(q) || u.hospital.city.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || u.type === typeFilter;
      const matchesRating = overallAvg(u.unit_reviews, UNIT_CATEGORIES) >= minRating;
      return matchesQuery && matchesType && matchesRating;
    });
    if (sort === "rating-desc") arr.sort((a, b) => overallAvg(b.unit_reviews, UNIT_CATEGORIES) - overallAvg(a.unit_reviews, UNIT_CATEGORIES));
    if (sort === "rating-asc") arr.sort((a, b) => overallAvg(a.unit_reviews, UNIT_CATEGORIES) - overallAvg(b.unit_reviews, UNIT_CATEGORIES));
    if (sort === "most-reviewed") arr.sort((a, b) => (b.unit_reviews || []).length - (a.unit_reviews || []).length);
    if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [flatUnits, query, typeFilter, minRating, sort]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest font-semibold mb-2" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>{filtered.length} unit{filtered.length === 1 ? "" : "s"} matching</div>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.7rem", color: "#16324A" }}>Browse units</h1>
        </div>
        <button onClick={onOpenAddUnit} className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] text-white font-semibold h-fit" style={{ background: "#0F9D6A", fontFamily: "'Inter'" }}><Plus size={14} /> Add a unit</button>
      </div>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#64809A" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search unit, hospital, or city…" className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm" style={{ ...inputStyle, background: "#FFFFFF" }} />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-full px-3 py-1.5 text-[12.5px]" style={{ ...inputStyle, background: "#FFFFFF", fontWeight: 500 }}>
          {types.map((t) => <option key={t} value={t}>{t === "all" ? "All unit types" : t}</option>)}
        </select>
        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="border rounded-full px-3 py-1.5 text-[12.5px]" style={{ ...inputStyle, background: "#FFFFFF", fontWeight: 500 }}>
          <option value={0}>Any rating</option><option value={2}>2.0+</option><option value={3}>3.0+</option><option value={4}>4.0+</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-full px-3 py-1.5 text-[12.5px] ml-auto" style={{ ...inputStyle, background: "#FFFFFF", fontWeight: 500 }}>
          <option value="rating-desc">Highest rated</option><option value="rating-asc">Lowest rated</option><option value="most-reviewed">Most reviewed</option><option value="name">Name A–Z</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map((u) => {
          const score = overallAvg(u.unit_reviews, UNIT_CATEGORIES);
          return (
            <button key={u.id} onClick={() => onSelectUnit(u.hospital, u)} className="w-full text-left rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-semibold mb-0.5" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>{u.type} · Floor {u.floor}</div>
                <div className="flex items-center gap-2">
                  <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.02rem", color: "#16324A" }}>{u.name}</div>
                </div>
                <div style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#64809A" }}>{u.hospital.name} · {u.hospital.city}</div>
              </div>
              <ScorePill score={score} size="md" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-6 text-center">
            <p style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }} className="mb-3">No units match your filters.</p>
            <button onClick={onOpenAddUnit} className="text-[13px] font-semibold" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>Add the unit you're looking for</button>
          </div>
        )}
      </div>
    </div>
  );
}

function mostRecentActivity(h) {
  const times = [
    ...(h.hospital_reviews || []).map((r) => r.created_at),
    ...(h.units || []).flatMap((u) => (u.unit_reviews || []).map((r) => r.created_at)),
  ].filter(Boolean).map((t) => new Date(t).getTime());
  return times.length ? Math.max(...times) : null;
}

function HomeView({ hospitals, onSelectHospital, onOpenAddUnit }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const matches = hospitals.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q));
    return [...matches].sort((a, b) => {
      const at = mostRecentActivity(a);
      const bt = mostRecentActivity(b);
      if (at && bt) return bt - at;
      if (at) return -1;
      if (bt) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [hospitals, query]);

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-widest font-semibold mb-2" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Before you sign the offer</div>
        <h1 style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "2.3rem", color: "#16324A", lineHeight: 1.15 }}>Rate the unit.<br />Rate the hospital.</h1>
        <p style={{ fontFamily: "'Inter'", fontSize: "15px", color: "#64809A" }} className="mt-3 max-w-md">
          Search a hospital, find any unit, get the information you're looking for. Staffing Ratios, management, Culture, Pay. Reviewed by the staff who actually worked the floor. All at your fingertips!
        </p>
      </div>
      <div className="relative mb-2">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#64809A" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hospital or city…" className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm" style={{ ...inputStyle, background: "#FFFFFF" }} />
      </div>
      <button onClick={onOpenAddUnit} className="text-[12.5px] mb-6 font-semibold" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>Can't find your hospital or unit? Add it</button>
      <div className="space-y-3">
        {filtered.map((h) => {
          const score = overallAvg(h.hospital_reviews, HOSPITAL_CATEGORIES);
          return (
            <button key={h.id} onClick={() => onSelectHospital(h)} className="w-full text-left rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div>
                <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.08rem", color: "#16324A" }}>{h.name}</div>
                <div style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#64809A" }}>{h.city} · {(h.units || []).length} unit{(h.units || []).length === 1 ? "" : "s"} listed</div>
              </div>
              <ScorePill score={score} size="md" />
            </button>
          );
        })}
        {filtered.length === 0 && <p className="py-6 text-center" style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }}>No hospitals match "{query}" yet.</p>}
      </div>
    </div>
  );
}

function StaticPage({ title, onBack, children }) {
  return (
    <div className="rounded-2xl p-6" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      {onBack && <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] mb-4 font-medium" style={{ fontFamily: "'Inter'", color: "#64809A" }}><ArrowLeft size={15} /> Back</button>}
      <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.5rem", color: "#16324A" }} className="mb-4">{title}</h1>
      <div style={{ fontFamily: "'Inter'", fontSize: "14.5px", color: "#33475A", lineHeight: 1.7 }} className="space-y-3">{children}</div>
    </div>
  );
}
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function IncomeCalculatorPage({ onBack }) {
  const [date, setDate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [normalHours, setNormalHours] = useState("");
  const [otRate, setOtRate] = useState("");
  const [otHours, setOtHours] = useState("");
  const [contractStipends, setContractStipends] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [city, setCity] = useState("");
  const [stateCities, setStateCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "found" | "notfound" | "error"
  const [results, setResults] = useState(null);
  const [manualGsaWeekly, setManualGsaWeekly] = useState("");

  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  const monthNum = date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;

  useEffect(() => {
    setStateCities([]);
    setCity("");
    if (!stateAbbr) return;
    let cancelled = false;
    setCitiesLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_GSA_API_KEY;
    fetch(`https://api.gsa.gov/travel/perdiem/v2/rates/state/${stateAbbr}/year/${year}?api_key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const names = new Set();
        (data?.rates?.[0]?.rate || []).forEach((r) => { if (r.city) names.add(r.city); });
        setStateCities(Array.from(names).sort());
      })
      .catch(() => { if (!cancelled) setStateCities([]); })
      .finally(() => { if (!cancelled) setCitiesLoading(false); });
    return () => { cancelled = true; };
  }, [stateAbbr, year]);

  const cityMatches = useMemo(() => {
    if (!city.trim()) return stateCities.slice(0, 8);
    const q = city.toLowerCase();
    return stateCities.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [city, stateCities]);

  function computeTaxable() {
    const hr = parseFloat(hourlyRate) || 0;
    const nh = parseFloat(normalHours) || 0;
    const or_ = parseFloat(otRate) || 0;
    const oh = parseFloat(otHours) || 0;
    return hr * nh + or_ * oh;
  }

  async function handleCalculate() {
    const taxable = computeTaxable();
    const contractStipendsNum = parseFloat(contractStipends) || 0;

    if (!stateAbbr) {
      setResults({ taxable, contractStipends: contractStipendsNum, contractTotal: taxable + contractStipendsNum, gsaWeekly: null });
      setStatus("notfound");
      return;
    }

    setStatus("loading");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GSA_API_KEY;
      const url = city.trim()
        ? `https://api.gsa.gov/travel/perdiem/v2/rates/city/${encodeURIComponent(city.trim())}/state/${stateAbbr}/year/${year}?api_key=${apiKey}`
        : `https://api.gsa.gov/travel/perdiem/v2/rates/state/${stateAbbr}/year/${year}?api_key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const rateEntry = data?.rates?.[0]?.rate?.[0];
      const monthEntry = rateEntry?.months?.month?.find((m) => Number(m.number) === monthNum);
      const dailyLodging = monthEntry?.value;
      const dailyMeals = rateEntry?.meals;

      if (!dailyLodging || !dailyMeals) {
        setResults({ taxable, contractStipends: contractStipendsNum, contractTotal: taxable + contractStipendsNum, gsaWeekly: null });
        setStatus("notfound");
        return;
      }
      const gsaWeekly = (dailyLodging + dailyMeals) * 7;
      setResults({ taxable, contractStipends: contractStipendsNum, contractTotal: taxable + contractStipendsNum, gsaWeekly, gsaTotal: taxable + gsaWeekly });
      setStatus("found");
    } catch (e) {
      setResults({ taxable, contractStipends: contractStipendsNum, contractTotal: taxable + contractStipendsNum, gsaWeekly: null });
      setStatus("error");
    }
  }

  function handleManualGsa() {
    const g = parseFloat(manualGsaWeekly) || 0;
    setResults((r) => ({ ...r, gsaWeekly: g, gsaTotal: r.taxable + g }));
    setStatus("found");
  }

  return (
    <StaticPage title="Income Calculator" onBack={onBack}>
      <p>Compare what a contract's stipend actually offers against the GSA maximum allowable for that area. Enter your pay details and either the contract's weekly stipend, the location, or both.</p>

      <div className="rounded-2xl p-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
        <p style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }} className="mb-3">Enter Your Details</p>

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Start Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm mb-3" style={inputStyle} />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Hourly Rate ($)</label>
            <TextInput value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Normal Hours</label>
            <TextInput value={normalHours} onChange={(e) => setNormalHours(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Overtime Rate ($)</label>
            <TextInput value={otRate} onChange={(e) => setOtRate(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Overtime Hours</label>
            <TextInput value={otHours} onChange={(e) => setOtHours(e.target.value)} placeholder="0" />
          </div>
        </div>

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Contract Weekly Stipends ($)</label>
        <TextInput value={contractStipends} onChange={(e) => setContractStipends(e.target.value)} placeholder="0.00" style={{ marginBottom: "12px" }} />

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>State</label>
        <select value={stateAbbr} onChange={(e) => setStateAbbr(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm mb-3" style={{ ...inputStyle, background: "#FFFFFF" }}>
          <option value="">Select a state</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>City</label>
        <div className="relative mb-1">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => setShowCityDropdown(true)}
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
            placeholder={stateAbbr ? "Search city…" : "Pick a state first"}
            disabled={!stateAbbr}
            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
            style={{ ...inputStyle, background: stateAbbr ? "#FFFFFF" : "#F4F8FC" }}
          />
          {showCityDropdown && stateAbbr && cityMatches.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-10" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF", maxHeight: "220px", overflowY: "auto" }}>
              {cityMatches.map((c) => (
                <button key={c} onMouseDown={() => { setCity(c); setShowCityDropdown(false); }} className="w-full text-left px-3.5 py-2" style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#16324A", borderTop: "1px solid #EEF4FA" }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        {stateAbbr && citiesLoading && <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }} className="mb-2">Loading cities for {stateAbbr}…</p>}

        <div className="pt-2">
          <PrimaryButton onClick={handleCalculate} color="#0F9D6A">{status === "loading" ? "Calculating…" : "Calculate"}</PrimaryButton>
        </div>

        {status === "notfound" && (
          <div className="pt-3">
            <p style={{ color: "#7A5B00", fontSize: "12.5px", fontFamily: "'Inter'" }} className="mb-2">
              {stateAbbr ? "Couldn't find a GSA rate for that city. Enter it manually to compare, or check gsa.gov/perdiem:" : "Pick a state to compare against the GSA max, or just review your contract numbers below."}
            </p>
            {stateAbbr && (
              <div className="flex gap-2 items-center">
                <TextInput value={manualGsaWeekly} onChange={(e) => setManualGsaWeekly(e.target.value)} placeholder="GSA weekly stipend ($)" />
                <PrimaryButton onClick={handleManualGsa} color="#64809A">Use this</PrimaryButton>
              </div>
            )}
          </div>
        )}
        {status === "error" && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }} className="pt-2">Lookup failed — you can still compare using your contract numbers below.</p>}
      </div>

      {results && (
        <div className="space-y-3 mt-2">
          <div className="rounded-2xl p-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
            <p style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }} className="mb-2">Contract Says…</p>
            <div className="flex justify-between py-2" style={{ borderTop: "1px solid #EEF4FA", fontFamily: "'Inter'", fontSize: "14px", color: "#33475A" }}>
              <span>Weekly Taxable</span><span style={{ fontWeight: 700 }}>${results.taxable.toFixed(0)}</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderTop: "1px solid #EEF4FA", fontFamily: "'Inter'", fontSize: "14px", color: "#33475A" }}>
              <span>Weekly Stipends</span><span style={{ fontWeight: 700 }}>${results.contractStipends.toFixed(0)}</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderTop: "1px solid #EEF4FA", fontFamily: "'Poppins'", fontWeight: 800, color: "#16324A", fontSize: "1.05rem" }}>
              <span>Weekly Total</span><span>${results.contractTotal.toFixed(0)}</span>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #1B5E63, #2E8B92)" }}>
            <p style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#FFFFFF" }} className="mb-2">GSA Max…</p>
            <div className="flex justify-between py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.25)", fontFamily: "'Inter'", fontSize: "14px", color: "#D8ECEC" }}>
              <span>Weekly Taxable</span><span style={{ fontWeight: 700, color: "#FFFFFF" }}>${results.taxable.toFixed(0)}</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.25)", fontFamily: "'Inter'", fontSize: "14px", color: "#D8ECEC" }}>
              <span>Weekly Stipends</span><span style={{ fontWeight: 700, color: "#FFFFFF" }}>{results.gsaWeekly != null ? `$${results.gsaWeekly.toFixed(0)}` : "—"}</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.25)", fontFamily: "'Poppins'", fontWeight: 800, color: "#FFFFFF", fontSize: "1.05rem" }}>
              <span>Weekly Total</span><span>{results.gsaTotal != null ? `$${results.gsaTotal.toFixed(0)}` : "—"}</span>
            </div>
          </div>
        </div>
      )}

      <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8", fontStyle: "italic" }} className="pt-2">This is a pay estimator, not tax or financial advice. Actual taxable vs. non-taxable treatment of stipends depends on your specific tax situation.</p>
    </StaticPage>
  );
}

function GsaCalculatorPage({ onBack }) {
  const [date, setDate] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [city, setCity] = useState("");
  const [stateCities, setStateCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "found" | "notfound" | "error"
  const [weekly, setWeekly] = useState(null);
  const [manualLodging, setManualLodging] = useState("");
  const [manualMeals, setManualMeals] = useState("");

  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  const monthNum = date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;

  useEffect(() => {
    setStateCities([]);
    setCity("");
    if (!stateAbbr) return;
    let cancelled = false;
    setCitiesLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_GSA_API_KEY;
    fetch(`https://api.gsa.gov/travel/perdiem/v2/rates/state/${stateAbbr}/year/${year}?api_key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const names = new Set();
        (data?.rates?.[0]?.rate || []).forEach((r) => { if (r.city) names.add(r.city); });
        setStateCities(Array.from(names).sort());
      })
      .catch(() => { if (!cancelled) setStateCities([]); })
      .finally(() => { if (!cancelled) setCitiesLoading(false); });
    return () => { cancelled = true; };
  }, [stateAbbr, year]);

  const cityMatches = useMemo(() => {
    if (!city.trim()) return stateCities.slice(0, 8);
    const q = city.toLowerCase();
    return stateCities.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [city, stateCities]);

  async function handleCalculate() {
    if (!stateAbbr) return;
    setStatus("loading");
    setWeekly(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GSA_API_KEY;
      const url = city.trim()
        ? `https://api.gsa.gov/travel/perdiem/v2/rates/city/${encodeURIComponent(city.trim())}/state/${stateAbbr}/year/${year}?api_key=${apiKey}`
        : `https://api.gsa.gov/travel/perdiem/v2/rates/state/${stateAbbr}/year/${year}?api_key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const rateEntry = data?.rates?.[0]?.rate?.[0];
      if (!rateEntry) { setStatus("notfound"); return; }
      const monthEntry = rateEntry.months?.month?.find((m) => Number(m.number) === monthNum);
      const dailyLodging = monthEntry?.value;
      const dailyMeals = rateEntry.meals;
      if (!dailyLodging || !dailyMeals) { setStatus("notfound"); return; }
      setWeekly({ lodging: dailyLodging * 7, meals: dailyMeals * 7, total: (dailyLodging + dailyMeals) * 7 });
      setStatus("found");
    } catch (e) {
      setStatus("error");
    }
  }

  function handleManualCalculate() {
    const l = parseFloat(manualLodging) || 0;
    const m = parseFloat(manualMeals) || 0;
    setWeekly({ lodging: l * 7, meals: m * 7, total: (l + m) * 7 });
    setStatus("found");
  }

  return (
    <StaticPage title="GSA Calculator" onBack={onBack}>
      <p>Estimate GSA per diem (lodging + meals &amp; incidentals) for a trip. These are official federal reimbursement rates. Many travel contracts use them as a reference, but your actual pay package depends on your employer or agency.</p>

      <div className="rounded-2xl p-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
        <p style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }} className="mb-3">Enter Your Details</p>

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Start Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm mb-3" style={inputStyle} />

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>State</label>
        <select value={stateAbbr} onChange={(e) => setStateAbbr(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm mb-3" style={{ ...inputStyle, background: "#FFFFFF" }}>
          <option value="">Select a state</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>City</label>
        <div className="relative mb-1">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => setShowCityDropdown(true)}
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
            placeholder={stateAbbr ? "Search city…" : "Pick a state first"}
            disabled={!stateAbbr}
            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
            style={{ ...inputStyle, background: stateAbbr ? "#FFFFFF" : "#F4F8FC" }}
          />
          {showCityDropdown && stateAbbr && cityMatches.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-10" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF", maxHeight: "220px", overflowY: "auto" }}>
              {cityMatches.map((c) => (
                <button key={c} onMouseDown={() => { setCity(c); setShowCityDropdown(false); }} className="w-full text-left px-3.5 py-2" style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#16324A", borderTop: "1px solid #EEF4FA" }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        {stateAbbr && citiesLoading && <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }} className="mb-2">Loading cities for {stateAbbr}…</p>}
        {stateAbbr && !citiesLoading && <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }} className="mb-2">Showing {cityMatches.length} of {stateCities.length} cities. Leave blank to use {stateAbbr}'s standard rate.</p>}

        <div className="pt-2">
          <PrimaryButton onClick={handleCalculate} color="#0F9D6A">{status === "loading" ? "Calculating…" : "Calculate"}</PrimaryButton>
        </div>

        {status === "notfound" && (
          <div className="pt-3">
            <p style={{ color: "#7A5B00", fontSize: "12.5px", fontFamily: "'Inter'" }} className="mb-2">Couldn't find that rate. Look it up at gsa.gov/perdiem and enter it manually:</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <TextInput value={manualLodging} onChange={(e) => setManualLodging(e.target.value)} placeholder="Lodging / night ($)" />
              <TextInput value={manualMeals} onChange={(e) => setManualMeals(e.target.value)} placeholder="Meals / day ($)" />
            </div>
            <PrimaryButton onClick={handleManualCalculate} color="#64809A">Calculate manually</PrimaryButton>
          </div>
        )}
        {status === "error" && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }} className="pt-2">Something went wrong looking that up — try again in a moment.</p>}
      </div>

      {weekly && (
        <div className="rounded-2xl p-5 mt-2" style={{ background: "linear-gradient(135deg, #1B5E63, #2E8B92)" }}>
          <p style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#FFFFFF", fontSize: "1.1rem" }} className="mb-1">Expected Stipends Breakdown</p>
          <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#D8ECEC" }} className="mb-3">GSA max rates for {city || stateAbbr} {date && `in ${new Date(date).toLocaleString("en-US", { month: "long" })}`} are</p>

          <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#D8ECEC" }}>Lodging</p>
            <p style={{ fontFamily: "'Poppins'", fontWeight: 800, color: "#FFFFFF", fontSize: "1.8rem" }}>${weekly.lodging.toFixed(0)} <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "#D8ECEC" }}>/ week</span></p>
          </div>
          <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#D8ECEC" }}>Meals</p>
            <p style={{ fontFamily: "'Poppins'", fontWeight: 800, color: "#FFFFFF", fontSize: "1.8rem" }}>${weekly.meals.toFixed(0)} <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "#D8ECEC" }}>/ week</span></p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.22)", border: "2px solid rgba(255,255,255,0.6)" }}>
            <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#EAF7F6" }}>Total Stipends</p>
            <p style={{ fontFamily: "'Poppins'", fontWeight: 800, color: "#FFFFFF", fontSize: "1.8rem" }}>${weekly.total.toFixed(0)} <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "#EAF7F6" }}>/ week</span></p>
          </div>
        </div>
      )}

      <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8", fontStyle: "italic" }} className="pt-2">This is a rate estimator, not tax or financial advice.</p>
    </StaticPage>
  );
}

function BanControls({ p, banStatus, onBan, onShadowToggle }) {
  const status = banStatus(p);
  return (
    <div>
      <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: status.color, fontWeight: 600 }} className="mb-1">{status.label}</div>
      {p.is_shadow_banned && <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#7A5B00", fontWeight: 600 }} className="mb-2">🕶 Shadow banned</div>}
      <div className="flex flex-wrap gap-2 mb-2">
        {status.label === "Active" ? (
          <>
            <select id={`dur-${p.id}`} className="border rounded-full px-2 py-1 text-[12px]" style={{ ...inputStyle, background: "#FFFFFF" }} defaultValue="1">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
            <button
              onClick={(e) => { const sel = e.target.parentElement.querySelector("select"); onBan(p.id, "temp", Number(sel.value)); }}
              className="px-3 py-1 rounded-full text-[12px] font-semibold"
              style={{ background: "#FCE985", color: "#7A5B00", fontFamily: "'Inter'" }}
            >
              Temp ban
            </button>
            <button onClick={() => onBan(p.id, "permanent")} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#F8AFAF", color: "#7A1313", fontFamily: "'Inter'" }}>
              Ban permanently
            </button>
          </>
        ) : (
          <button onClick={() => onBan(p.id, "unban")} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'" }}>
            Unban
          </button>
        )}
      </div>
      <button
        onClick={() => onShadowToggle(p.id, p.is_shadow_banned)}
        className="px-3 py-1 rounded-full text-[12px] font-semibold"
        style={{ background: p.is_shadow_banned ? "#EAF3FB" : "#16324A", color: p.is_shadow_banned ? "#16324A" : "#FFFFFF", fontFamily: "'Inter'" }}
      >
        {p.is_shadow_banned ? "Remove shadow ban" : "Shadow ban"}
      </button>
    </div>
  );
}

function AdminPage({ onBack, user }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingUserPosts, setLoadingUserPosts] = useState(false);
  const [userConfirmingId, setUserConfirmingId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [loadingFlagged, setLoadingFlagged] = useState(true);
  const [deletionQueue, setDeletionQueue] = useState([]);
  const [loadingDeletionQueue, setLoadingDeletionQueue] = useState(true);

  const isAdmin = user && user.id === ADMIN_USER_ID;

  useEffect(() => {
    if (!isAdmin) return;
    loadRecentReports();
    loadPendingVerifications();
    loadAnalytics();
    loadFlaggedReports();
    loadDeletionQueue();
  }, [isAdmin]);

  async function loadDeletionQueue() {
    setLoadingDeletionQueue(true);
    const { data } = await supabase.from("profiles").select("*").not("deletion_requested_at", "is", null).order("deletion_requested_at", { ascending: false });
    setDeletionQueue(data || []);
    setLoadingDeletionQueue(false);
  }

  async function markDeletionHandled(profileId) {
    await supabase.from("profiles").update({ deletion_requested_at: null }).eq("id", profileId);
    setDeletionQueue((prev) => prev.filter((p) => p.id !== profileId));
  }

  async function loadFlaggedReports() {
    setLoadingFlagged(true);
    const { data: repRows } = await supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: true });
    const rows = repRows || [];
    const hospitalIds = rows.filter((r) => r.post_type === "hospital").map((r) => r.post_id);
    const unitIds = rows.filter((r) => r.post_type === "unit").map((r) => r.post_id);
    let hMap = {}, uMap = {};
    if (hospitalIds.length) {
      const { data } = await supabase.from("hospital_reviews").select("*, hospitals(name, city)").in("id", hospitalIds);
      (data || []).forEach((d) => { hMap[d.id] = d; });
    }
    if (unitIds.length) {
      const { data } = await supabase.from("unit_reviews").select("*, units(name, hospitals(name, city))").in("id", unitIds);
      (data || []).forEach((d) => { uMap[d.id] = d; });
    }
    const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
    let emailMap = {};
    if (reporterIds.length) {
      const { data } = await supabase.from("profiles").select("id, email").in("id", reporterIds);
      emailMap = Object.fromEntries((data || []).map((p) => [p.id, p.email]));
    }
    setFlaggedReports(rows.map((r) => ({ ...r, post: r.post_type === "hospital" ? hMap[r.post_id] : uMap[r.post_id], reporterEmail: emailMap[r.reporter_id] })));
    setLoadingFlagged(false);
  }

  async function dismissFlag(reportId) {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setFlaggedReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function deleteFlaggedPost(report) {
    const table = report.post_type === "hospital" ? "hospital_reviews" : "unit_reviews";
    await supabase.from(table).delete().eq("id", report.post_id);
    await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id);
    setFlaggedReports((prev) => prev.filter((r) => r.id !== report.id));
  }

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    const now = Date.now();
    const since = (days) => new Date(now - days * 86400000).toISOString();
    const countSince = async (table, days) => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true }).gte("created_at", since(days));
      return count || 0;
    };
    const [users1, users7, users30, visits1, visits7, visits30] = await Promise.all([
      countSince("profiles", 1),
      countSince("profiles", 7),
      countSince("profiles", 30),
      countSince("page_views", 1),
      countSince("page_views", 7),
      countSince("page_views", 30),
    ]);
    setAnalytics({ users1, users7, users30, visits1, visits7, visits30 });
    setLoadingAnalytics(false);
  }

  async function openProfile(p) {
    setSelectedProfile(p);
    setLoadingUserPosts(true);
    const { data: hData } = await supabase.from("hospital_reviews").select("*, hospitals(id, name, city)").eq("user_id", p.id).order("created_at", { ascending: false });
    const { data: uData } = await supabase.from("unit_reviews").select("*, units(id, name, hospital_id, hospitals(id, name, city))").eq("user_id", p.id).order("created_at", { ascending: false });
    const combined = [
      ...(hData || []).map((r) => ({ ...r, _type: "hospital" })),
      ...(uData || []).map((r) => ({ ...r, _type: "unit" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const withHospitalId = combined.map((r) => ({ ...r, _hospitalId: r._type === "hospital" ? r.hospitals?.id : r.units?.hospital_id }));
    const { data: vData } = await supabase.from("hospital_verifications").select("hospital_id").eq("status", "verified").eq("user_id", p.id);
    const verifiedHospitalIds = new Set((vData || []).map((v) => v.hospital_id));
    setUserPosts(withHospitalId.map((r) => ({ ...r, _verified: verifiedHospitalIds.has(r._hospitalId) })));
    setLoadingUserPosts(false);
  }

  function closeProfile() {
    setSelectedProfile(null);
    setUserPosts([]);
  }

  async function verifyUserPost(report) {
    if (!report._hospitalId) return;
    const { data: existing } = await supabase
      .from("hospital_verifications")
      .select("id")
      .eq("user_id", report.user_id)
      .eq("hospital_id", report._hospitalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      await supabase.from("hospital_verifications").update({ status: "verified" }).eq("id", existing.id);
    } else {
      await supabase.from("hospital_verifications").insert({ user_id: report.user_id, hospital_id: report._hospitalId, status: "verified", file_path: null });
    }
    setUserPosts((prev) => prev.map((r) => (r._hospitalId === report._hospitalId ? { ...r, _verified: true } : r)));
  }

  async function handleDeleteUserPost(reportType, reportId) {
    const table = reportType === "hospital" ? "hospital_reviews" : "unit_reviews";
    await supabase.from(table).delete().eq("id", reportId);
    setUserPosts((prev) => prev.filter((r) => r.id !== reportId));
    setUserConfirmingId(null);
  }

  async function loadPendingVerifications() {
    setLoadingVerifications(true);
    const { data } = await supabase
      .from("hospital_verifications")
      .select("*, hospitals(id, name, city)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    const rows = data || [];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    let emailMap = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, email").in("id", userIds);
      emailMap = Object.fromEntries((profs || []).map((p) => [p.id, p.email]));
    }
    setPendingVerifications(rows.map((r) => ({ ...r, email: emailMap[r.user_id] })));
    setLoadingVerifications(false);
  }

  async function viewProof(path) {
    const { data } = await supabase.storage.from("verification-proof").createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function handleVerificationDecision(id, decision) {
    await supabase.from("hospital_verifications").update({ status: decision }).eq("id", id);
    setPendingVerifications((prev) => prev.filter((r) => r.id !== id));
  }

  async function loadRecentReports() {
    setLoadingReports(true);
    const { data: hData } = await supabase
      .from("hospital_reviews")
      .select("*, hospitals(id, name, city)")
      .order("created_at", { ascending: false })
      .limit(15);
    const { data: uData } = await supabase
      .from("unit_reviews")
      .select("*, units(id, name, hospital_id, hospitals(id, name, city))")
      .order("created_at", { ascending: false })
      .limit(15);
    const combined = [
      ...(hData || []).map((r) => ({ ...r, _type: "hospital" })),
      ...(uData || []).map((r) => ({ ...r, _type: "unit" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const withHospitalId = combined.map((r) => ({
      ...r,
      _hospitalId: r._type === "hospital" ? r.hospitals?.id : r.units?.hospital_id,
    }));
    const pairs = withHospitalId.filter((r) => r._hospitalId).map((r) => `${r.user_id}|${r._hospitalId}`);
    let verifiedSet = new Set();
    if (pairs.length) {
      const { data: vData } = await supabase.from("hospital_verifications").select("user_id, hospital_id").eq("status", "verified");
      verifiedSet = new Set((vData || []).map((v) => `${v.user_id}|${v.hospital_id}`));
    }
    setRecentReports(withHospitalId.map((r) => ({ ...r, _verified: verifiedSet.has(`${r.user_id}|${r._hospitalId}`) })));
    setLoadingReports(false);
  }

  async function verifyFromReport(report) {
    if (!report._hospitalId) return;
    const { data: existing } = await supabase
      .from("hospital_verifications")
      .select("id")
      .eq("user_id", report.user_id)
      .eq("hospital_id", report._hospitalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      await supabase.from("hospital_verifications").update({ status: "verified" }).eq("id", existing.id);
    } else {
      await supabase.from("hospital_verifications").insert({ user_id: report.user_id, hospital_id: report._hospitalId, status: "verified", file_path: null });
    }
    setRecentReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, _verified: true } : r)));
  }

  async function handleSearch() {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("profiles").select("*").ilike("email", `%${query.trim()}%`).limit(20);
    setResults(data || []);
    setSearching(false);
  }

  async function applyBan(profileId, mode, days) {
    let update = {};
    if (mode === "permanent") update = { is_banned: true, banned_until: null };
    else if (mode === "temp") update = { is_banned: false, banned_until: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() };
    else if (mode === "unban") update = { is_banned: false, banned_until: null };
    await supabase.from("profiles").update(update).eq("id", profileId);
    setResults((prev) => prev.map((p) => (p.id === profileId ? { ...p, ...update } : p)));
  }

  async function handleDeleteReport(reportType, reportId) {
    const table = reportType === "hospital" ? "hospital_reviews" : "unit_reviews";
    await supabase.from(table).delete().eq("id", reportId);
    setRecentReports((prev) => prev.filter((r) => r.id !== reportId));
    setConfirmingId(null);
  }

  async function toggleShadowBan(profileId, current) {
    await supabase.from("profiles").update({ is_shadow_banned: !current }).eq("id", profileId);
    setResults((prev) => prev.map((p) => (p.id === profileId ? { ...p, is_shadow_banned: !current } : p)));
  }

  function banStatus(p) {
    if (p.is_banned) return { label: "Banned permanently", color: "#7A1313" };
    if (p.banned_until && new Date(p.banned_until) > new Date()) {
      return { label: `Temp banned until ${new Date(p.banned_until).toLocaleDateString()}`, color: "#7A5B00" };
    }
    return { label: "Active", color: "#0F5132" };
  }

  if (!isAdmin) {
    return (
      <StaticPage title="Admin" onBack={onBack}>
        <p>This page isn't available.</p>
      </StaticPage>
    );
  }

  if (selectedProfile) {
    return (
      <StaticPage title={selectedProfile.email} onBack={closeProfile}>
        <BanControls p={selectedProfile} banStatus={banStatus} onBan={(id, mode, days) => { applyBan(id, mode, days); setSelectedProfile((prev) => ({ ...prev, is_banned: mode === "permanent", banned_until: mode === "temp" ? new Date(Date.now() + days * 86400000).toISOString() : mode === "unban" ? null : prev.banned_until })); }} onShadowToggle={(id, cur) => { toggleShadowBan(id, cur); setSelectedProfile((prev) => ({ ...prev, is_shadow_banned: !cur })); }} />

        <div className="pt-4">
          <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Posts ({userPosts.length})</p>
          {loadingUserPosts && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Loading…</p>}
          {!loadingUserPosts && userPosts.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>No posts from this account.</p>}
          <div className="space-y-2">
            {userPosts.map((r) => (
              <div key={r.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
                <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>
                  {r._type === "hospital" ? r.hospitals?.name : r.units?.name}
                </div>
                <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">
                  {r._type === "hospital" ? r.hospitals?.city : r.units?.hospitals?.name} · {r.role} · {(r.created_at || "").slice(0, 10)}
                </div>
                <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }} className="mb-2">{r.comment}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {userConfirmingId === r.id ? (
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#7A1313" }}>Delete this report?</span>
                      <button onClick={() => handleDeleteUserPost(r._type, r.id)} className="text-[12px] font-bold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Yes</button>
                      <button onClick={() => setUserConfirmingId(null)} className="text-[12px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setUserConfirmingId(r.id)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Delete</button>
                  )}
                  {r._verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'", fontWeight: 700, fontSize: "11px" }}>
                      <ShieldCheck size={11} /> Verified
                    </span>
                  ) : (
                    <button onClick={() => verifyUserPost(r)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>Verify this account</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </StaticPage>
    );
  }

  return (
    <StaticPage title="Admin" onBack={onBack}>
      <div className="mb-2">
        <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Analytics</p>
        {loadingAnalytics && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Loading…</p>}
        {analytics && (
          <div className="rounded-2xl p-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
            <div className="grid grid-cols-4 gap-2 mb-1" style={{ fontFamily: "'Inter'", fontSize: "11px", fontWeight: 700, color: "#64809A" }}>
              <span></span><span className="text-center">24h</span><span className="text-center">7d</span><span className="text-center">30d</span>
            </div>
            <div className="grid grid-cols-4 gap-2 items-center py-2" style={{ borderTop: "1px solid #EEF4FA" }}>
              <span style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>New users</span>
              <span className="text-center" style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>{analytics.users1}</span>
              <span className="text-center" style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>{analytics.users7}</span>
              <span className="text-center" style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>{analytics.users30}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 items-center py-2" style={{ borderTop: "1px solid #EEF4FA" }}>
              <span style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>Site visits</span>
              <span className="text-center" style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>{analytics.visits1}</span>
              <span className="text-center" style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>{analytics.visits7}</span>
              <span className="text-center" style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>{analytics.visits30}</span>
            </div>
          </div>
        )}
        <p style={{ fontFamily: "'Inter'", fontSize: "11.5px", color: "#93A7B8" }} className="pt-1">"Site visits" counts each time the app loads, not unique people — someone visiting twice counts twice.</p>
      </div>

      <div className="pt-3">
        <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Recently deleted accounts ({deletionQueue.length})</p>
        {loadingDeletionQueue && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Loading…</p>}
        {!loadingDeletionQueue && deletionQueue.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Nothing waiting.</p>}
        <div className="space-y-2">
          {deletionQueue.map((p) => (
            <div key={p.id} className="rounded-xl p-3 flex items-center justify-between" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div>
                <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "13.5px", color: "#16324A" }}>{p.email}</div>
                <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>Requested {(p.deletion_requested_at || "").slice(0, 10)} — their content is already gone; just remove their login in Authentication → Users</div>
              </div>
              <button onClick={() => markDeletionHandled(p.id)} className="px-3 py-1 rounded-full text-[12px] font-semibold flex-shrink-0" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'" }}>
                Mark handled
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3">
        <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Search users</p>
        <div className="flex gap-2 mb-3">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email…" />
          <PrimaryButton onClick={handleSearch}>{searching ? "…" : "Search"}</PrimaryButton>
        </div>
        <div className="space-y-2">
          {results.map((p) => (
            <div key={p.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div className="flex items-center justify-between mb-1">
                <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "13.5px", color: "#16324A" }}>{p.email}</div>
                <button onClick={() => openProfile(p)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>View posts →</button>
              </div>
              <BanControls p={p} banStatus={banStatus} onBan={applyBan} onShadowToggle={toggleShadowBan} />
            </div>
          ))}
          {results.length === 0 && query && !searching && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>No accounts found.</p>}
        </div>
      </div>

      <div className="pt-5">
        <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Pending verifications ({pendingVerifications.length})</p>
        {loadingVerifications && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Loading…</p>}
        {!loadingVerifications && pendingVerifications.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Nothing waiting on review.</p>}
        <div className="space-y-2">
          {pendingVerifications.map((v) => (
            <div key={v.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>{v.hospitals?.name}</div>
              <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">{v.hospitals?.city} · requested by {v.email || "unknown"}</div>
              {(v.unit_name || v.unit_type) && (
                <div style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#33475A" }} className="mb-1">
                  Unit: {v.unit_name || "—"} {v.unit_type ? `(${v.unit_type})` : ""}
                </div>
              )}
              <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }} className="mb-2">Submitted {(v.created_at || "").slice(0, 10)}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => viewProof(v.file_path)} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#EAF3FB", color: "#16324A", fontFamily: "'Inter'" }}>
                  View proof
                </button>
                <button onClick={() => handleVerificationDecision(v.id, "verified")} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'" }}>
                  Approve
                </button>
                <button onClick={() => handleVerificationDecision(v.id, "rejected")} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#F8AFAF", color: "#7A1313", fontFamily: "'Inter'" }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-5">
        <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Flagged posts ({flaggedReports.length})</p>
        {loadingFlagged && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Loading…</p>}
        {!loadingFlagged && flaggedReports.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Nothing flagged.</p>}
        <div className="space-y-2">
          {flaggedReports.map((r) => (
            <div key={r.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>
                {r.post_type === "hospital" ? r.post?.hospitals?.name : r.post?.units?.name}
              </div>
              <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">
                {r.post_type === "hospital" ? r.post?.hospitals?.city : r.post?.units?.hospitals?.name} · reported by {r.reporterEmail || "unknown"}
              </div>
              <div style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#7A5B00", fontWeight: 600 }} className="mb-2">Reason: {r.reason}</div>
              {r.post ? (
                <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }} className="mb-2">{r.post.comment}</p>
              ) : (
                <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#93A7B8" }} className="mb-2">Post no longer exists.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => dismissFlag(r.id)} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#EAF3FB", color: "#16324A", fontFamily: "'Inter'" }}>
                  Dismiss
                </button>
                {r.post && (
                  <button onClick={() => deleteFlaggedPost(r)} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#F8AFAF", color: "#7A1313", fontFamily: "'Inter'" }}>
                    Delete post
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-5">
        <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-2">Recent reports</p>
        {loadingReports && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>Loading…</p>}
        <div className="space-y-2">
          {recentReports.map((r) => (
            <div key={r.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
              <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>
                {r._type === "hospital" ? r.hospitals?.name : r.units?.name}
              </div>
              <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">
                {r._type === "hospital" ? r.hospitals?.city : r.units?.hospitals?.name} · {r.role} · {(r.created_at || "").slice(0, 10)}
              </div>
              <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }} className="mb-2">{r.comment}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {confirmingId === r.id ? (
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#7A1313" }}>Delete this report?</span>
                    <button onClick={() => handleDeleteReport(r._type, r.id)} className="text-[12px] font-bold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Yes</button>
                    <button onClick={() => setConfirmingId(null)} className="text-[12px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingId(r.id)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Delete</button>
                )}
                {r._verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'", fontWeight: 700, fontSize: "11px" }}>
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : (
                  <button onClick={() => verifyFromReport(r)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>Verify this account</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaticPage>
  );
}

function GetVerifiedPage({ onBack, onGoBrowse, hospitals, user, onOpenSignIn, prefillHospital }) {
  const [query, setQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(prefillHospital || null);
  const [unitName, setUnitName] = useState("");
  const [unitType, setUnitType] = useState("");

  const matches = useMemo(() => {
    if (!query.trim() || selectedHospital) return [];
    const q = query.toLowerCase();
    return hospitals.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)).slice(0, 6);
  }, [query, hospitals, selectedHospital]);

  return (
    <StaticPage title="Get Verified" onBack={onBack}>
      <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 mb-1" style={{ background: "#EAF3FB" }}>
        <span style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>Here's what you'll get on your reports:</span>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "#A9F0CE", color: "#0F5132", fontFamily: "'Inter'", fontWeight: 700, fontSize: "12px" }}>
          <ShieldCheck size={13} /> Verified
        </span>
      </div>
      <p>A <strong>Verified</strong> badge tells other people your report is backed by real proof…not just a claim.</p>
      <p>Here's how it works: file a report on any hospital or unit, and right after you post it, you'll get the option to upload something showing you actually worked there! A badge photo, pay stub, or assignment letter.</p>
      <p>You can also get Verified by clicking "Get Verified" when looking at the menu options!</p>
      <p>It's reviewed privately and never shown publicly, only the green Verified badge shows up on your report once it's approved. After approval all verified reports are always filtered to the top to give us the most accurate data for that page.</p>

      {!user ? (
        <PrimaryButton onClick={onOpenSignIn}>Sign in to get started</PrimaryButton>
      ) : (
        <div className="pt-2 space-y-3">
          <p style={{ fontWeight: 700, color: "#16324A" }} className="mb-1">Verify a hospital</p>

          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Hospital</label>
            {selectedHospital ? (
              <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ border: "1px solid #D7E6F3", background: "#EAF3FB" }}>
                <div>
                  <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "13.5px", color: "#16324A" }}>{selectedHospital.name}</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{selectedHospital.city}</div>
                </div>
                <button onClick={() => setSelectedHospital(null)} className="text-[12.5px] font-semibold" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Delete</button>
              </div>
            ) : (
              <div>
                <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type your hospital's name…" />
                {matches.length > 0 && (
                  <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid #D7E6F3" }}>
                    {matches.map((h) => (
                      <button key={h.id} onClick={() => { setSelectedHospital(h); setQuery(""); }} className="w-full text-left px-3.5 py-2.5" style={{ background: "#FFFFFF", borderTop: "1px solid #EEF4FA" }}>
                        <div style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "13.5px", color: "#16324A" }}>{h.name}</div>
                        <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }}>{h.city}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Unit name</label>
            <TextInput value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="e.g. Medical ICU" />
          </div>
          <div>
            <label className="block text-[13px] mb-1 font-medium" style={{ fontFamily: "'Inter'", color: "#16324A" }}>Unit type</label>
            <TextInput value={unitType} onChange={(e) => setUnitType(e.target.value)} placeholder="e.g. ICU, Med-Surg, Emergency" />
          </div>

          <div className="pt-1">
            <HospitalVerifyPanel user={user} hospitalId={selectedHospital?.id} hospitalName={selectedHospital?.name || "your hospital"} unitName={unitName} unitType={unitType} onOpenSignIn={onOpenSignIn} embedded submitLabel="Submit Verification" />
          </div>
        </div>
      )}

    </StaticPage>
  );
}
function TermsPage({ onBack }) {
  return (
    <StaticPage title="Terms of Service" onBack={onBack}>
      <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }}>Effective August 2026</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>1. What this is</p>
      <p>Rate My Unit lets healthcare workers rate and review the hospitals and specific units where they've worked, and helps job seekers see that feedback before accepting a position. By creating an account or using this site, you agree to these terms.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>2. Who can use this</p>
      <p>You must be at least 18 years old and able to enter a binding agreement to create an account. You're responsible for keeping your password secure and for anything that happens under your account.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>3. What you post</p>
      <p>Reviews should reflect your own genuine experience working at a specific hospital or unit. You agree not to:</p>
      <ul style={{ paddingLeft: "20px", listStyle: "disc" }}>
        <li>Name or identify specific coworkers, managers, or patients</li>
        <li>Post anything false, defamatory, or written to harass a particular person</li>
        <li>Post any patient health information, even anonymized details that could identify someone</li>
        <li>Use profanity, hate speech, or threats</li>
        <li>Post content you don't have the right to share, or that infringes someone else's rights</li>
        <li>Create multiple accounts to post duplicate or misleading reviews</li>
        <li>Scrape, copy, or republish the site's content without permission</li>
      </ul>
      <p>We can remove any post, at any time, for any reason, including posts that don't break these rules but that we decide don't serve the site's purpose.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>4. Verification</p>
      <p>You can optionally submit proof of employment — a badge photo, pay stub, or similar document — to have your reports marked Verified for a specific hospital. These documents are reviewed by our team, are never shown publicly, and are not shared with your employer or anyone else outside our review process. Submitting false verification documents will result in account termination.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>5. Enforcement</p>
      <p>We can suspend, limit, or permanently ban any account for violating these terms or for conduct we determine is harmful to the site or its users. We don't owe advance notice or an explanation before doing so.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>6. No employment or legal advice</p>
      <p>Nothing on this site is professional legal, tax, financial, or career advice. Ratings, calculators — including the GSA per diem and income tools — and reviews are informational estimates based on user submissions and public data; they may be inaccurate, outdated, or incomplete. Confirm anything important directly with the relevant employer or agency before relying on it.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>7. Content ownership</p>
      <p>You keep ownership of what you post, but by posting it you give us a permanent, worldwide, royalty-free license to display and use it as part of the site, including in aggregate or summarized form. We can keep and display content after you delete your account, since reviews are already posted anonymously and aren't tied to your identity for other users.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>8. Disclaimers</p>
      <p>The site is provided as-is. We don't guarantee reviews are accurate, complete, or unbiased — they reflect individual opinions, not verified facts about any hospital, except where explicitly marked Verified, which only confirms employment, not the accuracy of the opinions themselves.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>9. Limitation of liability</p>
      <p>To the extent allowed by law, we aren't liable for indirect, incidental, or consequential damages arising from your use of the site. Our total liability for any claim is limited to the amount you've paid us in the past 12 months, which for most users is $0.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>10. Changes</p>
      <p>We can update these terms as the site evolves. Continued use after a change means you accept the new terms.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>11. Contact</p>
      <p>Questions about these terms: <a href="mailto:support@ratemyunit.org" style={{ color: "#3E8EDE" }}>support@ratemyunit.org</a></p>
    </StaticPage>
  );
}

function PrivacyPage({ onBack }) {
  return (
    <StaticPage title="Privacy Policy" onBack={onBack}>
      <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }}>Effective August 2026</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>1. What we collect</p>
      <ul style={{ paddingLeft: "20px", listStyle: "disc" }}>
        <li>Account info: your email address and password — we never see or store your actual password, only an encrypted hash</li>
        <li>Content you post: reviews, ratings, comments, and any hospital or unit info you add</li>
        <li>Verification documents, if you choose to submit proof of employment</li>
        <li>Basic, anonymous usage data — page visits and general activity, tracked through Vercel Analytics and our own internal counter</li>
      </ul>

      <p style={{ fontWeight: 700, color: "#16324A" }}>2. What we don't collect</p>
      <p>We don't ask for your real name, home address, phone number, or Social Security number. We don't track your location. We don't sell your data — there's no ad network or data broker relationship on this site.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>3. How we use it</p>
      <ul style={{ paddingLeft: "20px", listStyle: "disc" }}>
        <li>To create and manage your account, and let you sign in</li>
        <li>To display your reviews anonymously — your email is never shown to other users</li>
        <li>To review verification requests</li>
        <li>To improve the site and understand basic usage patterns</li>
        <li>To enforce our Terms of Service, including investigating reports and applying bans when needed</li>
      </ul>

      <p style={{ fontWeight: 700, color: "#16324A" }}>4. Who can see what</p>
      <p>Other users see your posted reviews and your role or shift description, but never your email or identity. Verification documents are visible only to our admin team, for the purpose of approving or rejecting the request. We don't share your email, verification documents, or account activity with your employer or anyone else, except if legally required to — for example, a valid court order.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>5. Where your data lives</p>
      <p>Your account and content are stored with Supabase, a third-party database provider, hosted in the United States. Verification files sit in a private, access-controlled storage bucket that only our admin account can read.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>6. Your choices</p>
      <p>You can delete any review you've posted at any time, from the review itself or from your account page. You can request full account deletion by emailing <a href="mailto:support@ratemyunit.org" style={{ color: "#3E8EDE" }}>support@ratemyunit.org</a> — we'll remove your account and personal information, though anonymized review content may remain, since it was never tied to your identity for other users in the first place.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>7. Local storage</p>
      <p>We use your browser's local storage to keep you signed in between visits. We don't use tracking cookies for advertising.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>8. Children</p>
      <p>This site isn't intended for anyone under 18.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>9. Changes to this policy</p>
      <p>If this policy changes in a meaningful way, we'll update the effective date above.</p>

      <p style={{ fontWeight: 700, color: "#16324A" }}>10. Contact</p>
      <p>Questions about your data: <a href="mailto:support@ratemyunit.org" style={{ color: "#3E8EDE" }}>support@ratemyunit.org</a></p>
    </StaticPage>
  );
}

function AboutPage({ onBack }) {
  return (
    <StaticPage title="What's the goal?" onBack={onBack}>
      <p>Taking a hospital job is a big decision, and most people go in blind. Recruiters and hospital marketing tell you what the unit is like…but the people who actually know are the ones already working the floor.</p>
      <p><strong>Rate My Unit</strong> gives nurses, techs, and other staff a place to report what a specific unit is really like: staffing ratios, management, culture, and pay. The four things that can make or break a job. It also lets you rate the hospital as a whole, separately from units… on things like safety, reputation, facilities, food, etc.</p>
      <p><strong>The goal is simple:</strong> before you take your next big opportunity, you should be able to see what people who've actually worked there have to say.</p>
    </StaticPage>
  );
}
function HelpPage({ onBack }) {
  const faqs = [
    ["How do I post a report?", "Sign in with your email at the top of the page, then open any unit or hospital and click \"File a report\" or \"Rate this hospital.\""],
    ["Is my identity shown?", "No. Your email is used only to sign you in and is never displayed on your review or shared with anyone, including the hospital."],
    ["What does \"Helpful?\" do?", "Thumbs up or down on any report to signal whether it was useful. You can sort reports by \"Most helpful\" to surface the best ones first."],
    ["What does \"Get Verified\" mean?", "Getting Verified helps people know you are a verified employee of a particular hospital. All verified accounts are always filtered to the top of reports to give the most accurate information."],
    ["Can I add a hospital or unit that's missing?", "Yes, use the \"Add a unit\" button in the header or the links on the search pages."],
  ];
  return (
    <StaticPage title="Help" onBack={onBack}>
      {faqs.map(([q, a], i) => (
        <div key={i}><p style={{ fontWeight: 700, color: "#16324A" }}>{q}</p><p>{a}</p></div>
      ))}
    </StaticPage>
  );
}
function ContactPage({ onBack }) {
  return (
    <StaticPage title="Contact us" onBack={onBack}>
      <p>Questions, feedback, or something not working right? Reach us directly at:</p>
      <a href="mailto:support@ratemyunit.org" className="inline-block" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.05rem", color: "#3E8EDE" }}>support@ratemyunit.org</a>
    </StaticPage>
  );
}
function DeleteAccountSection({ onDeleteAccount }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDeleteAccount();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-[13px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Delete my account</button>;
  }

  return (
    <div className="rounded-xl p-4 mt-2" style={{ border: "1px solid #F8AFAF", background: "#FFFFFF" }}>
      <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }} className="mb-2">
        This permanently deletes every report, vote, and verification request tied to your account, and signs you out.
      </p>
      <p style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#93A7B8" }} className="mb-3">
        Note: your login itself (email) can't be fully removed automatically. If you'd also like that gone, email support@ratemyunit.org after this and we'll take care of it.
      </p>
      {!confirming ? (
        <div className="flex gap-2">
          <button onClick={() => setConfirming(true)} className="px-4 py-2 rounded-xl text-sm text-white font-semibold" style={{ background: "#7A1313", fontFamily: "'Inter'" }}>Delete my account</button>
          <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#7A1313", fontWeight: 600 }}>Are you sure?</span>
          <button onClick={handleDelete} className="text-[13px] font-bold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>{deleting ? "Deleting…" : "Yes, delete everything"}</button>
          <button onClick={() => setConfirming(false)} className="text-[13px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords don't match."); return; }
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (err) setError(err.message);
    else {
      setSuccess(true);
      setNewPassword("");
      setConfirm("");
    }
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-[13px] font-semibold" style={{ fontFamily: "'Inter'", color: "#3E8EDE" }}>Change password</button>;
  }

  return (
    <div className="rounded-xl p-4 mt-2" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      {success ? (
        <p style={{ color: "#0F5132", fontWeight: 600, fontFamily: "'Inter'", fontSize: "13.5px" }}>✓ Password updated.</p>
      ) : (
        <div className="space-y-3">
          <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (6+ characters)" />
          <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
          {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
          <div className="flex gap-2">
            <PrimaryButton onClick={handleSubmit}>{submitting ? "Updating…" : "Update password"}</PrimaryButton>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountPage({ onBack, user, onOpenSignIn, onGoToHospital, onGoToUnit, onDeleteReview, onDeleteAccount }) {
  const [myHospitalReviews, setMyHospitalReviews] = useState([]);
  const [myUnitReviews, setMyUnitReviews] = useState([]);
  const [likedReports, setLikedReports] = useState([]);
  const [dislikedReports, setDislikedReports] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    if (!user) { setLoadingMine(false); return; }
    async function load() {
      setLoadingMine(true);
      const { data: hData } = await supabase
        .from("hospital_reviews")
        .select("*, hospitals(id, name, city)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const { data: uData } = await supabase
        .from("unit_reviews")
        .select("*, units(id, name, floor, type, hospital_id, hospitals(id, name, city))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyHospitalReviews(hData || []);
      setMyUnitReviews(uData || []);

      const { data: votes } = await supabase
        .from("review_votes")
        .select("review_id, review_type, vote")
        .eq("user_id", user.id);
      const hospitalIds = (votes || []).filter((v) => v.review_type === "hospital").map((v) => v.review_id);
      const unitIds = (votes || []).filter((v) => v.review_type === "unit").map((v) => v.review_id);
      const voteMap = Object.fromEntries((votes || []).map((v) => [v.review_id, v.vote]));

      let votedHospitalReviews = [];
      let votedUnitReviews = [];
      if (hospitalIds.length) {
        const { data } = await supabase.from("hospital_reviews").select("*, hospitals(id, name, city)").in("id", hospitalIds);
        votedHospitalReviews = (data || []).map((r) => ({ ...r, _type: "hospital" }));
      }
      if (unitIds.length) {
        const { data } = await supabase.from("unit_reviews").select("*, units(id, name, floor, type, hospital_id, hospitals(id, name, city))").in("id", unitIds);
        votedUnitReviews = (data || []).map((r) => ({ ...r, _type: "unit" }));
      }
      const allVoted = [...votedHospitalReviews, ...votedUnitReviews];
      setLikedReports(allVoted.filter((r) => voteMap[r.id] === "up"));
      setDislikedReports(allVoted.filter((r) => voteMap[r.id] === "down"));

      setLoadingMine(false);
    }
    load();
  }, [user]);

  async function handleDelete(reviewType, reviewId) {
    await onDeleteReview(reviewType, reviewId);
    if (reviewType === "hospital") setMyHospitalReviews((prev) => prev.filter((r) => r.id !== reviewId));
    else setMyUnitReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setConfirmingId(null);
  }

  if (!user) {
    return (
      <StaticPage title="My Account" onBack={onBack}>
        <p>Sign in to create your account and see the reports you've posted, all in one place.</p>
        <PrimaryButton onClick={onOpenSignIn}>Sign in</PrimaryButton>
      </StaticPage>
    );
  }

  return (
    <StaticPage title="My Account" onBack={onBack}>
      <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }}>Signed in as <strong>{user.email}</strong></p>
      <div className="pt-1"><ChangePasswordForm /></div>
      <div className="pt-2"><DeleteAccountSection onDeleteAccount={onDeleteAccount} /></div>

      {loadingMine && <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#64809A" }} className="pt-2">Loading your reports…</p>}

      {!loadingMine && (
        <>
          <div className="pt-3">
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1rem", color: "#16324A" }} className="mb-2">Hospital reports ({myHospitalReviews.length})</h2>
            {myHospitalReviews.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>You haven't rated any hospitals yet.</p>}
            <div className="space-y-2">
              {myHospitalReviews.map((r) => (
                <div key={r.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
                  <button onClick={() => onGoToHospital(r.hospitals)} className="w-full text-left">
                    <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>{r.hospitals?.name}</div>
                    <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">{r.hospitals?.city} · {(r.created_at || "").slice(0, 10)}</div>
                    <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>{r.comment}</p>
                  </button>
                  <div className="pt-2 flex justify-end">
                    {confirmingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#7A1313" }}>Delete this report?</span>
                        <button onClick={() => handleDelete("hospital", r.id)} className="text-[12px] font-bold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Yes</button>
                        <button onClick={() => setConfirmingId(null)} className="text-[12px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmingId(r.id)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1rem", color: "#16324A" }} className="mb-2">Unit reports ({myUnitReviews.length})</h2>
            {myUnitReviews.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>You haven't rated any units yet.</p>}
            <div className="space-y-2">
              {myUnitReviews.map((r) => (
                <div key={r.id} className="rounded-xl p-3" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
                  <button onClick={() => onGoToUnit(r.units?.hospitals, r.units)} className="w-full text-left">
                    <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>{r.units?.name}</div>
                    <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">{r.units?.hospitals?.name} · {(r.created_at || "").slice(0, 10)}</div>
                    <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>{r.comment}</p>
                  </button>
                  <div className="pt-2 flex justify-end">
                    {confirmingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#7A1313" }}>Delete this report?</span>
                        <button onClick={() => handleDelete("unit", r.id)} className="text-[12px] font-bold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Yes</button>
                        <button onClick={() => setConfirmingId(null)} className="text-[12px]" style={{ fontFamily: "'Inter'", color: "#64809A" }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmingId(r.id)} className="text-[12px] font-semibold" style={{ fontFamily: "'Inter'", color: "#7A1313" }}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1rem", color: "#16324A" }} className="mb-2">Liked reports ({likedReports.length})</h2>
            {likedReports.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>You haven't liked any reports yet.</p>}
            <div className="space-y-2">
              {likedReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => r._type === "hospital" ? onGoToHospital(r.hospitals) : onGoToUnit(r.units?.hospitals, r.units)}
                  className="w-full text-left rounded-xl p-3"
                  style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}
                >
                  <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>{r._type === "hospital" ? r.hospitals?.name : r.units?.name}</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">{r._type === "hospital" ? r.hospitals?.city : r.units?.hospitals?.name} · {(r.created_at || "").slice(0, 10)}</div>
                  <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>{r.comment}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1rem", color: "#16324A" }} className="mb-2">Disliked reports ({dislikedReports.length})</h2>
            {dislikedReports.length === 0 && <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#64809A" }}>You haven't disliked any reports yet.</p>}
            <div className="space-y-2">
              {dislikedReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => r._type === "hospital" ? onGoToHospital(r.hospitals) : onGoToUnit(r.units?.hospitals, r.units)}
                  className="w-full text-left rounded-xl p-3"
                  style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}
                >
                  <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#16324A" }}>{r._type === "hospital" ? r.hospitals?.name : r.units?.name}</div>
                  <div style={{ fontFamily: "'Inter'", fontSize: "12px", color: "#64809A" }} className="mb-1">{r._type === "hospital" ? r.hospitals?.city : r.units?.hospitals?.name} · {(r.created_at || "").slice(0, 10)}</div>
                  <p style={{ fontFamily: "'Inter'", fontSize: "13px", color: "#33475A" }}>{r.comment}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </StaticPage>
  );
}

function SideMenu({ open, onClose, onNavigate, user }) {
  const items = [
    { key: "home", label: "Browse Hospitals" }, { key: "allUnits", label: "Browse Units" },
    { key: "account", label: "My Account" }, { key: "getVerified", label: "Get Verified" },
    { key: "gsaCalculator", label: "GSA Calculator" },
    { key: "incomeCalculator", label: "Income Calculator" },
    { key: "about", label: "What's the goal?" },
    { key: "help", label: "Help" }, { key: "contact", label: "Contact Us" },
    { key: "terms", label: "Terms of Service" }, { key: "privacy", label: "Privacy Policy" },
  ];
  if (user && user.id === ADMIN_USER_ID) items.push({ key: "admin", label: "Admin" });
  if (!open) return null;
  return (
    <div className="fixed inset-0" style={{ zIndex: 50 }}>
      <div className="absolute inset-0" style={{ background: "rgba(22,50,74,0.35)" }} onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-72 p-5" style={{ background: "#FFFFFF", boxShadow: "-4px 0 24px rgba(22,50,74,0.15)" }}>
        <div className="flex items-center justify-between mb-6">
          <span style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }}>Menu</span>
          <button onClick={onClose}><X size={20} color="#64809A" /></button>
        </div>
        <div className="flex flex-col gap-1">
          {items.map((it) => (
            <button key={it.key} onClick={() => onNavigate(it.key)} className="text-left px-3 py-3 rounded-xl flex items-center gap-2" style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: "14.5px", color: "#16324A" }}>
              {it.label}
              {it.key === "getVerified" && <ShieldCheck size={15} color="#0F9D6A" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetNewPasswordPanel({ onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords don't match."); return; }
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (err) setError(err.message);
    else setSuccess(true);
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 70 }}>
      <div className="absolute inset-0" style={{ background: "rgba(22,50,74,0.45)" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl p-5" style={{ background: "#FFFFFF" }}>
        <span style={{ fontFamily: "'Poppins'", fontWeight: 700, color: "#16324A" }} className="block mb-3">Set a new password</span>
        {success ? (
          <div>
            <p style={{ color: "#0F5132", fontWeight: 600, fontFamily: "'Inter'", fontSize: "13.5px" }} className="mb-4">✓ Password updated. You're signed in.</p>
            <PrimaryButton onClick={onDone}>OK</PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (6+ characters)" />
            <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
            {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
            <PrimaryButton onClick={handleSubmit}>{submitting ? "Updating…" : "Update password"}</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ page: "home" });
  const [userVotes, setUserVotes] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  async function fetchHospitals() {
    const { data, error } = await supabase
      .from("hospitals")
      .select("*, units(*, unit_reviews(*)), hospital_reviews(*)")
      .order("name");
    const { data: verifiedPairs } = await supabase
      .from("hospital_verifications")
      .select("user_id, hospital_id")
      .eq("status", "verified");
    const verifiedSet = new Set((verifiedPairs || []).map((v) => `${v.user_id}|${v.hospital_id}`));

    const { data: shadowRows } = await supabase.from("profiles").select("id").eq("is_shadow_banned", true);
    const shadowSet = new Set((shadowRows || []).map((p) => p.id));
    const viewerId = user?.id;
    const visibleToMe = (r) => !shadowSet.has(r.user_id) || r.user_id === viewerId;

    if (!error) {
      const withVerified = (data || []).map((h) => ({
        ...h,
        hospital_reviews: (h.hospital_reviews || []).filter(visibleToMe).map((r) => ({ ...r, verified: verifiedSet.has(`${r.user_id}|${h.id}`) })),
        units: (h.units || []).map((u) => ({ ...u, unit_reviews: (u.unit_reviews || []).filter(visibleToMe).map((r) => ({ ...r, verified: verifiedSet.has(`${r.user_id}|${h.id}`) })) })),
      }));
      setHospitals(withVerified);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHospitals();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    supabase.from("page_views").insert({}).then(() => {});
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [user?.id]);

  async function addUnitReview(unitId, review) {
    const { data, error } = await supabase.from("unit_reviews").insert({ unit_id: unitId, user_id: user.id, ...review }).select().single();
    await fetchHospitals();
    return { id: data?.id, error };
  }
  async function addHospitalReview(hospitalId, review) {
    const { data, error } = await supabase.from("hospital_reviews").insert({ hospital_id: hospitalId, user_id: user.id, ...review }).select().single();
    await fetchHospitals();
    return { id: data?.id, error };
  }
  async function deleteReview(reviewType, reviewId) {
    const table = reviewType === "hospital" ? "hospital_reviews" : "unit_reviews";
    await supabase.from(table).delete().eq("id", reviewId);
    await fetchHospitals();
  }
  async function deleteMyAccount() {
    await supabase.from("hospital_reviews").delete().eq("user_id", user.id);
    await supabase.from("unit_reviews").delete().eq("user_id", user.id);
    await supabase.from("review_votes").delete().eq("user_id", user.id);
    await supabase.from("hospital_verifications").delete().eq("user_id", user.id);
    await supabase.rpc("request_account_deletion");
    await fetchHospitals();
    await supabase.auth.signOut();
    setView({ page: "home" });
  }
  async function reportPost(postType, postId, reason) {
    if (!user) return;
    await supabase.from("reports").insert({ post_id: postId, post_type: postType, reporter_id: user.id, reason });
  }
  async function addUnit(payload) {
    let hospitalMeta = payload.hospitalMeta;
    let hospitalId = payload.hospitalId;
    if (!hospitalId) {
      const { data: newH } = await supabase.from("hospitals").insert(payload.newHospital).select().single();
      hospitalId = newH.id;
      hospitalMeta = { id: newH.id, name: newH.name, city: newH.city };
    }
    const { data: newUnit } = await supabase.from("units").insert({ hospital_id: hospitalId, ...payload.unit }).select().single();
    await fetchHospitals();
    return { hospital: hospitalMeta, unit: newUnit };
  }
  async function castVote(reviewType, reviewId, dir) {
    if (!user) { setSignInOpen(true); return; }
    const { data: existing } = await supabase.from("review_votes").select("*").eq("review_id", reviewId).eq("user_id", user.id).maybeSingle();
    let deltaUp = 0, deltaDown = 0, newVote = dir;
    if (existing && existing.vote === dir) {
      await supabase.from("review_votes").delete().eq("id", existing.id);
      if (dir === "up") deltaUp = -1; else deltaDown = -1;
      newVote = null;
    } else if (existing) {
      await supabase.from("review_votes").update({ vote: dir }).eq("id", existing.id);
      if (dir === "up") { deltaUp = 1; deltaDown = -1; } else { deltaDown = 1; deltaUp = -1; }
    } else {
      await supabase.from("review_votes").insert({ review_id: reviewId, review_type: reviewType, user_id: user.id, vote: dir });
      if (dir === "up") deltaUp = 1; else deltaDown = 1;
    }
    const table = reviewType === "hospital" ? "hospital_reviews" : "unit_reviews";
    const { data: current } = await supabase.from(table).select("helpful_up, helpful_down").eq("id", reviewId).single();
    await supabase.from(table).update({
      helpful_up: Math.max(0, (current?.helpful_up || 0) + deltaUp),
      helpful_down: Math.max(0, (current?.helpful_down || 0) + deltaDown),
    }).eq("id", reviewId);
    setUserVotes((v) => ({ ...v, [reviewId]: newVote }));
    fetchHospitals();
  }
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleMenuNavigate(key) {
    setView((prev) => ({ page: key, from: prev }));
    setMenuOpen(false);
  }

  if (loading) {
    return <div style={{ background: "#EAF3FB", minHeight: "100vh" }} className="flex items-center justify-center">
      <style>{FONT_IMPORT}</style>
      <p style={{ fontFamily: "'Inter'", color: "#64809A" }}>Loading…</p>
    </div>;
  }

  return (
    <div style={{ background: "#EAF3FB", minHeight: "100vh" }}>
      <style>{FONT_IMPORT}</style>
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #D7E6F3" }}>
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between flex-nowrap gap-2">
          <button onClick={() => setView({ page: "home" })} style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "1.2rem", color: "#16324A", flexShrink: 0 }}>
            Rate My <span style={{ color: "#3E8EDE" }}>Unit</span>
          </button>
          <div className="flex items-center flex-shrink-0 gap-3" style={{ marginLeft: "auto" }}>
            <AuthBar user={user} onOpenSignIn={() => setSignInOpen(true)} onSignOut={handleSignOut} />
            <button onClick={() => setView({ page: "addUnit", from: view })} className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] text-white font-semibold" style={{ background: "#0F9D6A", fontFamily: "'Inter'" }}><Plus size={14} /> Add a unit</button>
            <button onClick={() => setMenuOpen(true)} className="flex items-center justify-center rounded-full" style={{ width: 38, height: 38, background: "#EAF3FB" }} aria-label="Open menu"><Menu size={19} color="#16324A" /></button>
          </div>
        </div>
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={handleMenuNavigate} user={user} />
      {signInOpen && <AuthPanel onClose={() => setSignInOpen(false)} />}
      {recoveryMode && <SetNewPasswordPanel onDone={() => setRecoveryMode(false)} />}

      <main className="max-w-2xl mx-auto px-5 py-8">
        {view.page === "home" && <HomeView hospitals={hospitals} onSelectHospital={(h) => setView({ page: "hospital", hospital: h })} onOpenAddUnit={() => setView({ page: "addUnit", from: view })} />}
        {view.page === "allUnits" && <AllUnitsView hospitals={hospitals} onSelectUnit={(h, u) => setView({ page: "unit", hospital: h, unit: u, from: view })} onOpenAddUnit={() => setView({ page: "addUnit", from: view })} />}

        {view.page === "hospital" && (
          <HospitalView
            hospital={hospitals.find((h) => h.id === view.hospital.id)}
            onBack={() => setView({ page: "home" })}
            onSelectUnit={(u) => setView({ page: "unit", hospital: view.hospital, unit: u, from: view })}
            onAddReview={addHospitalReview}
            onDeleteReview={deleteReview}
            onReportPost={reportPost}
            onVote={castVote}
            userVotes={userVotes}
            onCompare={() => setView({ page: "compare", type: "hospital", base: hospitals.find((h) => h.id === view.hospital.id), from: view })}
            onOpenAddUnit={() => setView({ page: "addUnit", from: view })}
            onGetVerified={(h) => setView({ page: "getVerified", prefillHospital: h, from: view })}
            user={user}
            onOpenSignIn={() => setSignInOpen(true)}
          />
        )}

        {view.page === "unit" && (
          <UnitView
            hospital={view.hospital}
            unit={hospitals.find((h) => h.id === view.hospital.id).units.find((u) => u.id === view.unit.id)}
            onBack={() => setView(view.from || { page: "hospital", hospital: view.hospital })}
            onBackToHospital={() => setView({ page: "hospital", hospital: view.hospital })}
            onAddReview={addUnitReview}
            onDeleteReview={deleteReview}
            onReportPost={reportPost}
            onVote={castVote}
            userVotes={userVotes}
            user={user}
            onOpenSignIn={() => setSignInOpen(true)}
            autoOpenReview={view.autoOpenReview}
            onGetVerified={(h) => setView({ page: "getVerified", prefillHospital: h, from: view })}
            onCompare={() => setView({
              page: "compare", type: "unit",
              base: { ...hospitals.find((h) => h.id === view.hospital.id).units.find((u) => u.id === view.unit.id), hospitalName: view.hospital.name, hospitalCity: view.hospital.city },
              from: view,
            })}
          />
        )}

        {view.page === "compare" && <CompareView type={view.type} base={view.base} hospitals={hospitals} onBack={() => setView(view.from || { page: "home" })} />}

        {view.page === "addUnit" && (
          <div>
            <button onClick={() => setView(view.from || { page: "home" })} className="flex items-center gap-1.5 text-[13px] mb-4 font-medium" style={{ fontFamily: "'Inter'", color: "#64809A" }}><ArrowLeft size={15} /> Back</button>
            <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.5rem", color: "#16324A" }} className="mb-4">Add a unit</h1>
            <AddUnitForm hospitals={hospitals} user={user} onOpenSignIn={() => setSignInOpen(true)} onCancel={() => setView(view.from || { page: "home" })} onSubmit={async (payload) => {
              const result = await addUnit(payload);
              setView({ page: "unit", hospital: result.hospital, unit: result.unit, autoOpenReview: true });
            }} />
          </div>
        )}

        {view.page === "getVerified" && <GetVerifiedPage onBack={() => setView(view.from || { page: "home" })} onGoBrowse={() => setView({ page: "home" })} hospitals={hospitals} user={user} onOpenSignIn={() => setSignInOpen(true)} prefillHospital={view.prefillHospital} />}
        {view.page === "admin" && <AdminPage onBack={() => setView(view.from || { page: "home" })} user={user} />}
        {view.page === "gsaCalculator" && <GsaCalculatorPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "incomeCalculator" && <IncomeCalculatorPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "about" && <AboutPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "help" && <HelpPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "contact" && <ContactPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "terms" && <TermsPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "privacy" && <PrivacyPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "account" && (
          <AccountPage
            onBack={() => setView(view.from || { page: "home" })}
            user={user}
            onOpenSignIn={() => setSignInOpen(true)}
            onGoToHospital={(h) => setView({ page: "hospital", hospital: h })}
            onGoToUnit={(h, u) => setView({ page: "unit", hospital: h, unit: u, from: { page: "account" } })}
            onDeleteReview={deleteReview}
            onDeleteAccount={deleteMyAccount}
          />
        )}
      </main>
    </div>
  );
}
