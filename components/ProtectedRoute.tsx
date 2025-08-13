"use client";
import { useAuth } from "@/hooks/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Image src="/logo.png" alt="App Logo" width={120} height={120} priority />
      </div>
    );
  }

  return <>{children}</>;
}
