import { motion, AnimatePresence } from "framer-motion";
import { Circle, ShieldCheck } from "lucide-react";

interface Rule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "upper", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "At least one lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "At least one special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  { id: "space", label: "No spaces allowed", test: (pw) => pw.length > 0 && !/\s/.test(pw) },
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  // Find the FIRST rule that is NOT met
  const activeRule = RULES.find((rule) => !rule.test(password));
  const allMet = password.length > 0 && !activeRule;

  return (
    <div className="relative h-7 mt-3 px-1 overflow-hidden border-l-2 border-[color:var(--label-tertiary)]/20 ml-1">
      <AnimatePresence mode="wait">
        {activeRule ? (
          <motion.div
            key={activeRule.id}
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -25, opacity: 0 }}
            transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                mass: 0.8
            }}
            className="flex items-center gap-2 h-full absolute inset-0 px-2"
          >
            <div className="text-[color:var(--label-tertiary)] opacity-60">
              <Circle size={10} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-mono text-[color:var(--label-secondary)] whitespace-nowrap">
              Requirement: <span className="text-[color:var(--label-primary)]">{activeRule.label}</span>
            </span>
          </motion.div>
        ) : allMet ? (
          <motion.div
            key="all-met"
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 h-full absolute inset-0 px-2"
          >
            <div className="text-[color:var(--success)]">
              <ShieldCheck size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-mono text-[color:var(--success)] font-bold">
              Password Secure
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
