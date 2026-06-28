"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, ArrowRight, Check } from "lucide-react";

export default function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-emerald-500"];
  const strengthText = ["", "text-red-400", "text-yellow-400", "text-emerald-400"];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.length < 3) return setError("Username must be at least 3 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      await signUpWithEmail(email, password, username);
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please log in.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push("/");
    } catch {
      setError("Google sign-up failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4 selection:bg-violet-500/30">

      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Ambient glows */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[400px] bg-violet-600/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[400px] h-[300px] bg-fuchsia-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Image
              src="/images/yap-logo-wordmark.png"
              alt="YAP"
              width={120}
              height={40}
              className="w-auto h-9"
              priority
            />
          </Link>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-[28px] p-8 backdrop-blur-xl shadow-2xl">

          <div className="mb-7">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1.5">
              Create your account
            </h1>
            <p className="text-zinc-500 text-sm">
              Start the chaos. It's free, forever.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-2xl mb-5 animate-in fade-in zoom-in-95 duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          {/* Google — CTA first */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 mb-5 text-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4.5 h-4.5" />
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center mb-5">
            <div className="flex-grow border-t border-white/6" />
            <span className="mx-4 text-zinc-600 text-xs font-semibold tracking-widest uppercase">or</span>
            <div className="flex-grow border-t border-white/6" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-3">

            {/* Username */}
            <div className="relative group">
              <User
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/30 border border-white/8 group-focus-within:border-violet-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                required
                maxLength={15}
              />
              {username.length >= 3 && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center animate-in fade-in zoom-in-50 duration-200">
                  <Check size={11} className="text-emerald-400" />
                </div>
              )}
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/8 group-focus-within:border-violet-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative group">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/8 group-focus-within:border-violet-500/60 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength >= level ? strengthColor[passwordStrength] : "bg-white/8"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthText[passwordStrength]}`}>
                    {strengthLabel[passwordStrength]} password
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-[0_0_24px_-6px_rgba(124,58,237,0.5)] mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={15} /> Create Account</>
              )}
            </button>
          </form>

          {/* Trust line */}
          <p className="text-center text-zinc-600 text-xs mt-5">
            By signing up you agree to our{" "}
            <Link href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
              Terms
            </Link>{" "}
            &amp;{" "}
            <Link href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Log in link */}
        <p className="mt-5 text-center text-zinc-600 text-sm">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-white font-semibold hover:text-violet-400 transition-colors inline-flex items-center gap-1"
          >
            Log in <ArrowRight size={13} />
          </Link>
        </p>
      </div>
    </div>
  );
}