import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import LcManagement from "./pages/LcManagement";
import ImportShipments from "./pages/ImportShipments";
import ImportInventory from "./pages/ImportInventory";
import ExportLots from "./pages/ExportLots";
import ExportShipments from "./pages/ExportShipments";
import CadManagement from "./pages/CadManagement";
import ExchangeRates from "./pages/ExchangeRates";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/lc" component={LcManagement} />
        <Route path="/import-shipments" component={ImportShipments} />
        <Route path="/import-inventory" component={ImportInventory} />
        <Route path="/export-lots" component={ExportLots} />
        <Route path="/export-shipments" component={ExportShipments} />
        <Route path="/cad" component={CadManagement} />
        <Route path="/exchange-rates" component={ExchangeRates} />
        <Route path="/finance" component={Finance} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
