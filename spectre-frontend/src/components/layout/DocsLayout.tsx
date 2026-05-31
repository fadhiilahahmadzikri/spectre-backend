import { Outlet } from 'react-router-dom'
import DocsTopbar from './DocsTopbar'
import DocsSidebar from './DocsSidebar'

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-neutral-canvas flex flex-col">
      <DocsTopbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — sticky */}
        <div className="hidden lg:flex sticky top-16 h-[calc(100vh-64px)]">
          <DocsSidebar />
        </div>
        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
