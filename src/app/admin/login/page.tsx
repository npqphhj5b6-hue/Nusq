"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
      <div className="bg-white border border-[#E5E2DC] rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-lg font-bold text-[#1C1C1C] mb-1">nusq admin</h1>
        <p className="text-sm text-[#737373] mb-6">Sign in to review drafts.</p>

        <form action={action} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-3 py-2 text-sm border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#1B4F72] bg-white text-[#1C1C1C]"
          />
          {state?.error && (
            <p className="text-xs text-red-500">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 text-sm font-medium bg-[#1B4F72] text-white rounded-lg hover:bg-[#154060] transition-colors disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
