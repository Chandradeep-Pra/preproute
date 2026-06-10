"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { clearStoredAuth, getStoredUser } from "@/lib/auth";

type StoredUser = {
  name?: string;
  fullName?: string;
  role?: string;
  email?: string;
  profileImage?: string;
  profile_image?: string;
  "profile-image"?: string;
  avatar?: string;
  image?: string;
};

export default function Topbar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(getStoredUser<StoredUser>());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearStoredAuth();
      router.replace("/login");
    }
  }

  const displayName = user?.name ?? user?.fullName ?? "Name";
  const role = user?.role ?? "Admin";
  const profileImage =
    user?.profileImage ??
    user?.profile_image ??
    user?.["profile-image"] ??
    user?.avatar ??
    user?.image ??
    "/default-user-image.png";

  return (
    <div className="mb-2 flex w-full justify-end border-b border-slate-200 items-center px-4 py-2">
      <div className="flex items-center gap-2" ref={menuRef}>
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative flex items-center gap-3 rounded-2xl px-3 py-2">
          <div className="relative h-10 w-10 overflow-visible rounded-full border-2 border-[#6366F1] bg-[#FFD284] shadow-sm">
            <Image
              src={profileImage}
              alt={`${displayName} avatar`}
              fill
              unoptimized={!profileImage.startsWith("/")}
              sizes="40px"
              className="object-cover"
              style={{ top: "-4px",left:"-1px" }}
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[#374151]">{displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Open user menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isOpen ? (
              <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
