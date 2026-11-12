"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-3">
      <input
        name="username"
        placeholder="Username"
        autoComplete="username"
        autoCapitalize="none"
        className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-orange-500 py-3 text-lg font-bold text-white disabled:bg-neutral-300"
      >
        {pending ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
}