import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
import { dummyNotifications } from "@/lib/dummy-data";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChatbotWidget } from "./ChatbotWidget";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/found-items": "Found Items",
  "/lost-items": "Lost Items",
  "/messages": "Messages",
  "/profile": "Profile",
  "/admin": "Admin Panel",
  "/notifications": "Notifications",
};

export function AppLayout() {
  const location = useLocation();
  const unread = dummyNotifications.filter((n) => !n.read).length;
  const title = pageTitles[location.pathname] || "Reunite";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-border bg-card px-4 lg:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>
          </header>
          <main className="flex-1 p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <ChatbotWidget />
      </div>
    </SidebarProvider>
  );
}
