// src/hooks/useWebRTC.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

export const useWebRTC = (socket: Socket | null, roomId: string) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // 🔥 The waiting lines for early network data
  const iceCandidateQueue = useRef<any[]>([]);
  const pendingOffer = useRef<any>(null); // Naya: Early offer ko save karega

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const stopMedia = useCallback(() => {
    localStream.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    iceCandidateQueue.current = [];
    pendingOffer.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

const startCall = useCallback(async () => {
    try {
      stopMedia(); 
      iceCandidateQueue.current = [];

      // 🔥 FIX: Sirf ek baar optimized call karein
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: {
          width: { ideal: 480, max: 640 }, 
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 20 },
          facingMode: "user"
        } 
      });

      if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;

      // 🚀 NAYA LOGIC: Metered API se direct fresh ICE Servers fetch karo
      console.log("🌐 Fetching fresh TURN Credentials...");
      let dynamicIceServers = [];
      try {
        // 🔥 API Key ab .env se aayegi
        const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;
        const response = await fetch(`https://yap1.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
        dynamicIceServers = await response.json();
      } catch (err) {
        console.error("Failed to fetch TURN servers, using fallback.", err);
      }

      console.log("🌐 Initializing RTCPeerConnection...");
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          // 1. Google STUN (Backup)
          { urls: "stun:stun.l.google.com:19302" },
          // 2. Metered.ca Dynamic Servers
          ...dynamicIceServers
        ],
        iceCandidatePoolSize: 10,
      });
      
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // 3. Jab samne wale ka video aaye, seedha ref mein daal do (No state needed!)
      peerConnection.current.ontrack = (event) => {
        if (
          remoteVideoRef.current &&
          remoteVideoRef.current.srcObject !== event.streams[0]
        ) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && socket && roomId) {
          socket.emit("ice-candidate", { candidate: event.candidate, roomId });
        }
      };

      // 🔥 THE MAGIC FIX: Agar camera permission lete waqt Offer aa gaya tha, toh usko ab process karo
      if (pendingOffer.current) {
        console.log("Processing queued offer...");
        const data = pendingOffer.current;
        pendingOffer.current = null;

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );
        while (iceCandidateQueue.current.length > 0) {
          const q = iceCandidateQueue.current.shift();
          if (q)
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(q),
            );
        }
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket?.emit("answer", { answer, roomId: data.roomId });
      } else {
        // Agar koi Offer nahi aaya, aur hum "Initiator" hain, toh Offer bhejo
        const isInitiator = roomId.split("-")[1] === socket?.id;
        if (isInitiator) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket?.emit("offer", { offer, roomId });
        }
      }
    } catch (err) {
      console.error("Media access denied:", err);
    }
  }, [socket, roomId, stopMedia]);

  // SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    socket.on("offer", async (data: any) => {
      if (!data?.offer) return;

      // 🔥 Agar connection ready nahi hai, toh Offer ko save kar lo!
      if (!peerConnection.current) {
        console.log("Saving early offer...");
        pendingOffer.current = data;
        return;
      }

      try {
        if (peerConnection.current.signalingState !== "stable") return;
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        while (iceCandidateQueue.current.length > 0) {
          const q = iceCandidateQueue.current.shift();
          if (q)
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(q),
            );
        }

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { answer, roomId: data.roomId });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("answer", async (data: any) => {
      if (!data?.answer || !peerConnection.current) return;
      try {
        if (peerConnection.current.signalingState === "have-local-offer") {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );

          while (iceCandidateQueue.current.length > 0) {
            const q = iceCandidateQueue.current.shift();
            if (q)
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(q),
              );
          }
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }: any) => {
      if (!candidate) return;
      try {
        // 🔥 Early ICE candidates ko bhi queue mein daalo chahe connection null hi kyu na ho
        if (
          !peerConnection.current ||
          !peerConnection.current.remoteDescription
        ) {
          iceCandidateQueue.current.push(candidate);
        } else {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket]);

  // ... Mic / Camera toggles remain same
  const toggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks()[0].enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    startCall,
    stopMedia,
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  };
};