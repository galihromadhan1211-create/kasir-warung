"use client";

import { useState, useTransition } from "react";
import { createUser, resetPassword, deleteUser } from "@/app/actions/users";

type Role = "ADMIN" | "KASIR";
type UserRow = {
  id: number;
  name: string;
  username: string;
  role: Role;
  isSelf: boolean;
};
type Mode = { type: "add" } | { type: "reset"; user: UserRow } | null;

export default function UserManager({ users }: { users: UserRow[] }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("KASIR");
  const [error, setError] = useState("");

  const input =
    "mb-3 mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base";

  function openAdd() {
    setName("");
    setUsername("");
    setPassword("");
    setRole("KASIR");
    setError("");
    setMode({ type: "add" });
  }

  function openReset(user: UserRow) {
    setPassword("");
    setError("");
    setMode({ type: "reset", user });
  }

  function submit() {
    if (!mode) return;
    setError("");
    startTransition(async () => {
      const r: { error?: string } =
        mode.type === "add"
          ? await createUser({ name, username, password, role })
          : await resetPassword(mode.user.id, password);
      if (r.error) setError(r.error);
      else setMode(null);
    });
  }

  function remove(user: UserRow) {
    if (!confirm(`Hapus akun "${user.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteUser(user.id);
      if (r.error) alert(r.error);
    });
  }

  return (
    <div className={pending ? "opacity-70" : ""}>
      <button
        onClick={openAdd}
        className="mb-3 w-full rounded-xl bg-neutral-800 py-3 font-semibold text-white active:scale-95"
      >
        + Tambah akun
      </button>

      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {u.name}
                  {u.isSelf && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      (kamu)
                    </span>
                  )}
                </div>
                <div className="text-sm text-neutral-500">@{u.username}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  u.role === "ADMIN"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {u.role === "ADMIN" ? "Admin" : "Kasir"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => openReset(u)}
                className="flex-1 rounded-lg border border-neutral-300 py-2 text-sm font-medium"
              >
                Reset password
              </button>
              {!u.isSelf && (
                <button
                  onClick={() => remove(u)}
                  className="flex-1 rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600"
                >
                  Hapus
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {mode && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {mode.type === "add"
                  ? "Tambah akun"
                  : `Reset password: ${mode.user.name}`}
              </h2>
              <button
                onClick={() => setMode(null)}
                className="rounded-lg px-3 py-1 text-neutral-600"
              >
                Tutup ✕
              </button>
            </div>

            {mode.type === "add" && (
              <>
                <label className="text-sm font-medium">Nama</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={input}
                />
                <label className="text-sm font-medium">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  className={input}
                />
                <label className="text-sm font-medium">Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className={`${input} bg-white`}
                >
                  <option value="KASIR">Kasir</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </>
            )}

            <label className="text-sm font-medium">
              {mode.type === "add" ? "Password" : "Password baru"}
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              autoComplete="off"
              className={input}
            />

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={pending}
              className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white disabled:bg-neutral-300"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}