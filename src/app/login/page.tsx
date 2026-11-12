import LoginForm from "@/app/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 text-neutral-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold">Kasir Warung</h1>
        <p className="mb-6 mt-1 text-center text-sm text-neutral-500">
          Masuk untuk melanjutkan
        </p>
        <LoginForm />
      </div>
    </div>
  );
}