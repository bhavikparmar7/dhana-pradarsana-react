import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function AppHeader() {
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
              <AvatarImage src="https://github.com/evilrabbit.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Bhavik Parmar</DropdownMenuLabel>
            <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // Replace with your logout logic
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
