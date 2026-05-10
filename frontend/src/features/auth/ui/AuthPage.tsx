import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaceIDGlyph } from "@/shared/icons";
import { useAuthUi, type AuthMode } from "../model/auth-ui-store";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { VideoShowcase } from "./VideoShowcase";

interface AuthPageProps {
  initialMode?: AuthMode;
}

const slideVariants = {
  initial: (direction: number) => ({ opacity: 0, x: 24 * direction }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -24 * direction }),
};

const directionFor: Record<AuthMode, number> = {
  signin: -1,
  signup: 1,
};

export function AuthPage({ initialMode }: AuthPageProps) {
  const mode = useAuthUi((s) => s.mode);
  const setMode = useAuthUi((s) => s.setMode);
  const toggle = useAuthUi((s) => s.toggle);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current && initialMode) {
      setMode(initialMode);
      seededRef.current = true;
    }
  }, [initialMode, setMode]);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-[52%] lg:w-[48%] xl:w-[44%] min-h-[100dvh] flex flex-col relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(130, 170, 255, 0.08) 0%, transparent 70%)" }}
        />
        <header className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
          <div className="flex items-center gap-2 text-[color:var(--label-primary)]">
            <FaceIDGlyph size={22} />
            <span className="face-title text-[14px]">Spectre</span>
          </div>
          <div className="text-[12px] text-[color:var(--label-secondary)]">
            {mode === "signin" ? "Signing in" : "Creating account"}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-10">
          <AnimatePresence mode="wait" custom={directionFor[mode]}>
            <motion.div
              key={mode}
              custom={directionFor[mode]}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex items-center justify-center"
            >
              {mode === "signin" ? <SignInForm /> : <SignUpForm />}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="px-6 md:px-10 pb-6 pt-4 flex items-center justify-between text-[11px] text-[color:var(--label-tertiary)]">
          <button
            type="button"
            onClick={toggle}
            className="hover:text-[color:var(--label-primary)] transition-colors"
          >
            Switch to {mode === "signin" ? "sign up" : "sign in"}
          </button>
          <span className="font-mono">spectre.faces</span>
        </footer>
      </aside>

      <div className="hidden md:block flex-1 relative min-h-[100dvh]">
        <VideoShowcase />
      </div>
    </div>
  );
}
