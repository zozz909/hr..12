
"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  CalendarOff,
  Receipt,
  HandCoins,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelRightClose,
  Archive,
  FileText,
  FilePieChart,
  Building2,
  Upload,
} from "lucide-react"
import { usePathname } from 'next/navigation'
import * as React from 'react';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Separator } from "./separator";

const menuItems = [
  { href: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/employees', label: 'جميع الموظفين', icon: Users },
  { href: '/employees/bulk-upload', label: 'رفع ملف Excel', icon: Upload },
  { href: '/employees/archived', label: 'الأرشيف', icon: Archive },
  { href: '/branches', label: 'الفروع', icon: Building2 },
  { href: '/leaves', label: 'الإجازات', icon: CalendarOff },
  { href: '/compensations', label: 'الخصومات والمكافآت', icon: Receipt },
  { href: '/payroll', label: 'الرواتب', icon: HandCoins },
  { href: '/advances', label: 'السلف', icon: Wallet },
  { href: '/forms', label: 'نماذج إدارية', icon: FileText },
  { href: '/reports/simple', label: 'التقارير', icon: FilePieChart },
];

export function Navbar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <TooltipProvider>
    <aside className={cn("flex-shrink-0 border-l bg-sidebar text-sidebar-foreground p-4 flex flex-col transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
      <div className={cn("p-4 mb-4 flex items-center", isCollapsed ? "justify-center" : "justify-start")}>
        <Link href="/" className="flex items-center gap-2">
          <Logo isCollapsed={isCollapsed} />
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                    <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    asChild 
                    className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}
                    >
                    <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                    </Button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="left"><p>{item.label}</p></TooltipContent>}
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}>
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://picsum.photos/40/40" data-ai-hint="person avatar" alt="User avatar" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              {!isCollapsed && 
                <div className="text-right">
                    <p className="text-sm font-medium">مسؤول</p>
                    <p className="text-xs text-muted-foreground">admin@example.com</p>
                </div>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <LogOut className="ml-2 h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator className="my-4"/>
         <Button variant="ghost" onClick={() => setIsCollapsed(!isCollapsed)} className="w-full">
            {isCollapsed ? <PanelRightClose /> : <PanelLeftClose />}
        </Button>
      </div>
    </aside>
    </TooltipProvider>
  )
}
