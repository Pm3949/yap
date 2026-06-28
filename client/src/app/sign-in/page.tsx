"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push("/");
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push("/");
    } catch {
      setError("Google sign-in failed. Please try again.");
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

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[300px] bg-fuchsia-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Back to home */}
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
              Welcome back
            </h1>
            <p className="text-zinc-500 text-sm">
              Log in to continue the chaos.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-2xl mb-5 animate-in fade-in zoom-in-95 duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          {/* Google button — prominent, above fold */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 mb-5 text-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4.5 h-4.5" />
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center mb-5">
            <div className="flex-grow border-t border-white/6" />
            <span className="mx-4 text-zinc-600 text-xs font-semibold tracking-widest uppercase">or</span>
            <div className="flex-grow border-t border-white/6" />
          </div>

          <form onSubmit={handleSignIn} className="space-y-3">
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
            <div className="relative group">
              <Lock
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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

            {/* Forgot */}
            <div className="flex justify-end pt-0.5">
              <Link href="#" className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-[0_0_24px_-6px_rgba(124,58,237,0.5)] mt-1"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={15} /> Log In</>
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="mt-5 text-center text-zinc-600 text-sm">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="text-white font-semibold hover:text-violet-400 transition-colors inline-flex items-center gap-1"
          >
            Sign up <ArrowRight size={13} />
          </Link>
        </p>
      </div>
    </div>
  );
}