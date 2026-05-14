import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Ship, 
  Package, 
  Coffee, 
  PlaneTakeoff, 
  WalletCards, 
  ArrowRightLeft, 
  LineChart, 
  Settings 
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/lc", label: "LC Management", icon: FileText },
    { href: "/import-shipments", label: "Import Shipments", icon: Ship },
    { href: "/import-inventory", label: "Import Inventory", icon: Package },
    { href: "/export-lots", label: "Export Lots", icon: Coffee },
    { href: "/export-shipments", label: "Export Shipments", icon: PlaneTakeoff },
    { href: "/cad", label: "CAD Management", icon: WalletCards },
    { href: "/exchange-rates", label: "Exchange Rates", icon: ArrowRightLeft },
    { href: "/finance", label: "Finance", icon: LineChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary-foreground flex items-center justify-center text-primary font-bold text-xl">
            M
          </div>
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Midas Manager</span>
        </div>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
        &copy; {new Date().getFullYear()} Midas Trading Co.
      </div>
    </aside>
  );
}
