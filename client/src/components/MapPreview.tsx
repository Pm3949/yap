"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import react-leaflet components since they rely on window
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

interface MapPreviewProps {
  center: [number, number];
  campfires: Array<{
    id: string;
    lat: number;
    lng: number;
    topic: string;
    activeUsers: number;
    vibe: string;
  }>;
  onCampfireClick: (campfire: any) => void;
}

export default function MapPreview({ center, campfires, onCampfireClick }: MapPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fix for Leaflet default icon issues in React
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  const L = typeof window !== "undefined" ? require("leaflet") : null;

  // Render a custom flame/campfire emoji icon
  const campfireIcon = useMemo(() => {
    if (!L) return undefined;
    return L.divIcon({
      html: '<div style="font-size: 26px; text-shadow: 0 0 10px rgba(249,115,22,0.8); text-align: center; animation: pulse 2s infinite ease-in-out;">🔥</div>',
      className: 'custom-campfire-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }, [L]);

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-900/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-zinc-400 border border-white/5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Igniting Map...</span>
        </div>
      </div>
    );
  }

  // Inner component to handle dynamic map centering
  const MapUpdater = ({ center }: { center: [number, number] }) => {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    useEffect(() => {
      map.setView(center, 13, { animate: true });
    }, [center, map]);
    return null;
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full bg-slate-900"
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={false}
        touchZoom={true}
      >
        <MapUpdater center={center} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {/* User General Area representation */}
        <Circle
          center={center}
          radius={800}
          pathOptions={{ fillColor: "#f97316", fillOpacity: 0.1, color: "#f97316", weight: 1, dashArray: "4 4" }}
        />

        {/* Campfire Markers */}
        {campfires.map((cf) => (
          <Marker
            key={cf.id}
            position={[cf.lat, cf.lng]}
            icon={campfireIcon}
            eventHandlers={{
              click: () => onCampfireClick(cf)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              <div className="text-center font-sans px-1.5 py-0.5">
                <p className="font-bold text-xs text-slate-800 flex items-center justify-center gap-1">
                  <span>{cf.vibe}</span>
                  <span>{cf.topic}</span>
                </p>
                <p className="text-[9px] text-slate-500 font-medium">
                  {cf.activeUsers} yapping
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Dark theme filter styling */}
      <style jsx global>{`
        .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .leaflet-container {
          background: #09090b;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.9; filter: drop-shadow(0 0 15px rgba(249,115,22,0.9)); }
        }
      `}</style>
    </div>
  );
}
