"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { setStoredAuth } from "@/lib/auth";

export default function Loginform() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!userId.trim() || !password.trim()) {
      setError("Please enter your user ID and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          password,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof (payload as { message?: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Login failed. Please try again.";

        throw new Error(message);
      }

      const token = payload?.data?.token;
      const user = payload?.data?.user ?? {};

      if (typeof token !== "string" || !token.trim()) {
        throw new Error("Login succeeded, but no JWT token was returned.");
      }

      setStoredAuth(token, user);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] ">
      <div className="space-y-3">
        <Image src="/logo.png" alt="Preproute logo" height={34} width={135} />
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#111827]">
            Login
          </h1>
          <p className="text-sm leading-6 text-[#4B5563]">
            Use your company provided login credentials.
          </p>
        </div>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#374151]">User ID</span>
          <input
            name="userId"
            type="text"
            autoComplete="username"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="w-full rounded-2xl border border-[#D6E1F2] bg-[#F8FBFF] px-4 py-3.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5988EF] focus:bg-white focus:ring-4 focus:ring-[#5988EF]/10"
            placeholder="Enter user ID"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#374151]">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-[#D6E1F2] bg-[#F8FBFF] px-4 py-3.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5988EF] focus:bg-white focus:ring-4 focus:ring-[#5988EF]/10"
            placeholder="Enter password"
          />
        </label>

        <div className="flex items-center ">
          <button
            type="button"
            className="text-sm font-medium text-[#1B5DEF] transition hover:text-[#1248c7]"
          >
            Forgot password?
          </button>
        </div>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[#5988EF] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(89,136,239,0.28)] transition duration-200 hover:bg-[#4f7de2] hover:shadow-[0_16px_34px_rgba(89,136,239,0.34)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
