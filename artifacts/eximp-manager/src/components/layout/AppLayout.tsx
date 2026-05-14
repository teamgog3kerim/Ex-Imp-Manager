import React from "react";
import { Sidebar } from "./Sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="w-96 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search LCs, shipments, CADs..." 
              className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
