
"use client"

import React, { useState } from "react"
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar"
import {
  User,
  Bot,
  FileText,
  Calendar,
  CircleGauge,
  History,
  Home
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProfileSheet } from "@/components/dashboard/profile-sheet"
import { DashboardProvider } from "@/contexts/dashboard-context"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  return (
    <DashboardProvider>
      <SidebarProvider>
        <div className="relative flex min-h-screen w-full flex-col">
          <DashboardHeader onOpenProfile={() => setIsProfileSheetOpen(true)} />
          <div className="flex flex-1">
            <Sidebar>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard" isActive>
                      <Home />
                      Dashboard
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarSeparator />
                  <SidebarGroup>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/dashboard/profile">
                        <User />
                        User Information
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="#">
                        <Bot />
                        AI Tools
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="#">
                        <FileText />
                        Note
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="#">
                        <Calendar />
                        Calendar
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="#">
                        <CircleGauge />
                        Compressor
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="#">
                        <History />
                        Export's History
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarGroup>
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter>
                {/* Footer content if any */}
              </SidebarFooter>
            </Sidebar>
            <div className="flex flex-col w-full">
              <SidebarInset>
                {children}
              </SidebarInset>
            </div>
          </div>
          <ProfileSheet
            isOpen={isProfileSheetOpen}
            onOpenChange={setIsProfileSheetOpen}
          />
        </div>
      </SidebarProvider>
    </DashboardProvider>
  )
}
