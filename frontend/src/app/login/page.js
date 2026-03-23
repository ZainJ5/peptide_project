"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthMutations } from "@/lib/hooks";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthMutations();
  const { showToast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      await login.mutateAsync(values);
      showToast("Welcome back. Login successful.", "success");
      router.push("/");
    } catch (error) {
      showToast(error?.message || "Login failed.", "error");
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-md">
        <Card className="glass border-white/60 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="mt-1 text-sm text-slate-600">Access your premium schedule dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input {...register("email", { required: "Email is required" })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input type="password" {...register("password", { required: "Password is required" })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            New here? <Link href="/signup" className="font-semibold text-(--color-primary)">Create an account</Link>
          </p>
        </Card>
      </div>
    </PageTransition>
  );
}
