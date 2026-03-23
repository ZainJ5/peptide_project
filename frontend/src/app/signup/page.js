"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthMutations } from "@/lib/hooks";

export default function SignupPage() {
  const router = useRouter();
  const { register: registerAuth } = useAuthMutations();
  const { showToast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "", firstName: "", lastName: "" },
  });

  const onSubmit = async (values) => {
    try {
      await registerAuth.mutateAsync(values);
      showToast("Account created successfully.", "success");
      router.push("/");
    } catch (error) {
      showToast(error?.message || "Signup failed.", "error");
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-md">
        <Card className="glass border-white/60 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <h1 className="text-2xl font-bold">Sign up</h1>
          <p className="mt-1 text-sm text-slate-600">Create your secure peptide planning workspace.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">First name</label>
              <input {...register("firstName", { required: "First name is required" })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last name</label>
              <input {...register("lastName")} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input {...register("email", { required: "Email is required" })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input type="password" {...register("password", { required: "Password is required", minLength: 8 })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.password && <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters.</p>}
            </div>

            <Button type="submit" className="w-full" disabled={registerAuth.isPending}>
              {registerAuth.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account? <Link href="/login" className="font-semibold text-(--color-primary)">Login</Link>
          </p>
        </Card>
      </div>
    </PageTransition>
  );
}
