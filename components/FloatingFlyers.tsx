"use client";

import { motion } from "framer-motion";

const flyers = [
  { left: "8%", top: "18%", size: 54, delay: 0, dur: 9, rot: -12 },
  { left: "82%", top: "22%", size: 70, delay: 1.2, dur: 11, rot: 14 },
  { left: "16%", top: "68%", size: 46, delay: 0.6, dur: 8, rot: 8 },
  { left: "74%", top: "70%", size: 60, delay: 1.8, dur: 12, rot: -10 },
  { left: "46%", top: "12%", size: 40, delay: 2.4, dur: 10, rot: 6 },
  { left: "90%", top: "52%", size: 38, delay: 0.9, dur: 9.5, rot: -6 },
];

function Envelope({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 100 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="98" height="70" rx="10" fill="#fff" stroke="#dbe4f3" strokeWidth="2" />
      <path d="M4 8 L50 40 L96 8" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="14" y="50" width="38" height="5" rx="2.5" fill="#bfdbfe" />
      <rect x="14" y="58" width="24" height="4" rx="2" fill="#dbeafe" />
    </svg>
  );
}

export default function FloatingFlyers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {flyers.map((f, i) => (
        <motion.div
          key={i}
          className="absolute drop-shadow-[0_18px_30px_rgba(37,99,235,0.18)]"
          style={{ left: f.left, top: f.top }}
          initial={{ opacity: 0, y: 30, rotate: f.rot }}
          animate={{
            opacity: [0, 0.9, 0.9],
            y: [30, -18, 30],
            rotate: [f.rot, f.rot + 8, f.rot],
          }}
          transition={{
            duration: f.dur,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Envelope size={f.size} />
        </motion.div>
      ))}
    </div>
  );
}
