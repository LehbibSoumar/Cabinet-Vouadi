"use client";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ["/login", "/register"];
  const isPublic = publicRoutes.includes(pathname);

  return isPublic ? children : <ProtectedRoute>{children}</ProtectedRoute>;
}
