"use client";

export function StudentSignOut() {
  return (
    <button
      className="text-sm font-bold text-orange"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
