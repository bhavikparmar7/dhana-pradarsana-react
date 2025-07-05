
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function AppHeader() {
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("firebase_jwt");
    if (!token) return;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3050";
    fetch(`${apiBaseUrl}/users/by-userid`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // API returns: { userId, phone, name }
        setUser({
          name: data.name || "User",
          // No avatarUrl in API, fallback to default
        });
      })
      .catch(() => setUser({ name: "User" }));
  }, []);

  return (
    <header className="sticky top-0 z-10 h-14 px-4 flex items-center justify-between bg-background border-b shadow-sm">
      {/* Left: Sidebar toggle */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="p-1" />
      </div>

      {/* Right: Avatar with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
            <Avatar className="h-8 w-8">
          <AvatarImage src={"https://github.com/evilrabbit.png"} />
          <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>{user?.name || "User"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              // Sign out from Firebase Auth to stop token refresh
              const { signOut } = await import("firebase/auth");
              const { auth } = await import("@/lib/firebase");
              await signOut(auth);
              localStorage.removeItem("firebase_jwt");
              window.location.href = "/login";
            }}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
