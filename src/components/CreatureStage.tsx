import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { useAppStore } from "../store";
import styles from "./CreatureStage.module.css";

interface CreatureStageProps {
  children: ReactNode;
  /** Changes on every move; each change plays a gentle shake-off. */
  pulseKey?: number;
  calm?: boolean;
  /** Play the calm transformation on mount (e.g. the Tame result) instead of starting calm. */
  animateIn?: boolean;
}

// Animates a wrapper around whichever creature component is inside, so it works with
// the placeholder now and Creature.tsx later without touching that file.
// MotionConfig in App.tsx turns these off when reduced motion is on.
export default function CreatureStage({ children, pulseKey = 0, calm = false, animateIn = false }: CreatureStageProps) {
  const controls = useAnimationControls();
  const isFirst = useRef(true);
  // MotionConfig skips movement but still fades opacity; make the glow instant too.
  const reducedMotion = useAppStore((state) => state.settings.reducedMotion);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    void controls.start({
      scale: [1, 0.9, 1.05, 1],
      rotate: [0, -3, 3, 0],
      transition: { duration: 0.45, ease: "easeOut" },
    });
  }, [pulseKey, controls]);

  const hidden = { opacity: 0, scale: 0.6 };

  return (
    <div className={styles.stage}>
      <motion.div
        className={styles.glow}
        aria-hidden="true"
        initial={animateIn ? hidden : false}
        animate={calm ? { opacity: 1, scale: 1 } : hidden}
        transition={{ duration: reducedMotion ? 0 : 1.2, ease: "easeOut" }}
      />
      <motion.div className={styles.creature} animate={controls}>
        <motion.div
          initial={animateIn ? { scale: 0.9 } : false}
          animate={{ scale: calm ? 1.06 : 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
