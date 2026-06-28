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
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface MapComponentProps {
  userLocation: [number, number] | null;
  activeClusters: any[]; // We will type this properly later
  onClusterClick: (clusterId: string) => void;
}

export default function MapComponent({
  userLocation,
  activeClusters,
  onClusterClick,
}: MapComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fix for Leaflet default icon issues in React
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      // Fix for Leaflet default icon issues in React
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  const L = typeof window !== "undefined" ? require("leaflet") : null;
  
  // Memoize the icon so it survives React hot-reloads
  const personIcon = useMemo(() => L ? L.divIcon({
    html: '<div style="font-size: 24px; text-shadow: 0 0 10px rgba(0,255,255,0.8); text-align: center;">👤</div>',
    className: 'custom-person-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  }) : undefined, [L]);

  if (!mounted) return <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-white">Loading Map...</div>;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={userLocation || [51.505, -0.09]} // Default to London if no location
        zoom={userLocation ? 13 : 3}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {/* User's Private Location View */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={1000} // Obfuscate by showing a 1km radius circle instead of exact pin
            pathOptions={{ fillColor: "blue", fillOpacity: 0.2, color: "blue", weight: 1, dashArray: "4" }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">Your General Area</p>
                <p className="text-[10px] text-slate-500">Only visible to you until you create a Campfire.</p>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Active Clusters */}
        {activeClusters.map((cluster) => {
          const isPerson = cluster.type === 'person';
          
          return (
            <Marker
              key={cluster.id}
              position={[cluster.lat, cluster.lng]}
              icon={isPerson ? personIcon : undefined}
              eventHandlers={{
                click: () => !isPerson && onClusterClick(cluster.id), // Disable knock on persons for now
              }}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={!isPerson}>
                <div className="text-center font-sans">
                  <p className="font-bold text-sm text-slate-800">{isPerson ? "Wanderer" : (cluster.topic || "Campfire")}</p>
                  {!isPerson && (
                    <>
                      <p className="text-[10px] text-slate-500 font-medium">{cluster.activeUsers} yapping</p>
                      <p className="text-[10px] text-blue-600 mt-1">Click to knock</p>
                    </>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Custom CSS to make the map look a bit cooler (dark mode feel) */}
      <style jsx global>{`
        .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .leaflet-container {
          background: #0f172a;
        }
      `}</style>
    </div>
  );
}
