"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { 
  signInWithPopup, signOut, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { useRouter } from "next/navigation";

export type AppUser = {
  id: string;
  username: string | null;
  email: string;
  imageUrl: string;
} | null;

type AuthContextType = {
  user: AppUser;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (e: string, p: string, u: string) => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 🔥 FIX 1: Initial state localStorage se uthao (SSR hydration error se bachne ke liye window check)
  const [user, setUser] = useState<AppUser>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("yap-user");
      if (cached) return JSON.parse(cached);
    }
    return null;
  });

  // 🔥 FIX 2: Agar localStorage mein user hai, toh loading ko pehle se hi false rakho!
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("yap-user");
    }
    return true;
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const isRegistering = useRef(false); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (isRegistering.current) return;

        try {
          const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
          const baseName = firebaseUser.displayName ? firebaseUser.displayName.replace(/\s+/g, '') : "User";
          const safeUsername = firebaseUser.displayName || `${baseName}${Math.floor(1000 + Math.random() * 9000)}`;

          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              imageUrl: firebaseUser.photoURL || "",
              username: safeUsername 
            }),
          });
          
          const data = await res.json();
          
          const currentUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            username: data.user?.username || safeUsername, 
            imageUrl: data.user?.imageUrl || data.user?.image_url || firebaseUser.photoURL || "",
          };

          // 🔥 FIX 3: Naya user data local storage mein save karo
          setUser(currentUser);
          localStorage.setItem("yap-user", JSON.stringify(currentUser));

        } catch (err) {
          console.error("Sync error", err);
        }
      } else {
        // 🔥 FIX 4: Agar log out ho gaya, toh localStorage saaf karo
        setUser(null);
        localStorage.removeItem("yap-user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshTrigger]); 

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signUpWithEmail = async (email: string, pass: string, username: string) => {
    isRegistering.current = true; 
    
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: username });
    
    const res = await fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cred.user.uid,
        email: email,
        username: username,
        imageUrl: "",
      }),
    });

    if (!res.ok) {
      console.error("Neon DB Error:", await res.text());
      throw new Error("Database sync failed. Try again.");
    }
    
    isRegistering.current = false; 
    setRefreshTrigger(prev => prev + 1);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    // 🔥 FIX 5: Logout karte hi turant storage clear kardo
    localStorage.removeItem("yap-user");
    await signOut(auth);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, logout, 
      refreshUser: () => setRefreshTrigger(prev => prev + 1) 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);