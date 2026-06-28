import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Friend } from "./useFriends";

export type CallState = "idle" | "calling" | "incoming" | "active";
export type CallData = { roomId: string; type: "video" | "voice"; callerName?: string } | null;

export const useDirectCall = (socket: Socket | null, user: any, activeFriend: Friend | null) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callData, setCallData] = useState<CallData>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<any[]>([]);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const callDataRef = useRef(callData);
  useEffect(() => { callDataRef.current = callData; }, [callData]);

  const attachStream = (ref: React.RefObject<HTMLVideoElement | null>, stream: MediaStream | null) => {
    if (!stream) return;
    let attempts = 0;
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.srcObject = stream;
        // 🔥 FIX: Explicitly call play to bypass browser auto-play blocks
        ref.current.play().catch(e => console.error("Playback failed:", e));
        clearInterval(interval);
      }
      if (++attempts > 20) clearInterval(interval);
    }, 100);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", ({ callerName, type, roomId }) => {
      setCallData({ roomId, type, callerName });
      setCallState("incoming");
    });

    socket.on("callAccepted", async ({ roomId }) => {
      setCallState("active");
      await setupWebRTC(roomId, true, callDataRef.current?.type === "video");
    });

    socket.on("callRejected", () => { alert("Friend declined the call."); endCallCleanup(); });
    socket.on("callEnded", () => endCallCleanup());
    socket.on("callFailed", ({ reason }) => { alert(reason); endCallCleanup(); });
    socket.on("callCancelled", () => endCallCleanup());

    socket.on("offer", async (data: any) => {
      if (!data?.offer || !peerConnection.current) return;
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        while (iceCandidateQueue.current.length > 0) {
          const q = iceCandidateQueue.current.shift();
          if (q) await peerConnection.current.addIceCandidate(new RTCIceCandidate(q));
        }
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { answer, roomId: data.roomId });
      } catch (err) { console.error(err); }
    });

    socket.on("answer", async (data: any) => {
      if (!data?.answer || !peerConnection.current) return;
      try {
        if (peerConnection.current.signalingState === "have-local-offer") {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          while (iceCandidateQueue.current.length > 0) {
            const q = iceCandidateQueue.current.shift();
            if (q) await peerConnection.current.addIceCandidate(new RTCIceCandidate(q));
          }
        }
      } catch (err) { console.error(err); }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerConnection.current || !candidate) return;
      try {
        if (peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueue.current.push(candidate);
        }
      } catch (err) { console.error(err); }
    });

    return () => {
      socket.off("incomingCall"); socket.off("callAccepted"); socket.off("callRejected");
      socket.off("callEnded"); socket.off("callFailed"); socket.off("callCancelled"); 
      socket.off("offer"); socket.off("answer"); socket.off("ice-candidate");
    };
  }, [socket]);

  const toggleMic = () => {
    if (localStream.current) {
      const newMutedState = !isMicMuted;
      localStream.current.getAudioTracks().forEach(t => t.enabled = !newMutedState);
      setIsMicMuted(newMutedState);
    }
  };

  const initiateCall = async (type: "video" | "voice") => {
    if (!socket || !activeFriend || !user) return;
    const friendName = activeFriend.username || activeFriend.firstName || "Friend";
    setCallData({ roomId: "", type, callerName: friendName });
    setCallState("calling");

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === "video" ? {
          width: { ideal: 480, max: 640 }, 
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 20 }
        } : false 
      });

      if (type === "video") attachStream(localVideoRef, localStream.current);
      
      socket.emit("callFriend", { 
        receiverId: activeFriend.id, 
        callerName: user.username || user.firstName || "A friend", 
        type 
      });
    } catch (err) { 
      console.error("Media error:", err); 
      endCallCleanup();
    }
  };

  const cancelCall = () => {
    if (!socket || !activeFriend) return;
    socket.emit("cancelDirectCall", { receiverId: activeFriend.id });
    endCallCleanup();
  };

  const endCall = () => {
    if (socket) {
      if (callData) socket.emit("endDirectCall", { roomId: callData.roomId });
      if (activeFriend) socket.emit("cancelDirectCall", { receiverId: activeFriend.id });
    }
    endCallCleanup();
  };

  const acceptCall = async () => {
    if (!socket || !callData) return;
    setCallState("active");
    await setupWebRTC(callData.roomId, false, callData.type === "video");
    socket.emit("acceptDirectCall", { roomId: callData.roomId });
  };

  const rejectCall = () => {
    if (!socket || !callData) return;
    socket.emit("rejectDirectCall", { roomId: callData.roomId });
    endCallCleanup();
  };

  const endCallCleanup = () => {
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    setCallState("idle"); 
    setCallData(null); 
    setIsMicMuted(false);
    iceCandidateQueue.current = [];
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close(); 
      peerConnection.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const setupWebRTC = async (rId: string, isCaller: boolean, isVideo: boolean) => {
    try {
      iceCandidateQueue.current = [];
      
      if (!localStream.current) {
        localStream.current = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: isVideo ? {
            width: { ideal: 480, max: 640 }, 
            height: { ideal: 360, max: 480 },
            frameRate: { ideal: 15, max: 20 },
            facingMode: "user"
          } : false
        });
      }
      
      if (isVideo) attachStream(localVideoRef, localStream.current);

      // 🚀 NAYA LOGIC: Metered API se fresh ICE Servers fetch karo
      console.log("🌐 Fetching fresh TURN Credentials for Friends Call...");
      let dynamicIceServers = [];
      try {
        const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;
        const response = await fetch(`https://yap1.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
        dynamicIceServers = await response.json();
      } catch (err) {
        console.error("Failed to fetch TURN servers, using fallback.", err);
      }

      // 🔥 Initialize connection with fetched Dynamic ICE Servers
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }, // Backup Fast STUN
          ...dynamicIceServers
        ],
        iceCandidatePoolSize: 10,
      });

      localStream.current.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream.current!));

      peerConnection.current.ontrack = (event) => {
        attachStream(remoteVideoRef, event.streams[0]);
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current?.iceConnectionState;
        if (state === "connected" || state === "completed") {
          if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        }
        if (state === "disconnected" || state === "failed" || state === "closed") {
          endCallCleanup();
        }
      };

      connectionTimeoutRef.current = setTimeout(() => {
        if (peerConnection.current && peerConnection.current.iceConnectionState !== "connected") {
          endCallCleanup();
        }
      }, 15000);

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) socket?.emit("ice-candidate", { candidate: event.candidate, roomId: rId });
      };

      if (isCaller) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket?.emit("offer", { offer, roomId: rId });
      }
    } catch (err) { 
      console.error(err); 
      endCallCleanup(); 
    }
  };

  return { 
    callState, callData, localVideoRef, remoteVideoRef, 
    isMicMuted, toggleMic, cancelCall, 
    initiateCall, acceptCall, rejectCall, endCall 
  };
};
