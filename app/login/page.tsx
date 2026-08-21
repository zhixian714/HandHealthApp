"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("帳號或密碼錯誤");
      return;
    }

    // signIn() alone doesn't return the user's role — pull the freshly
    // created session to find out who just logged in, then route accordingly.
    const session = await getSession();
    const role = session?.user?.role;

    if (role === "SUPER_ADMIN" || role === "REGION_ADMIN") {
      router.push("/dashboard"); // 統計報表首頁,尚待開發
    } else {
      router.push("/audit"); // AUDITOR 維持原本的稽核登記頁
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-lg border border-gray-200"
      >
        <h1 className="text-xl font-semibold mb-4 text-gray-900">手部衛生稽核系統登入</h1>

        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-gray-900"
          required
        />

        <label className="block text-sm text-gray-600 mb-1">密碼</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-gray-900"
          required
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          className="w-full bg-teal-700 text-white rounded py-2 font-medium"
        >
          登入
        </button>
      </form>
    </div>
  );
}
