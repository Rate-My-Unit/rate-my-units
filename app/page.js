"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck, MapPin, Smile, Building2, Wifi, Star, Stethoscope, PartyPopper,
  UtensilsCrossed, Users, Briefcase, Heart, DollarSign, ThumbsUp, ThumbsDown,
  Search, Plus, ArrowLeft, ArrowLeftRight, Menu, X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

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
  if (score >= 3.8) return "#A9F0CE";
  if (score >= 3.0) return "#FCE985";
  return "#F8AFAF";
}
function scoreTextColor(score) {
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
function ReviewCard({ review, categories, userVote, onVote, currentUserId, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const isMine = currentUserId && review.user_id === currentUserId;
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
      </div>
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
    setError("");
    setSubmitting(true);
    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setCheckEmail(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
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
            {error && <p style={{ color: "#B23A34", fontSize: "12.5px", fontFamily: "'Inter'" }}>{error}</p>}
            <PrimaryButton onClick={handleSubmit}>{submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</PrimaryButton>
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

function ReviewForm({ categories, reviewType, onSubmit, onCancel, onDone, rolePlaceholder, user, onOpenSignIn }) {
  const [role, setRole] = useState("");
  const [ratings, setRatings] = useState(Object.fromEntries(categories.map((c) => [c.key, 0])));
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [newReviewId, setNewReviewId] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    const id = await onSubmit({ role: role.trim(), comment: comment.trim(), ...ratings });
    setSubmitting(false);
    if (id) { setNewReviewId(id); setStep("verify"); } else { onDone(); }
  }

  async function handleUploadProof() {
    if (!file) { onDone(); return; }
    setUploading(true);
    const path = `${user.id}/${reviewType}-${newReviewId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("verification-proof").upload(path, file);
    if (!upErr) {
      await supabase.from("verifications").insert({ review_id: newReviewId, review_type: reviewType, user_id: user.id, file_path: path });
    }
    setUploading(false);
    onDone();
  }

  if (step === "verify") {
    return (
      <div className="rounded-2xl p-5 mt-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
        <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "'Inter'", color: "#0F9D6A" }}>✓ Report posted</div>
        <p style={{ fontFamily: "'Inter'", fontSize: "13.5px", color: "#33475A" }} className="mb-3">
          Want a <strong>Verified</strong> badge on your report? Upload something showing you worked there! A badge photo, pay stub, or assignment letter. It's reviewed privately and never shown publicly.
        </p>
        <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm mb-3" style={{ fontFamily: "'Inter'", color: "#33475A" }} />
        <div className="flex gap-2">
          <PrimaryButton onClick={handleUploadProof} color="#0F9D6A">{uploading ? "Uploading…" : file ? "Submit proof" : "Skip for now"}</PrimaryButton>
          {file && <GhostButton onClick={onDone}>Skip</GhostButton>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mt-4" style={{ border: "1px solid #D7E6F3", background: "#FFFFFF" }}>
      <div className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "'Inter'", color: "#64809A" }}>File your report</div>
      <div className="rounded-xl px-3.5 py-2.5 mb-4" style={{ background: "#FCE985" }}>
        <p style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#5A4300", lineHeight: 1.5 }}>
          Keep it respectful and anonymous — don't name any specific coworkers, managers, or patients, and no profanity. Accounts that don't follow this get banned.
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
                <button onClick={() => { setHospitalMode("new"); setQuery(""); setError(""); }} className="px-3 rounded-xl text-[12.5px] font-semibold flex-shrink-0" style={{ fontFamily: "'Inter'", color: "#0F9D6A", border: "1px solid #0F9D6A" }}>+ New hospital</button>
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

function UnitView({ hospital, unit, onBack, onBackToHospital, onAddReview, onDeleteReview, onVote, userVotes, onCompare, user, onOpenSignIn, autoOpenReview }) {
  const [showForm, setShowForm] = useState(!!autoOpenReview);
  const [reviewSort, setReviewSort] = useState("newest");

  const reviews = unit.unit_reviews || [];
  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (reviewSort === "helpful") arr.sort((a, b) => helpfulScore(b) - helpfulScore(a));
    else arr.reverse();
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
          <span style={{ fontFamily: "'Inter'", fontSize: "12.5px", color: "#0F5132", fontWeight: 500 }}>Worked here? File a report to get Verified.</span>
        </div>
        {!showForm && <button onClick={() => setShowForm(true)} className="text-[12.5px] font-bold flex-shrink-0" style={{ fontFamily: "'Inter'", color: "#0F5132" }}>Get Verified</button>}
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

      {showForm && <ReviewForm categories={UNIT_CATEGORIES} reviewType="unit" rolePlaceholder="e.g. RN, Nights" user={user} onOpenSignIn={onOpenSignIn} onCancel={() => setShowForm(false)} onSubmit={(rev) => onAddReview(unit.id, rev)} onDone={() => setShowForm(false)} />}

      <div>
        {reviews.length === 0 && <p className="py-6 text-center" style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }}>No reports yet on this unit. Be the first to file one.</p>}
        {sortedReviews.map((r) => <ReviewCard key={r.id} review={r} categories={UNIT_CATEGORIES} userVote={userVotes[r.id]} onVote={(id, dir) => onVote("unit", id, dir)} currentUserId={user?.id} onDelete={(id) => onDeleteReview("unit", id)} />)}
      </div>
    </div>
  );
}

function HospitalView({ hospital, onBack, onSelectUnit, onAddReview, onDeleteReview, onVote, userVotes, onCompare, onOpenAddUnit, user, onOpenSignIn }) {
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
          <VitalsPanel reviews={hReviews} categories={HOSPITAL_CATEGORIES} />
          <CategoryList reviews={hReviews} categories={HOSPITAL_CATEGORIES} />
          <div className="flex items-center justify-between mt-6 mb-1">
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "1.05rem", color: "#16324A" }}>Reports ({hReviews.length})</h2>
            <div className="flex items-center gap-2">
              <ReviewSortControl value={reviewSort} onChange={setReviewSort} />
              {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-white font-semibold" style={{ background: "#0F9D6A", fontFamily: "'Inter'" }}><Plus size={14} /> Rate this hospital</button>}
            </div>
          </div>
          {showForm && <ReviewForm categories={HOSPITAL_CATEGORIES} reviewType="hospital" rolePlaceholder="e.g. RN, Emergency" user={user} onOpenSignIn={onOpenSignIn} onCancel={() => setShowForm(false)} onSubmit={(rev) => onAddReview(hospital.id, rev)} onDone={() => setShowForm(false)} />}
          <div>
            {hReviews.length === 0 && <p className="py-6 text-center" style={{ fontFamily: "'Inter'", color: "#64809A", fontSize: "13.5px" }}>No hospital-wide reports yet. Be the first to file one.</p>}
            {sortedHospitalReviews.map((r) => <ReviewCard key={r.id} review={r} categories={HOSPITAL_CATEGORIES} userVote={userVotes[r.id]} onVote={(id, dir) => onVote("hospital", id, dir)} currentUserId={user?.id} onDelete={(id) => onDeleteReview("hospital", id)} />)}
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

function HomeView({ hospitals, onSelectHospital, onOpenAddUnit }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return hospitals.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q));
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
function GetVerifiedPage({ onBack, onGoBrowse }) {
  return (
    <StaticPage title="Get Verified" onBack={onBack}>
      <p>A <strong>Verified</strong> badge tells other people your report is backed by real proof — not just a claim.</p>
      <p>Here's how it works: file a report on any hospital or unit, and right after you post it, you'll get the option to upload something showing you actually worked there — a badge photo, pay stub, or assignment letter.</p>
      <p>It's reviewed privately and never shown publicly — only the green Verified badge shows up on your report once it's approved.</p>
      <PrimaryButton onClick={onGoBrowse}>Browse hospitals</PrimaryButton>
    </StaticPage>
  );
}
function AboutPage({ onBack }) {
  return (
    <StaticPage title="What's the goal?" onBack={onBack}>
      <p>Taking a hospital job is a big decision, and most people go in blind. Recruiters and hospital marketing tell you what the unit is like…but the people who actually know are the ones already working the floor.</p>
      <p>Rate My Unit gives nurses, techs, and other staff a place to report what a specific unit is really like: staffing ratios, management, culture, and pay. The four things that can make or break a job. It also lets you rate the hospital as a whole, separately from units… on things like safety, reputation, facilities, food, etc.</p>
      <p>The goal is simple: before you take your next big opportunity, you should be able to see what people who've actually worked there have to say.</p>
    </StaticPage>
  );
}
function HelpPage({ onBack }) {
  const faqs = [
    ["How do I post a report?", "Sign in with your email at the top of the page, then open any unit or hospital and click \"File a report\" or \"Rate this hospital.\""],
    ["Is my identity shown?", "No. Your email is used only to sign you in and is never displayed on your review or shared with anyone, including the hospital."],
    ["What does \"Helpful?\" do?", "Thumbs up or down on any report to signal whether it was useful. You can sort reports by \"Most helpful\" to surface the best ones first."],
    ["What does claiming a unit mean?", "Staff can claim their own unit to confirm details are accurate. Your verification info is never shared publicly or with your employer."],
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

function AccountPage({ onBack, user, onOpenSignIn, onGoToHospital, onGoToUnit, onDeleteReview }) {
  const [myHospitalReviews, setMyHospitalReviews] = useState([]);
  const [myUnitReviews, setMyUnitReviews] = useState([]);
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
        </>
      )}
    </StaticPage>
  );
}

function SideMenu({ open, onClose, onNavigate }) {
  const items = [
    { key: "home", label: "Browse Hospitals" }, { key: "allUnits", label: "Browse Units" },
    { key: "account", label: "My Account" }, { key: "getVerified", label: "Get Verified" },
    { key: "about", label: "What's the goal?" },
    { key: "help", label: "Help" }, { key: "contact", label: "Contact Us" },
  ];
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
          {items.map((it) => <button key={it.key} onClick={() => onNavigate(it.key)} className="text-left px-3 py-3 rounded-xl" style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: "14.5px", color: "#16324A" }}>{it.label}</button>)}
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
    if (!error) setHospitals(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchHospitals();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function addUnitReview(unitId, review) {
    const { data } = await supabase.from("unit_reviews").insert({ unit_id: unitId, user_id: user.id, ...review }).select().single();
    await fetchHospitals();
    return data?.id;
  }
  async function addHospitalReview(hospitalId, review) {
    const { data } = await supabase.from("hospital_reviews").insert({ hospital_id: hospitalId, user_id: user.id, ...review }).select().single();
    await fetchHospitals();
    return data?.id;
  }
  async function deleteReview(reviewType, reviewId) {
    const table = reviewType === "hospital" ? "hospital_reviews" : "unit_reviews";
    await supabase.from(table).delete().eq("id", reviewId);
    await fetchHospitals();
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

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={handleMenuNavigate} />
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
            onVote={castVote}
            userVotes={userVotes}
            onCompare={() => setView({ page: "compare", type: "hospital", base: hospitals.find((h) => h.id === view.hospital.id), from: view })}
            onOpenAddUnit={() => setView({ page: "addUnit", from: view })}
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
            onVote={castVote}
            userVotes={userVotes}
            user={user}
            onOpenSignIn={() => setSignInOpen(true)}
            autoOpenReview={view.autoOpenReview}
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

        {view.page === "getVerified" && <GetVerifiedPage onBack={() => setView(view.from || { page: "home" })} onGoBrowse={() => setView({ page: "home" })} />}
        {view.page === "about" && <AboutPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "help" && <HelpPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "contact" && <ContactPage onBack={() => setView(view.from || { page: "home" })} />}
        {view.page === "account" && (
          <AccountPage
            onBack={() => setView(view.from || { page: "home" })}
            user={user}
            onOpenSignIn={() => setSignInOpen(true)}
            onGoToHospital={(h) => setView({ page: "hospital", hospital: h })}
            onGoToUnit={(h, u) => setView({ page: "unit", hospital: h, unit: u, from: { page: "account" } })}
            onDeleteReview={deleteReview}
          />
        )}
      </main>
    </div>
  );
}
