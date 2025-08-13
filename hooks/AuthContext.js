"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "./use-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const login = async (email, password) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        setUser({ uid: userCredential.user.uid, ...userDoc.data() });
      } else {
        setError("No user profile found");
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "No user profile found for this account.",
        });
        await signOut(auth);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your email and password and try again.",
      });
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() });
          toast({
            variant: "success",
            title: "Welcome Back",
            description: `Hello ${userDoc.data().prenom} ${userDoc.data().nom} !`,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
