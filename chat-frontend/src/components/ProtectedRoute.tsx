import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = useAuthStore((state) => state.token)
    return token ? <>{children}</> : <Navigate to="/login" replace />
}