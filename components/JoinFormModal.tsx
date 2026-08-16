"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitForm } from "@/lib/forms";

// Applications are emailed via Web3Forms to the verified account (infinitetutoringmelb@gmail.com).

const areas = [
  "Manningham (Doncaster, Bulleen, Templestowe)",
  "Ivanhoe",
  "Heidelberg",
  "Macleod",
  "Rosanna",
  "Northcote",
  "Thornbury",
  "Preston",
  "Nearby areas to the suburbs above",
];

type Field = {
  name: string;
  label: string;
  help?: string;
  type: "radio" | "text" | "tel" | "textarea";
  required: boolean;
};

const fields: Field[] = [
  { name: "read_description", label: "Have you read the description above?", type: "radio", required: true },
  { name: "high_school_student", label: "Are you a high school student?", type: "radio", required: true },
  {
    name: "aware_of_pay",
    label:
      "Are you aware this job pays from $15/hr up to $20/hr, and is designed for hardworking high school students?",
    type: "radio",
    required: true,
  },
  { name: "name", label: "What is your name?", type: "text", required: true },
  { name: "age", label: "What is your age?", type: "text", required: true },
  {
    name: "area",
    label: "What area can you work?",
    help: "You must be continuously available to work in this area (suburb); however, sometimes you might be asked to work in another area (suburb).",
    type: "text",
    required: true,
  },
  {
    name: "transport",
    label:
      "Do you have a bike/scooter or any mode of transport that will help you distribute leaflets quicker?",
    type: "text",
    required: true,
  },
  { name: "contact_number", label: "What is your contact number?", type: "tel", required: true },
  {
    name: "honest_reliable",
    label: "This job is for those who are honest and reliable. Do you fit both criteria?",
    type: "radio",
    required: true,
  },
  {
    name: "extra_responses",
    label: "Optional space for responses",
    help: "Anything else you'd like us to know? (optional)",
    type: "textarea",
    required: false,
  },
];

type Status = "idle" | "submitting" | "success" | "error";

export default function JoinFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot — if filled, silently ignore (bot)
    if (data.get("botcheck")) return;

    // Build a readable payload keyed by the question text
    const payload: Record<string, string> = {};
    fields.forEach((f) => {
      payload[f.label] = (data.get(f.name) as string) || "—";
    });

    setStatus("submitting");
    try {
      const ok = await submitForm(payload, {
        subject: "New Distributor Application — Infinite Distribution",
        from_name: "Join The Team — Infinite Distribution",
      });
      if (ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="my-6 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-electric to-[#3a2bd6] px-7 py-6 text-white sm:px-9">
              <button
                aria-label="Close"
                onClick={onClose}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Hiring Form
              </h2>
              <p className="mt-1 text-white/80">Infinite Distribution</p>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-electric to-[#3a2bd6] text-white">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold text-ink">Application sent!</h3>
                <p className="mt-2 max-w-sm text-slate-600">
                  Thanks for applying to Infinite Distribution. We&apos;ll review your details and be
                  in touch soon.
                </p>
                <button onClick={onClose} className="btn-primary mt-7">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-7 py-7 sm:px-10">
                {/* Intro */}
                <div className="space-y-5 border-b border-slate-100 pb-7 text-[15px] leading-relaxed text-slate-600">
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">About the Company</h3>
                    <p className="mt-1">
                      Infinite Distribution provides marketing solutions for clients by delivering
                      promotional material directly to residential letterboxes.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">About the Job</h3>
                    <p className="mt-1">
                      This is an ongoing contract-based role. You will be paid per completed leaflet
                      drop rather than by the hour. Payment is based on the number of leaflets
                      delivered, with an expected completion timeframe. On average, this works out to
                      approximately <span className="font-semibold text-ink">$16–$20 per hour</span>,
                      depending on efficiency. The role involves walking through designated areas and
                      delivering leaflets to residential letterboxes.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">Areas We Are Hiring For</h3>
                    <p className="mt-1">We are currently seeking workers in the following areas:</p>
                    <ul className="mt-2 space-y-1">
                      {areas.map((a) => (
                        <li key={a} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Honeypot */}
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />

                {/* Questions */}
                <div className="space-y-7 pt-7">
                  {fields.map((f, i) => (
                    <div key={f.name}>
                      <label className="block font-semibold text-ink">
                        <span className="mr-1.5 text-electric">{i + 1}.</span>
                        {f.label}
                        {f.required && <span className="text-electric"> *</span>}
                      </label>
                      {f.help && <p className="mt-1 text-sm text-slate-500">{f.help}</p>}

                      {f.type === "radio" ? (
                        <div className="mt-3 flex gap-3">
                          {["Yes", "No"].map((opt) => (
                            <label
                              key={opt}
                              className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-electric/50 has-[:checked]:border-electric has-[:checked]:bg-electric/5"
                            >
                              <input
                                type="radio"
                                name={f.name}
                                value={opt}
                                required={f.required}
                                className="h-4 w-4 accent-electric"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : f.type === "textarea" ? (
                        <textarea
                          name={f.name}
                          required={f.required}
                          rows={4}
                          className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-ink outline-none transition focus:border-electric focus:bg-white focus:ring-4 focus:ring-electric/10"
                        />
                      ) : (
                        <input
                          type={f.type}
                          name={f.name}
                          required={f.required}
                          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-ink outline-none transition focus:border-electric focus:bg-white focus:ring-4 focus:ring-electric/10"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {status === "error" && (
                  <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                  </p>
                )}

                <div className="sticky bottom-0 -mx-7 mt-8 border-t border-slate-100 bg-white px-7 pt-5 sm:-mx-9 sm:px-9">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "submitting" ? "Sending…" : "Submit Application"}
                  </button>
                  <p className="mt-3 pb-1 text-center text-xs text-slate-400">
                    Your application is sent securely to Infinite Distribution.
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
