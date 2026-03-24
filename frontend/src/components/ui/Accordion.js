"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50/50"
            >
              <div className="flex items-center gap-3.5">
                <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors sm:flex ${open ? "bg-(--color-primary) text-white" : "bg-slate-100 text-slate-500"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={`text-[15px] font-semibold transition-colors ${open ? "text-slate-900" : "text-slate-700"}`}>
                  {item.title}
                </span>
              </div>
              <svg
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pl-6 sm:pl-17 text-[15px] leading-relaxed text-slate-600">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
