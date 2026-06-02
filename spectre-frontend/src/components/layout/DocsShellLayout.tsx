import { Outlet } from 'react-router-dom'
import DocsTopbar from './DocsTopbar'

export default function DocsShellLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-canvas dark:bg-neutral-canvas">
      <DocsTopbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
