import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import DocsTopbar from './DocsTopbar'
import DocsSidebar from './DocsSidebar'

export default function DocsLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-canvas dark:bg-neutral-canvas">
      <DocsTopbar onMenuToggle={() => setMobileNavOpen(v => !v)} />

      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar desktop — kolom tetap */}
        <div className="hidden lg:flex flex-shrink-0 overflow-y-auto">
          <DocsSidebar />
        </div>

        {/* Sidebar mobile — overlay dari kiri */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden fixed top-0 left-0 h-full z-50 overflow-y-auto shadow-xl"
              >
                <DocsSidebar onClose={() => setMobileNavOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
