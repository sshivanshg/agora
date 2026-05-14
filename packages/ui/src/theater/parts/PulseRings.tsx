"use client";
import { AnimatePresence, motion } from "motion/react";

interface PulseRingsProps {
  /** When true, rings are mounted and visible. */
  active: boolean;
  reduceMotion?: boolean;
}

export function PulseRings({ active, reduceMotion = false }: PulseRingsProps) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.g
          key="pulse-rings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <circle r={44} stroke="#ea9518" strokeWidth={1.2} fill="none" opacity={0.6}>
            {!reduceMotion && (
              <>
                <animate attributeName="r" values="44;70" dur="3.2s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  values="0.6;0"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
          <circle r={46} stroke="#ea9518" strokeWidth={1.2} fill="none" opacity={0.6}>
            {!reduceMotion && (
              <>
                <animate
                  attributeName="r"
                  values="46;77"
                  dur="3.2s"
                  begin="-1.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0"
                  dur="3.2s"
                  begin="-1.6s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
        </motion.g>
      ) : null}
    </AnimatePresence>
  );
}
