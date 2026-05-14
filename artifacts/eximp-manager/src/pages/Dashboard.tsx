import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetTradeVolume,
  useGetFinanceSummary,
  useGetCashFlow,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Ship, FileText, AlertTriangle, TrendingUp, Clock, CheckCircle } from "lucide-react";

function KpiCard({ title, value, sub, icon: Icon, accent }: { title: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${accent ?? "bg-primary/10"}`}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
  success: "bg-green-100 text-green-800",
};

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();
  const { data: activity } = useGetRecentActivity();
  const { data: volume } = useGetTradeVolume();
  const { data: finance } = useGetFinanceSummary();
  const { data: cashFlow } = useGetCashFlow();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Executive overview — Midas Trading Co.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Active Shipments" value={summary?.totalShipments ?? "—"} icon={Ship} />
        <KpiCard title="Active LCs" value={summary?.activeLcs ?? "—"} icon={FileText} />
        <KpiCard title="Customs at Risk" value={summary?.customsAtRisk ?? "—"} icon={AlertTriangle} accent="bg-red-100" />
        <KpiCard title="Total Revenue" value={finance ? formatCurrency(finance.totalSalesEtb) : "—"} icon={TrendingUp} />
        <KpiCard title="On-Time Rate" value={summary ? `${summary.onTimeRate}%` : "—"} icon={CheckCircle} accent="bg-green-100" />
        <KpiCard title="LC Processing" value={summary ? `${summary.lcProcessingDays}d` : "—"} sub="avg days" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trade Volume (ETB)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={volume ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="imports" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" name="Imports" />
                <Area type="monotone" dataKey="exports" stroke="#10b981" fill="#10b98120" name="Exports" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Flow (ETB)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlow ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[3, 3, 0, 0]} />
                <Bar dataKey="outflow" fill="hsl(var(--primary))" name="Outflow" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(activity ?? []).map((item) => (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <Badge className={`text-xs shrink-0 mt-0.5 ${SEVERITY_STYLES[item.severity] ?? ""}`} variant="outline">
                    {item.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Finance Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Main Account</span>
                <span className="font-medium">{finance ? formatCurrency(finance.mainAccountEtb) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LC Credit Used</span>
                <span className="font-medium">{finance ? `USD ${finance.lcCreditUsedUsd.toLocaleString()}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Import Payables</span>
                <span className="font-medium">{finance ? formatCurrency(finance.importPayablesEtb) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Export Receivables</span>
                <span className="font-medium">{finance ? `USD ${finance.exportReceivablesUsd.toLocaleString()}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory Value</span>
                <span className="font-medium">{finance ? formatCurrency(finance.inventoryValueEtb) : "—"}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Net Profit Margin</span>
                <span className="font-bold text-green-600">{finance ? `${finance.netProfitMargin}%` : "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
