"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/shared/PageTransition";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthMutations } from "@/lib/hooks";
import { apiRequest } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const { register: registerAuth } = useAuthMutations();
  const { showToast } = useToast();
  const [step, setStep] = useState("form"); // form | verify
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "", firstName: "", lastName: "" },
  });

  const onSubmit = async (values) => {
    try {
      await registerAuth.mutateAsync(values);
      setUserEmail(values.email);
      setStep("verify");
      showToast("Account created! Check your email for a verification code.", "success");
    } catch (error) {
      showToast(error?.message || "Signup failed.", "error");
    }
  };

  const onCodeComplete = async (code) => {
    setIsVerifying(true);
    try {
      await apiRequest("/auth/verify-email", { method: "POST", body: { email: userEmail, code } });
      showToast("Email verified! Welcome to PeptideDosage.", "success");
      router.push("/");
    } catch (error) {
      showToast(error?.message || "Invalid code.", "error");
      setVerifyCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    setIsResending(true);
    try {
      await apiRequest("/auth/resend-verification", { method: "POST", body: { email: userEmail } });
      showToast("New code sent!", "success");
    } catch (error) {
      showToast(error?.message || "Failed to resend.", "error");
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[index] = value;
    setVerifyCode(newCode);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== "")) onCodeComplete(newCode.join(""));
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verifyCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const newCode = [...verifyCode];
    paste.split("").forEach((ch, i) => { newCode[i] = ch; });
    setVerifyCode(newCode);
    const nextEmpty = newCode.findIndex((d) => !d);
    codeRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (newCode.every((d) => d !== "")) onCodeComplete(newCode.join(""));
  };

  const slideVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[440px] rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <Image src="/logo.png" alt="PeptideDosage" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-slate-900">PeptideDosage</span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP: SIGNUP FORM ── */}
            {step === "form" && (
              <motion.div key="signup" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-slate-900">Create an account</h1>
                  <p className="mt-1 text-sm text-slate-500">Get started with personalized peptide protocols</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">First Name</label>
                      <input
                        placeholder="John"
                        {...register("firstName", { required: "Required" })}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                      />
                      {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Last Name</label>
                      <input
                        placeholder="Doe"
                        {...register("lastName")}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      {...register("email", { required: "Email is required" })}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min. 8 characters" } })}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={registerAuth.isPending}
                    className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {registerAuth.isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Creating account...
                      </span>
                    ) : "Create Account"}
                  </button>

                  <p className="text-center text-[11px] text-slate-400 leading-relaxed">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-slate-500 hover:underline">Terms</Link> and{" "}
                    <Link href="/privacy" className="text-slate-500 hover:underline">Privacy Policy</Link>
                  </p>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign in</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: VERIFY CODE ── */}
            {step === "verify" && (
              <motion.div key="verify" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Verify your email</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the 6-digit code sent to<br />
                    <span className="font-medium text-slate-700">{userEmail}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2.5 mb-6" onPaste={handleCodePaste}>
                  {verifyCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (codeRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="h-12 w-11 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-bold text-slate-900 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                    />
                  ))}
                </div>

                {isVerifying && (
                  <div className="flex justify-center mb-4">
                    <svg className="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  </div>
                )}

                <p className="text-center text-xs text-slate-400">
                  Didn&apos;t receive it?{" "}
                  <button onClick={resendCode} disabled={isResending} className="font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50">
                    {isResending ? "Sending..." : "Resend code"}
                  </button>
                </p>

                <button onClick={() => router.push("/")} className="mt-5 flex items-center justify-center gap-1.5 w-full text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Skip for now
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageTransition>
  );
}
