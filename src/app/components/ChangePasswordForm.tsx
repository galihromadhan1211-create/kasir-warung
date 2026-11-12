"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/actions/users";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    changePassword,
    {}
  );
  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-3 text-base";

  return (
    <form action={action} className="space-y-3">
      <input
        name="oldPassword"
        type="password"
        placeholder="Password lama"
        autoComplete="current-password"
        className={input}
      />
      <input
        name="newPassword"
        type="password"
        placeholder="Password baru (min. 6 karakter)"
        autoComplete="new-password"
        className={input}
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Ulangi password baru"
        autoComplete="new-password"
        className={input}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-orange-500 py-3 text-lg font-bold text-white disabled:bg-neutral-300"
      >
        {pending ? "Menyimpan..." : "Simpan password"}
      </button>
    </form>
  );
}