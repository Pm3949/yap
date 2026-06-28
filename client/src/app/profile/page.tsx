"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase"; // 🔥 NAYA: Firebase auth import kiya
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword, 
  sendPasswordResetEmail, 
  deleteUser 
} from "firebase/auth"; // 🔥 NAYA: Firebase functions
import {
  User, Mail, Shield, LogOut, ArrowLeft, Camera,
  CheckCircle2, Lock, Eye, EyeOff, KeyRound,
  AlertTriangle, ChevronRight, X,
} from "lucide-react";

// ─── tiny helper ───────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const strength =
    password.length === 0 ? 0 :
    password.length < 6   ? 1 :
    password.length < 10  ? 2 : 3;

  const colors  = ["", "bg-red-500", "bg-yellow-400", "bg-emerald-400"];
  const labels  = ["", "Weak", "Good", "Strong"];
  const txtCols = ["", "text-red-400", "text-yellow-400", "text-emerald-400"];

  if (!password) return null;
  return (
    <div className="mt-2 px-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex gap-1 mb-1">
        {[1,2,3].map(l => (
          <div key={l} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= l ? colors[strength] : "bg-white/8"}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${txtCols[strength]}`}>{labels[strength]} password</p>
    </div>
  );
}

// ─── main component ─────────────────────────────────────────────
export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // ── profile state
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  // ── password state
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwMsg,      setPwMsg]      = useState({ text: "", type: "" });

  // ── forgot-password modal
  const [fpOpen,    setFpOpen]    = useState(false);
  const [fpEmail,   setFpEmail]   = useState("");
  const [fpSent,    setFpSent]    = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  // ── populate
  useEffect(() => { if (user?.username) setUsername(user.username); }, [user]);
  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  // ── handlers
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (username.length < 3)
      return setProfileMsg({ text: "Username must be at least 3 characters.", type: "error" });

    setSaving(true);
    setProfileMsg({ text: "", type: "" });
    try {
      const res = await fetch("/api/auth/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, username }),
      });
      if (res.ok) {
        refreshUser();
        setProfileMsg({ text: "Profile updated successfully!", type: "success" });
      } else {
        setProfileMsg({ text: "Username might be taken. Try another.", type: "error" });
      }
    } catch {
      setProfileMsg({ text: "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg({ text: "", type: "" });
    if (newPw.length < 6)
      return setPwMsg({ text: "New password must be at least 6 characters.", type: "error" });
    if (newPw !== confirmPw)
      return setPwMsg({ text: "Passwords don't match.", type: "error" });

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;

    setPwSaving(true);
    try {
      // 1. Pehle current password se re-authenticate karo (Security rule)
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      
      // 2. Naya password update karo
      await updatePassword(currentUser, newPw);
      
      setPwMsg({ text: "Password changed successfully!", type: "success" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setPwMsg({ text: "Current password is incorrect.", type: "error" });
      } else {
        setPwMsg({ text: "Failed to change password. Try logging out and back in.", type: "error" });
      }
    } finally {
      setPwSaving(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpLoading(true);
    try {
      // 🔥 Firebase ka direct reset password link bhejo
      await sendPasswordResetEmail(auth, fpEmail);
      setFpSent(true);
    } catch {
      setFpSent(true); // Privacy: Agar fail bhi ho toh success dikhao taaki enum na ho
    } finally {
      setFpLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your messages and friends."
    );
    if (!confirmDelete) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // 1. Neon Database se delete karne ki API call (Aapko ye banani padegi, abhi ke liye main link de raha)
      await fetch(`/api/auth/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.uid })
      });

      // 2. Firebase se delete karo
      await deleteUser(currentUser);
      
      // App automatically redirect ho jayegi kyunki auth state change ho jayega
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete account. For security reasons, you may need to log out and log back in before deleting your account.");
    }
  };

  // ── loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 🔥 Sahi tareeke se check karo ki banda Google se login hua hai ya Email se
  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 pb-20">

      {/* noise */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat:"repeat", backgroundSize:"128px 128px" }} />

      {/* ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/8 blur-[160px] rounded-full pointer-events-none" />

      {/* ── header ── */}
      <header className="px-6 py-5 max-w-2xl w-full mx-auto flex items-center relative z-10">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-semibold group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-4 space-y-4 relative z-10">

        {/* ════════════════════════════════════
            CARD 1 — Avatar + Identity
        ════════════════════════════════════ */}
        <section className="bg-white/[0.03] border border-white/8 rounded-[28px] overflow-hidden">

          {/* gradient banner */}
          <div className="h-24 bg-gradient-to-br from-violet-700/40 via-fuchsia-700/20 to-transparent relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050507]/60" />
          </div>

          <div className="px-7 pb-7 -mt-12 relative">
            {/* avatar */}
            <div className="relative group w-fit mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[2px] shadow-lg shadow-violet-500/25">
                <img
                  src={user.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                  alt="Avatar"
                  className="w-full h-full rounded-[14px] bg-zinc-900 object-cover"
                />
              </div>
              <button
                type="button"
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                title="Change photo"
              >
                <Camera size={18} className="text-white" />
              </button>
            </div>

            <h1 className="text-xl font-black tracking-tight text-white mb-0.5">{user.username}</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>

            {/* divider */}
            <div className="border-t border-white/5 my-6" />

            {/* feedback */}
            <Feedback msg={profileMsg} />

            {/* form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Field label="Email address" hint="Email cannot be changed directly.">
                <div className="relative opacity-55 pointer-events-none">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="email" value={user.email} disabled
                    className="w-full bg-black/30 border border-white/6 rounded-2xl pl-11 pr-10 py-3 text-sm text-zinc-400 outline-none"
                  />
                  <Shield size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                </div>
              </Field>

              <Field label="Username">
                <div className="relative group">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-black/30 border border-white/8 group-focus-within:border-violet-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
                    maxLength={15} required
                  />
                </div>
              </Field>

              <button
                type="submit"
                disabled={saving || username === user.username}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-[0_0_24px_-6px_rgba(124,58,237,0.5)]"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Save Changes"
                }
              </button>
            </form>
          </div>
        </section>

        {/* ════════════════════════════════════
            CARD 2 — Password / Security
        ════════════════════════════════════ */}
        <section className="bg-white/[0.03] border border-white/8 rounded-[28px] p-7">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400">
              <KeyRound size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Password & Security</h2>
              <p className="text-xs text-zinc-500">Keep your account safe</p>
            </div>
          </div>

          {isGoogleUser ? (
            /* Google users can't set a password via this flow */
            <div className="flex items-start gap-3 bg-white/[0.03] border border-white/8 rounded-2xl p-4">
              <Shield size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-0.5">Signed in with Google</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Your account is secured by Google. Password management is handled through your Google account.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Feedback msg={pwMsg} />

              <form onSubmit={handleChangePassword} className="space-y-3">
                <Field label="Current password">
                  <PwInput
                    value={currentPw} onChange={setCurrentPw}
                    show={showCur} toggle={() => setShowCur(v => !v)}
                    placeholder="Enter current password"
                  />
                </Field>

                <Field label="New password">
                  <PwInput
                    value={newPw} onChange={setNewPw}
                    show={showNew} toggle={() => setShowNew(v => !v)}
                    placeholder="Choose a new password"
                  />
                  <PasswordStrengthBar password={newPw} />
                </Field>

                <Field label="Confirm new password">
                  <div className="relative">
                    <PwInput
                      value={confirmPw} onChange={setConfirmPw}
                      show={showConf} toggle={() => setShowConf(v => !v)}
                      placeholder="Repeat new password"
                    />
                    {confirmPw && newPw && (
                      <div className={`absolute right-10 top-1/2 -translate-y-1/2 text-xs font-semibold ${confirmPw === newPw ? "text-emerald-400" : "text-red-400"}`}>
                        {confirmPw === newPw ? "✓" : "✗"}
                      </div>
                    )}
                  </div>
                </Field>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setFpEmail(user.email); setFpOpen(true); }}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 group"
                  >
                    Forgot current password?
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-violet-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm mt-1"
                >
                  {pwSaving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Lock size={14} /> Update Password</>
                  }
                </button>
              </form>
            </>
          )}
        </section>

        {/* ════════════════════════════════════
            CARD 3 — Danger Zone
        ════════════════════════════════════ */}
        <section className="bg-white/[0.03] border border-white/8 rounded-[28px] p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Danger Zone</h2>
              <p className="text-xs text-zinc-500">Irreversible actions</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={logout}
              className="w-full py-3 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={15} /> Sign Out
            </button>
            
            {/* 🔥 NAYA: Delete Account handler add kiya */}
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="w-full py-3 bg-transparent hover:bg-red-500/8 border border-red-500/10 hover:border-red-500/20 text-red-500/60 hover:text-red-400 font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              Delete Account
            </button>
          </div>
        </section>

      </main>

      {/* ════════════════════════════════════
          FORGOT PASSWORD MODAL
      ════════════════════════════════════ */}
      {fpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) { setFpOpen(false); setFpSent(false); }}}
        >
          <div className="w-full max-w-sm bg-[#0e0e12] border border-white/10 rounded-[28px] p-7 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-500/15 rounded-xl flex items-center justify-center text-violet-400">
                  <KeyRound size={15} />
                </div>
                <h3 className="font-bold text-white text-base">Reset Password</h3>
              </div>
              <button
                onClick={() => { setFpOpen(false); setFpSent(false); }}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {fpSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={26} className="text-emerald-400" />
                </div>
                <p className="font-bold text-white mb-1.5">Check your inbox</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  If an account exists for <span className="text-zinc-300">{fpEmail}</span>, a reset link is on its way.
                </p>
                <button
                  onClick={() => { setFpOpen(false); setFpSent(false); }}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl text-sm font-semibold text-white transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
                  Enter your email and we'll send a reset link. Check your spam folder if you don't see it.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="relative group">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      type="email"
                      value={fpEmail}
                      onChange={e => setFpEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/8 group-focus-within:border-violet-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_-6px_rgba(124,58,237,0.5)]"
                  >
                    {fpLoading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : "Send Reset Link"
                    }
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase pl-0.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-600 pl-0.5">{hint}</p>}
    </div>
  );
}

function PwInput({ value, onChange, show, toggle, placeholder }: {
  value: string; onChange: (v: string) => void;
  show: boolean; toggle: () => void; placeholder: string;
}) {
  return (
    <div className="relative group">
      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/30 border border-white/8 group-focus-within:border-violet-500/60 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
      />
      <button
        type="button" onClick={toggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function Feedback({ msg }: { msg: { text: string; type: string } }) {
  if (!msg.text) return null;
  const isOk = msg.type === "success";
  return (
    <div className={`flex items-center gap-2.5 p-3.5 rounded-2xl mb-4 text-sm font-medium animate-in fade-in zoom-in-95 duration-300 ${
      isOk
        ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"
        : "bg-red-500/8 border border-red-500/20 text-red-400"
    }`}>
      {isOk
        ? <CheckCircle2 size={15} className="flex-shrink-0" />
        : <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
      }
      {msg.text}
    </div>
  );
}