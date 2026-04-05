"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/shared/PageTransition";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthMutations } from "@/lib/hooks";
import { apiRequest } from "@/lib/api";

const STEPS = { LOGIN: "login", FORGOT_EMAIL: "forgot_email", FORGOT_CODE: "forgot_code", NEW_PASSWORD: "new_password" };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthMutations();
  const { showToast } = useToast();
  const [step, setStep] = useState(STEPS.LOGIN);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const forgotForm = useForm({ defaultValues: { email: "" } });
  const newPassForm = useForm({ defaultValues: { password: "", confirmPassword: "" } });

  const onLogin = async (values) => {
    try {
      await login.mutateAsync(values);
      showToast("Welcome back!", "success");
      router.push("/");
    } catch (error) {
      showToast(error?.message || "Login failed.", "error");
    }
  };

  const onForgotSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: values });
      setResetEmail(values.email);
      setResetCode(["", "", "", "", "", ""]);
      setStep(STEPS.FORGOT_CODE);
      showToast("Reset code sent to your email.", "success");
    } catch (error) {
      showToast(error?.message || "Something went wrong.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCodeComplete = async (code) => {
    setIsSubmitting(true);
    try {
      await apiRequest("/auth/verify-reset-code", { method: "POST", body: { email: resetEmail, code } });
      setStep(STEPS.NEW_PASSWORD);
    } catch (error) {
      showToast(error?.message || "Invalid code.", "error");
      setResetCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onNewPassword = async (values) => {
    setIsSubmitting(true);
    try {
      const code = resetCode.join("");
      await apiRequest("/auth/reset-password", { method: "POST", body: { email: resetEmail, code, password: values.password } });
      showToast("Password updated! Please sign in.", "success");
      setStep(STEPS.LOGIN);
      newPassForm.reset();
    } catch (error) {
      showToast(error?.message || "Reset failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...resetCode];
    newCode[index] = value;
    setResetCode(newCode);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== "")) onCodeComplete(newCode.join(""));
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !resetCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const newCode = [...resetCode];
    paste.split("").forEach((ch, i) => { newCode[i] = ch; });
    setResetCode(newCode);
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
          <AnimatePresence mode="wait">
            {/* ── STEP: LOGIN ── */}
            {step === STEPS.LOGIN && (
              <motion.div key="login" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
                  <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("email", { required: "Email is required" })}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                      <button type="button" onClick={() => setStep(STEPS.FORGOT_EMAIL)} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...register("password", { required: "Password is required" })}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                    disabled={login.isPending}
                    className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {login.isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Signing in...
                      </span>
                    ) : "Sign In"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-semibold text-slate-900 hover:underline">Create account</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: FORGOT PASSWORD — EMAIL ── */}
            {step === STEPS.FORGOT_EMAIL && (
              <motion.div key="forgot-email" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Reset password</h1>
                  <p className="mt-1 text-sm text-slate-500">We&apos;ll send a 6-digit code to your email</p>
                </div>

                <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Email address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      {...forgotForm.register("email", { required: "Email is required" })}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                    />
                    {forgotForm.formState.errors.email && <p className="mt-1 text-xs text-red-500">{forgotForm.formState.errors.email.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? "Sending..." : "Send Code"}
                  </button>
                </form>

                <button onClick={() => setStep(STEPS.LOGIN)} className="mt-4 flex items-center justify-center gap-1.5 w-full text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Back to sign in
                </button>
              </motion.div>
            )}

            {/* ── STEP: FORGOT PASSWORD — CODE ── */}
            {step === STEPS.FORGOT_CODE && (
              <motion.div key="forgot-code" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Enter code</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    We sent a code to <span className="font-medium text-slate-700">{resetEmail}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2.5 mb-6" onPaste={handleCodePaste}>
                  {resetCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (codeRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      aria-label={`Reset code digit ${i + 1} of 6`}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="h-12 w-11 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-bold text-slate-900 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                    />
                  ))}
                </div>

                {isSubmitting && (
                  <div className="flex justify-center mb-4">
                    <svg className="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  </div>
                )}

                <p className="text-center text-xs text-slate-400">
                  Didn&apos;t receive it?{" "}
                  <button
                    onClick={() => { forgotForm.handleSubmit(onForgotSubmit)({ email: resetEmail }); }}
                    className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Resend code
                  </button>
                </p>

                <button onClick={() => setStep(STEPS.FORGOT_EMAIL)} className="mt-4 flex items-center justify-center gap-1.5 w-full text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Change email
                </button>
              </motion.div>
            )}

            {/* ── STEP: NEW PASSWORD ── */}
            {step === STEPS.NEW_PASSWORD && (
              <motion.div key="new-password" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Set new password</h1>
                  <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account</p>
                </div>

                <form onSubmit={newPassForm.handleSubmit(onNewPassword)} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">New Password</label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        {...newPassForm.register("password", { required: "Password is required", minLength: { value: 8, message: "Min. 8 characters" } })}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} aria-label={showNewPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPassword ? (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </div>
                    {newPassForm.formState.errors.password && <p className="mt-1 text-xs text-red-500">{newPassForm.formState.errors.password.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Confirm Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter password"
                      {...newPassForm.register("confirmPassword", {
                        required: "Please confirm",
                        validate: (val) => val === newPassForm.watch("password") || "Passwords do not match",
                      })}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                    />
                    {newPassForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{newPassForm.formState.errors.confirmPassword.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageTransition>
  );
}
