// src/hooks/useStrangerVoiceChat.ts
import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

export type MatchStatus = "idle" | "searching" | "matched";

export const useStrangerVoiceChat = (socket: Socket | null, user: any) => {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<any[]>([]);
  const pendingOffer = useRef<any>(null); // 🔥 WebRTC Race Condition Fix

  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.on("waitingForVoiceMatch", () => setStatus("searching"));

    socket.on("voiceMatchFound", async ({ roomId }) => {
      setRoomId(roomId);
      setStatus("matched");
      setTimerEnded(false);
      await startVoiceChat(roomId);
      socket.emit("startYap", roomId);
    });

    // 🔥 THE FIX: Skip & Disconnect Logic
    socket.on("strangerSkipped", () => window.location.reload());
    socket.on("peerDisconnected", () => window.location.reload());

    // WebRTC Signaling
    socket.on("offer", async (data: any) => {
      if (!data?.offer) return;

      // Early Offer Queue Logic
      if (!peerConnection.current) {
        pendingOffer.current = data;
        return;
      }

      try {
        if (peerConnection.current.signalingState !== "stable") return;
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        while (iceCandidateQueue.current.length > 0) {
          const queuedCandidate = iceCandidateQueue.current.shift();
          if (queuedCandidate)
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(queuedCandidate),
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
            const queuedCandidate = iceCandidateQueue.current.shift();
            if (queuedCandidate)
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(queuedCandidate),
              );
          }
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!candidate) return;
      try {
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
        console.error("Error adding ice candidate:", err);
      }
    });

    socket.on("timerEnded", () => setTimerEnded(true));

    return () => {
      stopTracks();
      socket.off("waitingForVoiceMatch");
      socket.off("voiceMatchFound");
      socket.off("strangerSkipped");
      socket.off("peerDisconnected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("timerEnded");
    };
  }, [socket, user?.id]);

  const findMatch = () => {
    if (socket) socket.emit("joinVoiceQueue");
  };

  const handleNext = () => {
    stopTracks();
    if (socket) {
      socket.emit("skipVoiceMatch");
      window.location.reload(); // Clean reset!
    }
  };

  const startVoiceChat = async (rId: string) => {
    try {
      iceCandidateQueue.current = [];
      pendingOffer.current = null;
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // 🚀 NAYA LOGIC: Metered API se fresh ICE Servers fetch karo for Voice
      console.log("🌐 Fetching fresh TURN Credentials for Voice Chat...");
      let dynamicIceServers = [];
      try {
        const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;
        const response = await fetch(`https://yap1.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
        dynamicIceServers = await response.json();
      } catch (err) {
        console.error("Failed to fetch TURN servers, using fallback.", err);
      }

      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }, // Backup STUN
          ...dynamicIceServers
        ],
        iceCandidatePoolSize: 10,
      });

      localStream.current
        .getTracks()
        .forEach((track) =>
          peerConnection.current?.addTrack(track, localStream.current!),
        );

      peerConnection.current.ontrack = (event) => {
        if (remoteAudio.current) {
          remoteAudio.current.srcObject = event.streams[0];
          remoteAudio.current
            .play()
            .catch((e) => console.log("Audio play blocked:", e));
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate)
          socket?.emit("ice-candidate", {
            candidate: event.candidate,
            roomId: rId,
          });
      };

      // 🔥 Initiator logic & queued offer logic
      if (pendingOffer.current) {
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
        // 🔥 Robust Initiator Logic
        let isInitiator = false;
        if (rId.includes("-")) {
          isInitiator = rId.split("-")[1] === socket?.id || rId.startsWith(socket?.id || "");
        }
        
        if (isInitiator) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket?.emit("offer", { offer, roomId: rId });
        }
      }
    } catch (err) {
      console.error("Mic access denied:", err);
      setStatus("idle");
    }
  };

  const stopTracks = () => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    if (remoteAudio.current) remoteAudio.current.srcObject = null;
  };

  const toggleMute = () => {
    if (localStream.current) {
      const newMutedState = !isMuted;
      localStream.current.getAudioTracks()[0].enabled = !newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return {
    status,
    isMuted,
    timerEnded,
    roomId,
    remoteAudio,
    findMatch,
    handleNext,
    toggleMute,
  };
};