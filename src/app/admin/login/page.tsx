"use client";
import LoginForm from "@/components/LoginForm";

export default function AdminLoginPage() {
  const handleLogin = (user: any) => {
    window.location.href = "/admin";
  };

  return <LoginForm onLogin={handleLogin} />;
}
