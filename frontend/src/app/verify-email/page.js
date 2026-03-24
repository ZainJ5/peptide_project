"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthMutations } from "@/lib/hooks";
import { Suspense, useEffect } from "react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const { verifyEmail: verifyAuth } = useAuthMutations();
  const { showToast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (!email) {
      router.replace("/signup");
    }
  }, [email, router]);

  if (!email) return null;

  const onSubmit = async (values) => {
    try {
      await verifyAuth.mutateAsync({ email, code: values.code });
      showToast("Email verified successfully. Welcome!", "success");
      router.push("/");
    } catch (error) {
      showToast(error?.message || "Verification failed.", "error");
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-md">
        <Card className="glass border-white/60 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="mt-1 text-sm text-slate-600">
            We sent a verification code to <strong>{email}</strong>. Please enter it below.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Verification Code</label>
              <input 
                {...register("code", { required: "Code is required", minLength: 6, maxLength: 6 })} 
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-xl tracking-widest font-mono" 
                placeholder="123456"
                maxLength={6}
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">Please enter the 6-digit code.</p>}
            </div>

            <Button type="submit" className="w-full" disabled={verifyAuth.isPending}>
              {verifyAuth.isPending ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md p-6 text-center">Loading...</div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
