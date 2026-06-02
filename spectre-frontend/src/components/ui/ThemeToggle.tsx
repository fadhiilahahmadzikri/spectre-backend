import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  shape?: 'square' | 'circle'
}

function triggerThemeTransition() {
  const html = document.documentElement
  html.classList.add('theme-transitioning')
  setTimeout(() => html.classList.remove('theme-transitioning'), 400)
}

export default function ThemeToggle({ className, shape = 'square' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  function handleToggle() {
    triggerThemeTransition()
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={handleToggle}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'relative overflow-hidden text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface transition-colors',
        shape === 'circle' ? 'p-2 rounded-full' : 'p-2 rounded-md',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0,   scale: 1, opacity: 1 }}
            exit={{    rotate:  90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Moon className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0,  scale: 1, opacity: 1 }}
            exit={{    rotate: -90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Sun className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
