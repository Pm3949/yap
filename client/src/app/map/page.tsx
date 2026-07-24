"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, Loader2, Plus, Ghost, EyeOff, Eye, Search, Radio, X } from "lucide-react";
import io from "socket.io-client";
import KnockModal from "@/components/KnockModal";
import MapChatRoom from "@/components/MapChatRoom";
import MapComponent from "@/components/Map";

// Connect to backend (fallback to localhost for dev)
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001");

export default function MapPage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeClusters, setActiveClusters] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  
  // Phase 2 State
  const [isGhost, setIsGhost] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [myAlias, setMyAlias] = useState<string>("");
  const [topicInput, setTopicInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Knock State
  const [incomingKnock, setIncomingKnock] = useState<{knockerId: string, roomId: string} | null>(null);
  const [isWaitingForKnock, setIsWaitingForKnock] = useState(false);

  // Phase 3: Filters & Broadcasting
  const [searchTopic, setSearchTopic] = useState("");
  const [searchRadius, setSearchRadius] = useState(50000); // 50km default
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [myId, setMyId] = useState<string | undefined>(socket.id);

  useEffect(() => {
    socket.on("connect", () => setMyId(socket.id));
    return () => { socket.off("connect"); }
  }, []);

  // Fetch location ONCE on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const offsetLat = position.coords.latitude + (Math.random() - 0.5) * 0.01;
          const offsetLng = position.coords.longitude + (Math.random() - 0.5) * 0.01;
          
          setUserLocation([offsetLat, offsetLng]);
          setIsLocating(false);
          
          // Fetch initial clusters
          socket.emit("fetchClusters", { lat: offsetLat, lng: offsetLng, radius: searchRadius, topicFilter: searchTopic });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Please enable location services to use Map Chat.");
          setIsLocating(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  }, []); // Empty dependency array prevents infinite loops!

  // Socket listeners
  useEffect(() => {
    socket.on("mapClustersUpdate", (clusters) => {
      setActiveClusters(clusters);
    });

    socket.on("newMapUser", (user) => {
      // Re-fetch clusters to respect filters instead of blindly appending
      if (userLocation) {
        socket.emit("fetchClusters", { lat: userLocation[0], lng: userLocation[1], radius: searchRadius, topicFilter: searchTopic });
      }
    });

    socket.on("removeMapUser", ({ id }) => {
      setActiveClusters((prev) => prev.filter((c) => c.id !== id));
    });
    
    socket.on("updateClusterCount", ({ roomId, increment }) => {
      setActiveClusters(prev => prev.map(c => c.id === roomId ? { ...c, activeUsers: c.activeUsers + increment } : c));
    });

    // Knocking Events
    socket.on("receiveKnock", ({ knockerId, roomId }) => {
      setIncomingKnock({ knockerId, roomId });
    });

    socket.on("knockAccepted", ({ roomId, alias }) => {
      setIsWaitingForKnock(false);
      setActiveRoomId(roomId);
      setMyAlias(alias);
    });

    socket.on("knockRejected", ({ reason }) => {
      setIsWaitingForKnock(false);
      alert("Knock rejected: " + reason);
    });

    socket.on("roomCreated", ({ roomId, alias }) => {
      setActiveRoomId(roomId);
      setMyAlias(alias);
      setIsCreating(false);
      setTopicInput("");
    });

    return () => {
      socket.off("mapClustersUpdate");
      socket.off("newMapUser");
      socket.off("removeMapUser");
      socket.off("updateClusterCount");
      socket.off("receiveKnock");
      socket.off("knockAccepted");
      socket.off("knockRejected");
      socket.off("roomCreated");
    };
  }, [searchRadius, searchTopic, userLocation]);

  // Handle manual refetch when filters change
  useEffect(() => {
    if (userLocation) {
      socket.emit("fetchClusters", { lat: userLocation[0], lng: userLocation[1], radius: searchRadius, topicFilter: searchTopic });
    }
  }, [searchRadius, searchTopic, userLocation]);

  const handleCreateCampfire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userLocation || !topicInput.trim()) return;
    socket.emit("createMapRoom", { lat: userLocation[0], lng: userLocation[1], topic: topicInput });
    if (isBroadcasting) toggleBroadcast(); // Stop generic broadcast if creating a room
  };

  const toggleBroadcast = () => {
    if (!userLocation) return;
    if (isBroadcasting) {
      socket.emit("stopBroadcast");
      setIsBroadcasting(false);
    } else {
      socket.emit("broadcastLocation", { lat: userLocation[0], lng: userLocation[1] });
      setIsBroadcasting(true);
      setIsGhost(false); // Can't be ghost and broadcasting
    }
  };

  const toggleGhostMode = () => {
    if (!isGhost && isBroadcasting) {
      // If we are entering Ghost Mode, we must stop broadcasting
      socket.emit("stopBroadcast");
      setIsBroadcasting(false);
    }
    setIsGhost(!isGhost);
  };

  const handleJoinCluster = (clusterId: string) => {
    if (activeRoomId) return alert("You are already in a campfire!");
    setIsWaitingForKnock(true);
    socket.emit("knockOnRoom", { roomId: clusterId });
  };

  const handleKnockAccept = () => {
    if (incomingKnock) {
      socket.emit("handleKnockResponse", { knockerId: incomingKnock.knockerId, roomId: incomingKnock.roomId, accepted: true });
      setIncomingKnock(null);
    }
  };

  const handleKnockDeny = () => {
    if (incomingKnock) {
      socket.emit("handleKnockResponse", { knockerId: incomingKnock.knockerId, roomId: incomingKnock.roomId, accepted: false });
      setIncomingKnock(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white relative">
      {/* Header */}
      <header className="absolute top-0 w-full z-10 p-4 pointer-events-none flex justify-between items-start">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 max-w-sm pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent flex items-center gap-2">
              <MapPin className="text-orange-500 w-6 h-6" />
              YAP Map
            </h1>
            <button 
              onClick={toggleGhostMode}
              className={`p-2 rounded-full transition-colors ${isGhost ? 'bg-slate-700 text-slate-300' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'}`}
              title={isGhost ? "Ghost Mode Active" : "Go Incognito"}
            >
              {isGhost ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Find active campfires near you. Knock to join the conversation. Rooms disappear when empty.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-4 py-2 flex flex-col items-end gap-2 pointer-events-auto shadow-xl">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">
              {activeClusters.reduce((acc, c) => {
                const isMe = c.id === myId || c.creatorId === myId;
                // Don't count the user themselves in the "nearby" count
                const count = isMe ? Math.max(0, (c.activeUsers || 1) - 1) : (c.activeUsers || 1);
                return acc + count;
              }, 0)} nearby
            </span>
          </div>
          
          <button 
            onClick={toggleBroadcast}
            className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              isBroadcasting ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Radio className="w-3 h-3" />
            {isBroadcasting ? "Broadcasting Presence" : "Go Public"}
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-full max-w-md px-4">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 flex gap-2 pointer-events-auto shadow-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search topics..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <select 
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value={1000}>1 km</option>
            <option value={5000}>5 km</option>
            <option value={15000}>15 km</option>
            <option value={50000}>50 km</option>
            <option value={10000000}>Global</option>
          </select>
        </div>
      </div>

      {/* Main Map Area */}
      <main className="flex-1 relative z-0">
        {isLocating && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
             <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
             <p className="text-lg font-medium text-slate-200">Finding your general area...</p>
             <p className="text-sm text-slate-400 mt-2">Privacy First: We use an obfuscated radius, never your exact address.</p>
          </div>
        )}
        
        {locationError && !isLocating && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
             <MapPin className="w-16 h-16 text-rose-500 mb-4 opacity-50" />
             <p className="text-xl font-medium text-rose-400 mb-2">Location Required</p>
             <p className="text-slate-300 max-w-md">{locationError}</p>
             <button 
               onClick={() => window.location.reload()}
               className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
             >
               Try Again
             </button>
          </div>
        )}

        {/* The Map */}
        <MapComponent 
          userLocation={isGhost ? null : userLocation} 
          activeClusters={activeClusters} 
          onClusterClick={handleJoinCluster} 
          mySocketId={myId}
        />

        {/* Overlays */}
        {incomingKnock && (
          <KnockModal knockerId={incomingKnock.knockerId} onAccept={handleKnockAccept} onDeny={handleKnockDeny} />
        )}

        {isWaitingForKnock && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-2xl flex flex-col items-center z-50">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-white font-medium">Knocking on campfire...</p>
            <p className="text-slate-400 text-xs mt-1">Waiting for them to let you in.</p>
            <button onClick={() => setIsWaitingForKnock(false)} className="mt-4 text-xs text-slate-500 hover:text-white transition-colors">Cancel</button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-30">
          {!activeRoomId && userLocation && !isGhost && (
            <div className="pointer-events-auto flex flex-col items-center">
              {isCreating ? (
                <form onSubmit={handleCreateCampfire} className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 rounded-full shadow-2xl flex items-center gap-2 w-full animate-in slide-in-from-bottom-4">
                  <input 
                    autoFocus
                    type="text" 
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    placeholder="e.g., #LateNightCode, Deep Talks"
                    className="flex-1 bg-transparent text-white text-sm px-4 focus:outline-none placeholder:text-slate-500"
                    maxLength={30}
                  />
                  <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap">
                    Start Fire
                  </button>
                  <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white p-2">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-orange-600 hover:bg-orange-500 text-white rounded-full px-6 py-3 font-semibold shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Campfire
                </button>
              )}
            </div>
          )}

          {activeRoomId && (
            <div className="pointer-events-auto">
              <MapChatRoom 
                socket={socket} 
                roomId={activeRoomId} 
                myAlias={myAlias} 
                onLeave={() => setActiveRoomId(null)} 
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
