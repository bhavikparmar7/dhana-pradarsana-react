// src/components/layout/layout.tsx
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { AppHeader } from "@/components/layout/AppHeader"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
  <div className="flex w-screen min-h-screen bg-background text-foreground overflow-hidden">
    <AppSidebar />
    <div className="flex-1 flex flex-col w-full">
      <AppHeader />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  </div>
</SidebarProvider>

  )
}
