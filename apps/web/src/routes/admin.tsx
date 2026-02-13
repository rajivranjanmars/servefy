import { createFileRoute, Outlet, redirect, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, ClipboardList, Plus } from 'lucide-react'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Navigation */}
        <nav className="mb-8 flex flex-wrap items-center gap-4" aria-label="Admin navigation">
          <Link to="/admin">
            <Button variant="ghost">
              <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
              Overview
            </Button>
          </Link>
          <Link to="/admin/surveys">
            <Button variant="ghost">
              <ClipboardList className="h-4 w-4 mr-2" aria-hidden="true" />
              Surveys
            </Button>
          </Link>
          <div className="flex-1" />
          <Link to="/admin/surveys/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Survey
            </Button>
          </Link>
        </nav>

        {/* Admin Content */}
        <Outlet />
      </div>
    </div>
  )
}
