"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  Zap,
  MessageSquare,
  Mic,
  Clock,
  UserPlus,
  Lock,
  Sparkles,
  Users,
  Users2,
  LogOut,
  ArrowRight,
  Shield,
  Globe,
  MapPin,
  Flame,
} from "lucide-react";

// Dynamically import MapPreview so it doesn't try to load Leaflet during SSR
const MapPreview = dynamic(() => import("@/components/MapPreview"), {
  ssr: false,
});

export default function Home() {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  // 🔥 FIX 1: Hydration error rokne ke liye isMounted state
  const [isMounted, setIsMounted] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.3850, 78.4867]);
  const [campfires, setCampfires] = useState<any[]>([]);
  const [selectedCampfire, setSelectedCampfire] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
        },
        (err) => console.log("Geolocation fallback to Hyderabad.")
      );
    }
  }, []);

  // Set mock campfires around current mapCenter coordinates
  useEffect(() => {
    const lat = mapCenter[0];
    const lng = mapCenter[1];
    const list = [
      {
        id: "cf-1",
        lat: lat + 0.004,
        lng: lng - 0.005,
        topic: "#LateNightCode",
        activeUsers: 8,
        vibe: "💻",
        description: "Yapping about typescript errors and caffeine levels.",
      },
      {
        id: "cf-2",
        lat: lat - 0.005,
        lng: lng + 0.006,
        topic: "#MusicVibes",
        activeUsers: 5,
        vibe: "🎸",
        description: "Shared playlists, indie discoveries, and concert gossip.",
      },
      {
        id: "cf-3",
        lat: lat + 0.003,
        lng: lng + 0.005,
        topic: "#DeepThoughts",
        activeUsers: 12,
        vibe: "🌌",
        description: "Does free will exist? Is simulation theory real?",
      },
      {
        id: "cf-4",
        lat: lat - 0.004,
        lng: lng - 0.004,
        topic: "#ChaiTapri",
        activeUsers: 6,
        vibe: "☕",
        description: "Casual banter and daily neighborhood updates.",
      },
    ];
    setCampfires(list);
    // Select first one by default for presentation
    setSelectedCampfire(list[0]);
  }, [mapCenter]);


  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 flex flex-col overflow-x-hidden font-sans">
      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* --- NAVBAR --- */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl w-full mx-auto z-50 relative">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* 🔥 FIX 2: Naya Neon Logo with mix-blend-screen */}
          <Image
            src="/yap-logo-wordmark.png"
            alt="YAP Logo"
            width={120}
            height={40}
            className="w-auto h-8 sm:h-10 mix-blend-screen drop-shadow-[0_0_15px_rgba(192,38,211,0.4)]"
            priority
          />
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 z-50">
          {/* 🔥 FIX 3: Hydration Safe Loading Check */}
          {!isMounted || loading ? (
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            <>
              <Link
                href="/friends"
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                <Users2 size={15} />
                <span className="hidden sm:inline">Friends</span>
              </Link>
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  <img
                    src={
                      user.imageUrl ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
                    }
                    alt="Profile"
                    className="w-7 h-7 rounded-full bg-zinc-800"
                  />
                  <span className="text-sm font-medium hidden sm:block truncate max-w-[100px]">
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={signInWithGoogle}
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5 hidden sm:block"
              >
                Log in
              </button>
              <button
                onClick={signInWithGoogle}
                className="text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-1.5 shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)]"
              >
                <Zap size={14} className="fill-white" /> Get Started
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* --- HERO --- */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative pt-16 pb-36">
        {/* Radial bg glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-violet-700/12 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-fuchsia-600/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-700/8 blur-[120px] rounded-full pointer-events-none" />

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm font-semibold text-violet-300 tracking-wide">
            Match. Chat. Connect.
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl lg:text-[88px] font-black tracking-tighter mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          Talk to{" "}
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
              Strangers.
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-violet-400/0 via-violet-400/60 to-violet-400/0" />
          </span>
          <br />
          Make them{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-orange-400">
            Friends.
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-xl mb-14 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 leading-relaxed">
          Dive into Chaos Mode — meet random people, survive the 2-minute vibe
          check, and decide if you want to keep yapping.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full max-w-2xl px-4">
          {!isMounted || loading ? (
            <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            <>
              <Link
                href="/video-chat"
                className="w-full sm:w-auto px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_-8px_rgba(124,58,237,0.7)] flex items-center justify-center gap-2"
              >
                <Video size={18} /> Video Chaos
              </Link>
              <Link
                href="/voice-chat"
                className="w-full sm:w-auto px-7 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Mic size={18} /> Voice Only
              </Link>
              <Link
                href="/text-chat"
                className="w-full sm:w-auto px-7 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} /> Text Only
              </Link>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                onClick={signInWithGoogle}
                className="px-9 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(124,58,237,0.7)] flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Sparkles size={20} /> Start for Free
              </button>
              <button
                onClick={signInWithGoogle}
                className="px-9 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>
            </div>
          )}
        </div>

        {/* Social proof strip */}
        <div className="mt-12 flex items-center gap-6 animate-in fade-in duration-700 delay-500">
          <div className="flex -space-x-2">
            {["seed1", "seed2", "seed3", "seed4"].map((s) => (
              <img
                key={s}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`}
                className="w-8 h-8 rounded-full ring-2 ring-[#050507] bg-zinc-800"
                alt=""
              />
            ))}
          </div>
          <p className="text-sm text-zinc-500">
            <span className="text-zinc-300 font-semibold">12,400+</span> yappers
            matched today
          </p>
        </div>
      </main>

      {/* --- LIVE CAMPFIRE MAP PREVIEW --- */}
      <section className="w-full py-16 relative z-10 border-t border-b border-white/5 bg-[#09090c]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-500 mb-3 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              Live Map Preview
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Explore Live <span className="text-orange-500">Campfires</span>
            </h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto leading-relaxed">
              Find active campfires, join anonymous text channels, and connect with people nearby. Drop a pin, select a vibe, and make them friends.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left side details */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="text-orange-500 w-5 h-5" />
                  Campfires Near You
                </h3>
                <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                  Click a campfire on the map to view topic details and see how many yappers are active.
                </p>

                {/* Campfire list selector */}
                <div className="space-y-3">
                  {campfires.map((cf) => (
                    <button
                      key={cf.id}
                      onClick={() => setSelectedCampfire(cf)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                        selectedCampfire?.id === cf.id
                          ? "bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                          : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-zinc-900 w-10 h-10 rounded-xl flex items-center justify-center">
                          {cf.vibe}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-white">{cf.topic}</p>
                          <p className="text-[11px] text-zinc-500 truncate max-w-[150px]">{cf.description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {cf.activeUsers} online
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Campfire highlight card */}
              {selectedCampfire && (
                <div className="bg-gradient-to-tr from-orange-500/10 to-rose-500/5 border border-orange-500/20 rounded-2xl p-4 mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-orange-400 tracking-wider uppercase">Active Vibe</span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ephemeral
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">{selectedCampfire.vibe} {selectedCampfire.topic}</h4>
                  <p className="text-xs text-zinc-400 leading-normal">{selectedCampfire.description}</p>
                </div>
              )}

              {/* CTA button to map */}
              <Link
                href="/map"
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(234,88,12,0.6)] flex items-center justify-center gap-2 group"
              >
                Go to Live Map
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Right side interactive map */}
            <div className="lg:col-span-8 min-h-[400px] lg:min-h-0 relative rounded-3xl overflow-hidden border border-white/5 bg-slate-950 p-2 group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-rose-500/10 opacity-30 blur-[40px] pointer-events-none rounded-3xl" />
              <div className="w-full h-full min-h-[450px]">
                {isMounted && (
                  <MapPreview
                    center={mapCenter}
                    campfires={campfires}
                    onCampfireClick={(cf) => setSelectedCampfire(cf)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="w-full py-28 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-violet-400 mb-4">
              The Formula
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              How <span className="text-violet-400">YAP</span> Works
            </h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto leading-relaxed">
              We fixed stranger chat. No swiping, no creeps. Just genuine
              connections on a ticking clock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Users size={24} />,
                step: "01",
                color: "violet",
                title: "Match Instantly",
                desc: "Choose Video, Voice, or Text. We pair you with a random stranger via secure peer-to-peer WebRTC.",
                border: "hover:border-violet-500/40",
                iconBg: "bg-violet-500/10 text-violet-400",
                glow: "group-hover:shadow-[0_0_60px_-20px_rgba(139,92,246,0.4)]",
              },
              {
                icon: <Clock size={24} />,
                step: "02",
                color: "fuchsia",
                title: "The 2-Minute Rule",
                desc: "Exactly 2 minutes to pass the vibe check. Awkward? Click Skip. Vibing? Wait for the timer.",
                border: "hover:border-fuchsia-500/40",
                iconBg: "bg-fuchsia-500/10 text-fuchsia-400",
                glow: "group-hover:shadow-[0_0_60px_-20px_rgba(217,70,239,0.4)]",
              },
              {
                icon: <UserPlus size={24} />,
                step: "03",
                color: "green",
                title: "Make it Official",
                desc: "Timer ends, 'Add Friend' appears. Mutual click = friendship. DM or call anytime.",
                border: "hover:border-emerald-500/40",
                iconBg: "bg-emerald-500/10 text-emerald-400",
                glow: "group-hover:shadow-[0_0_60px_-20px_rgba(52,211,153,0.4)]",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`group relative bg-white/[0.02] border border-white/8 ${item.border} ${item.glow} p-7 rounded-3xl transition-all duration-300 overflow-hidden`}
              >
                {/* Step number watermark */}
                <span className="absolute top-5 right-6 text-6xl font-black text-white/4 select-none leading-none">
                  {item.step}
                </span>
                <div
                  className={`w-12 h-12 ${item.iconBg} rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300`}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES / PRIVACY --- */}
      <section className="w-full py-24 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-fuchsia-400 mb-4">
              Under the hood
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8 leading-tight">
              Built for speed.
              <br />
              Designed for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                privacy.
              </span>
            </h2>
            <ul className="space-y-7">
              {[
                {
                  icon: <Shield size={18} />,
                  color: "text-violet-400 bg-violet-500/10",
                  title: "Secure WebRTC Streams",
                  desc: "Your video and voice data is transmitted peer-to-peer. It never touches our servers.",
                },
                {
                  icon: <MessageSquare size={18} />,
                  color: "text-fuchsia-400 bg-fuchsia-500/10",
                  title: "Persistent Direct Messages",
                  desc: "Keep the conversation going in your private DMs with read receipts and live typing.",
                },
                {
                  icon: <Globe size={18} />,
                  color: "text-emerald-400 bg-emerald-500/10",
                  title: "Direct Video & Voice Calling",
                  desc: "Ring friends directly from chat. No phone numbers or Discord tags needed.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4 group">
                  <div
                    className={`p-2.5 ${item.color} rounded-xl mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1 tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock chat UI */}
          <div className="flex-1 w-full max-w-sm relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/15 to-fuchsia-600/15 blur-[60px] rounded-full" />
            <div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
              {/* Chat header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#050507]" />
                </div>
                <div>
                  <div className="h-3 w-20 bg-white/20 rounded-full mb-1.5" />
                  <div className="h-2.5 w-14 bg-emerald-500/40 rounded-full" />
                </div>
                <div className="ml-auto flex gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Video size={14} className="text-violet-400" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <Mic size={14} className="text-zinc-400" />
                  </div>
                </div>
              </div>
              {/* Messages */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-end">
                  <div className="bg-violet-600/80 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                    yo this app is actually fire 🔥
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/8 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-zinc-300 max-w-[80%]">
                    right?? made 3 friends already lol
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-violet-600/80 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                    add me? timer's almost up 👀
                  </div>
                </div>
                {/* Typing indicator */}
                <div className="flex justify-start items-center gap-2">
                  <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Input */}
              <div className="flex gap-2 pt-3 border-t border-white/5">
                <div className="h-10 flex-1 bg-black/40 border border-white/8 rounded-xl px-3 flex items-center">
                  <span className="text-sm text-zinc-600">Message...</span>
                </div>
                <div className="h-10 w-10 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      {isMounted && !user && !loading && (
        <section className="w-full py-20 relative z-10">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="relative bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 rounded-3xl p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 relative z-10">
                Ready to start yapping?
              </h2>
              <p className="text-zinc-400 mb-8 relative z-10">
                Free forever. No DMs from creeps. Just chaos and connection.
              </p>
              <button
                onClick={signInWithGoogle}
                className="relative z-10 inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(124,58,237,0.7)]"
              >
                <Zap size={18} className="fill-white" /> Create Free Account
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-white/5 py-10 z-10 relative">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 🔥 FIX 4: Footer Neon Logo */}
          <Image
            src="/yap-logo-wordmark.jpg"
            alt="YAP Logo"
            width={72}
            height={24}
            className="w-auto h-6 opacity-60 hover:opacity-100 transition-opacity mix-blend-screen grayscale hover:grayscale-0"
          />
          <p className="text-zinc-600 text-xs text-center">
            Built with Next.js, Socket.io & WebRTC &nbsp;·&nbsp; &copy;{" "}
            {new Date().getFullYear()} YAP Chat
          </p>
          <div className="flex gap-5 text-xs text-zinc-600">
            <Link href="#" className="hover:text-zinc-400 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-zinc-400 transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-zinc-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}