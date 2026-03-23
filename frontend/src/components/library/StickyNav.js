"use client";

import { useEffect, useState } from "react";

export default function StickyNav({ sections }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav className="flex flex-col gap-1">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeSection === section.id
              ? "bg-(--color-primary) text-white shadow-md shadow-blue-900/10"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
