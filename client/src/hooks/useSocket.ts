import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "../lib/api"; // 🔥 Import kiya

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Connect to the Socket.IO server using central URL
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);
        console.log(`Connecting to Socket.IO server at ${SERVER_URL}...`);
        
        // Cleanup on unmount
        return () => {
            newSocket.disconnect();
        }
    }, []);

    return socket;
}