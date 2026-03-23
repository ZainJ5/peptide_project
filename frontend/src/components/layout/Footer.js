"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 4000);
    }
  };

  return (
    <>
      <footer className="mt-20 w-full border-t border-slate-200 bg-slate-950 text-slate-300">
        {/* Main Footer Content */}
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
            {/* Brand Section */}
            <div className="lg:col-span-5">
              <Link href="/" className="group inline-flex items-center gap-4">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="MyPeptideDosage logo"
                    width={64}
                    height={64}
                    className="h-14 w-14 rounded-2xl border border-slate-700 bg-white object-contain p-1.5 shadow-inner transition-all duration-300 group-hover:rotate-3"
                  />
                  <div className="absolute -inset-1 rounded-3xl bg-linear-to-br from-sky-500/10 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-[2px] text-slate-400">RESEARCH PLATFORM</p>
                  <p className="text-2xl font-semibold tracking-tighter text-white">MyPeptideDosage</p>
                </div>
              </Link>

              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-slate-400">
                Precision dosage calculators, peer-reviewed peptide protocols, and research tools built for scientists and clinicians who demand accuracy.
              </p>

              {/* Premium Social Icons */}
              <div className="mt-10 flex items-center gap-4">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:shadow-[#1877F2]/30"
                >
                  <FacebookRoundedIcon sx={{ fontSize: 22 }} className="transition-transform duration-200 group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:shadow-[#0A66C2]/30"
                >
                  <LinkedInIcon sx={{ fontSize: 22 }} className="transition-transform duration-200 group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  aria-label="YouTube"
                  className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white hover:shadow-[#FF0000]/30"
                >
                  <YouTubeIcon sx={{ fontSize: 22 }} className="transition-transform duration-200 group-hover:scale-110" />
                </a>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-[1px] text-white">PLATFORM</h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/" className="block transition-colors hover:text-white">Home</Link></li>
                <li><Link href="/library" className="block transition-colors hover:text-white">Peptide Library</Link></li>
                <li><Link href="/schedule" className="block transition-colors hover:text-white">Schedule Builder</Link></li>
                <li><Link href="/videos" className="block transition-colors hover:text-white">Video Library</Link></li>
                <li><Link href="/community" className="block transition-colors hover:text-white">Community</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-[1px] text-white">ACCOUNT</h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/login" className="block transition-colors hover:text-white">Sign In</Link></li>
                <li><Link href="/signup" className="block transition-colors hover:text-white">Create Account</Link></li>
                <li><Link href="/community?type=request-peptide" className="block transition-colors hover:text-white">Request Peptide</Link></li>
                <li><a href="mailto:feedback@mypeptidedosage.com" className="block transition-colors hover:text-white">Feedback</a></li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold tracking-[1px] text-white">COMPANY</h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/privacy" className="block transition-colors hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="block transition-colors hover:text-white">Terms of Service</Link></li>
                <li><a href="mailto:support@mypeptidedosage.com" className="block transition-colors hover:text-white">Support</a></li>
              </ul>

              <Paper
                elevation={0}
                className="mt-12 rounded-3xl border border-slate-700 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800"
                sx={{ p: 2.5 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
                  <SupportAgentRoundedIcon sx={{ fontSize: 20, color: "#38bdf8" }} />
                  <Typography sx={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em" }}>
                    CONTACT
                  </Typography>
                </Box>

                <Typography sx={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, mb: 2 }}>
                  Reach our research support team for protocol and platform guidance.
                </Typography>

                <Chip
                  component="a"
                  href="mailto:support@mypeptidedosage.com"
                  icon={<EmailRoundedIcon sx={{ color: "#0ea5e9 !important" }} />}
                  label="support@mypeptidedosage.com"
                  clickable
                  sx={{
                    height: 36,
                    borderRadius: "10px",
                    mb: 1,
                    color: "#e2e8f0",
                    bgcolor: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    "& .MuiChip-label": { px: 1.1, fontWeight: 600 },
                    "&:hover": { bgcolor: "rgba(14,165,233,0.18)", borderColor: "rgba(56,189,248,0.8)" },
                  }}
                />

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <AccessTimeRoundedIcon sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                    Mon–Fri, 9:00 AM – 6:00 PM
                  </Typography>
                </Box>
              </Paper>
            </div>
          </div>
        </div>

        {/* Newsletter Bar */}
        <div className="border-t border-slate-800 bg-slate-900">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:flex lg:items-center lg:justify-between lg:py-12">
            <div className="max-w-md">
              <p className="text-lg font-semibold text-white">Stay ahead in peptide research</p>
              <p className="mt-2 text-sm text-slate-400">
                Monthly deep-dives, new protocol calculators, safety updates, and early access to beta tools.
              </p>
            </div>

            {isSubscribed ? (
              <Alert
                severity="success"
                className="mt-6 lg:mt-0"
                sx={{
                  borderRadius: "14px",
                  bgcolor: "rgba(6,95,70,0.35)",
                  color: "#bbf7d0",
                  border: "1px solid rgba(16,185,129,0.4)",
                  "& .MuiAlert-icon": { color: "#34d399" },
                }}
              >
                Thank you. You’re now on the list.
              </Alert>
            ) : (
              <Box
                component="form"
                onSubmit={handleSubscribe}
                className="mt-6 w-full max-w-xl lg:mt-0"
                sx={{ display: "flex", gap: 1.2, alignItems: "stretch" }}
              >
                <TextField
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@research.email"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: <EmailRoundedIcon sx={{ color: "#64748b", mr: 1, fontSize: 20 }} />,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 48,
                      borderRadius: "14px",
                      color: "#f8fafc",
                      bgcolor: "#020617",
                      "& fieldset": { borderColor: "rgba(148,163,184,0.32)" },
                      "&:hover fieldset": { borderColor: "rgba(56,189,248,0.65)" },
                      "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
                    },
                    "& .MuiInputBase-input::placeholder": { color: "#64748b", opacity: 1 },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendRoundedIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    minWidth: 142,
                    px: 2.25,
                    borderRadius: "14px",
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#f8fafc",
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    boxShadow: "0 12px 24px rgba(2,132,199,0.28)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                      boxShadow: "0 14px 30px rgba(14,165,233,0.3)",
                    },
                  }}
                >
                  Subscribe
                </Button>
              </Box>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-slate-500 md:flex md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} MyPeptideDosage. All rights reserved.</p>
            <p className="mt-3 md:mt-0">Built for precision • Designed for researchers</p>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="border-t border-slate-800 bg-slate-900/70">
          <div className="mx-auto max-w-7xl px-6 py-6 text-center text-[13px] leading-relaxed text-rose-300/90">
            Disclaimer: All content on MyPeptideDosage is for educational and research purposes only. It does not constitute medical advice, diagnosis, or treatment. Consult a licensed healthcare professional before using any peptide protocol.
          </div>
        </div>
      </footer>
    </>
  );
}