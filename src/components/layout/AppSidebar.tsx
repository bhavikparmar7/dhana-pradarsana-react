import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { BarChart2, FileText, ArrowRightLeft, IndianRupee } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";


// Define the menu items with icons and paths
const items = [
  {
    title: "Balance Sheet",
    path: "/balance-sheet",
    icon: BarChart2,
  },
  {
    title: "Transactions",
    path: "/transactions",
    icon: ArrowRightLeft,
  },
  {
    title: "File Statements",
    path: "/file-statements",
    icon: FileText,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="hidden md:flex border-r bg-background">
      <SidebarContent>
<SidebarHeader className="h-14 px-4">
  <span className="flex items-center gap-3 w-full h-full transition-all duration-300 ease-in-out group-data-[collapsible=icon]:justify-center">
    <IndianRupee
      className="w-7 h-7 text-primary transition-all duration-300 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:min-w-8 group-data-[collapsible=icon]:min-h-8"
    />
    <span
      className="text-xl font-semibold text-gray-800 whitespace-nowrap transition-all duration-500 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:translate-x-2 group-data-[collapsible=icon]:w-0 overflow-hidden"
    >
      Dhana Bandhana
    </span>
  </span>
</SidebarHeader>


        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      asChild
                    >
                      <button
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="transition-all duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:overflow-hidden">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
