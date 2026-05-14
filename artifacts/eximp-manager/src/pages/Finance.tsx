import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetFinanceSummary,
  useGetCashFlow,
  useGetTransactions,
  useGetPettyCashEntries,
  useGetPettyCashSummary,
  useCreatePettyCashEntry,
  getGetPettyCashEntriesQueryKey,
  getGetPettyCashSummaryQueryKey,
} from "@workspace/api-client-react";
import type { PettyCashInput } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus } from "lucide-react";

const TX_TYPE_STYLES: Record<string, string> = {
  import: "bg-blue-100 text-blue-700",
  export: "bg-green-100 text-green-700",
  petty: "bg-gray-100 text-gray-700",
};

const TX_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
};

const OBLIGATION_SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

const RECEIPT_STATUS_STYLES: Record<string, string> = {
  attached: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  none: "bg-red-100 text-red-700",
};

const PETTY_CATEGORIES = ["Transport", "Meals", "Stationery", "Utilities", "Maintenance", "Communication", "Other"];

function OverviewTab() {
  const { data: finance } = useGetFinanceSummary();
  const { data: cashFlow } = useGetCashFlow();

  return (
    <div className="space-y-6 mt-4">
      {finance && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Main Account (ETB)</p><p className="text-xl font-bold mt-1">{formatCurrency(finance.mainAccountEtb)}</p></CardContent></Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">LC Credit Facility</p>
                <p className="text-xl font-bold mt-1">USD {finance.lcCreditFacilityUsd.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Used: USD {finance.lcCreditUsedUsd.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">NBE USD Retention</p>
                <p className="text-xl font-bold mt-1">USD {(finance.nbeRetentionUsd ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">30% mandatory</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Net Profit Margin</p>
                <p className="text-xl font-bold mt-1 text-green-600">{finance.netProfitMargin}%</p>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(finance.netProfitEtb)}</p>
              </CardContent>
            </Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Import Payables</p><p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(finance.importPayablesEtb)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Export Receivables</p><p className="text-xl font-bold mt-1 text-green-600">USD {finance.exportReceivablesUsd.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inventory Value</p><p className="text-xl font-bold mt-1">{formatCurrency(finance.inventoryValueEtb)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-xl font-bold mt-1">{formatCurrency(finance.totalSalesEtb)}</p></CardContent></Card>
          </div>

          {(finance.upcomingObligations ?? []).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Upcoming Obligations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(finance.upcomingObligations ?? []).map((ob, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs ${OBLIGATION_SEVERITY_STYLES[ob.severity] ?? ""}`} variant="outline">{ob.severity}</Badge>
                        <span className="text-sm font-medium">{ob.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{ob.currency} {ob.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(ob.dueDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Cash Flow (ETB)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
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
  );
}

function TransactionsTab() {
  const { data: transactions } = useGetTransactions();
  return (
    <div className="mt-4">
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-right px-4 py-3 font-medium">Amount (ETB)</th>
                <th className="text-left px-4 py-3 font-medium">Direction</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Bank</th>
                <th className="text-left px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((tx) => (
                <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{tx.description}</td>
                  <td className="px-4 py-3">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${TX_TYPE_STYLES[tx.type] ?? ""}`} variant="outline">{tx.type}</Badge></td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(tx.amountEtb)}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${tx.direction === "in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`} variant="outline">
                      {tx.direction === "in" ? "In" : "Out"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${TX_STATUS_STYLES[tx.status] ?? ""}`} variant="outline">{tx.status}</Badge></td>
                  <td className="px-4 py-3">{tx.bank ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{tx.reference ?? "—"}</td>
                </tr>
              ))}
              {(transactions ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No transactions found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PettyCashTab() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: entries } = useGetPettyCashEntries();
  const { data: summary } = useGetPettyCashSummary();
  const create = useCreatePettyCashEntry();
  const [f, setF] = useState<Partial<PettyCashInput>>({ receiptStatus: "pending" });
  const set = (k: keyof PettyCashInput, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetPettyCashEntriesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetPettyCashSummaryQueryKey() });
  };

  return (
    <div className="space-y-6 mt-4">
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Opening Balance</p><p className="text-xl font-bold mt-1">{formatCurrency(summary.openingBalance)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Disbursed</p><p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(summary.totalDisbursed)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Closing Balance</p><p className="text-xl font-bold mt-1 text-green-600">{formatCurrency(summary.closingBalance)}</p></CardContent></Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ceiling / Max Voucher</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(summary.ceiling)}</p>
              <p className="text-xs text-muted-foreground mt-1">Max: {formatCurrency(summary.maxPerVoucher)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setF({ receiptStatus: "pending" }); setCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New Voucher
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Voucher #</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Requested By</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Balance After</th>
                <th className="text-left px-4 py-3 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {(entries ?? []).map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs">{e.voucherNumber}</td>
                  <td className="px-4 py-3">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">{e.description}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">{e.requestedBy}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(e.amountEtb)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(e.balanceAfterEtb)}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${RECEIPT_STATUS_STYLES[e.receiptStatus] ?? ""}`} variant="outline">{e.receiptStatus}</Badge></td>
                </tr>
              ))}
              {(entries ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No vouchers found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Petty Cash Voucher</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={f.date ?? ""} onChange={(e) => set("date", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Amount (ETB) *</Label><Input type="number" value={f.amountEtb ?? ""} onChange={(e) => set("amountEtb", parseFloat(e.target.value))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description *</Label><Input value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Category *</Label>
                <Select value={f.category ?? ""} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PETTY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Receipt Status</Label>
                <Select value={f.receiptStatus ?? "pending"} onValueChange={(v) => set("receiptStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attached">Attached</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Requested By *</Label><Input value={f.requestedBy ?? ""} onChange={(e) => set("requestedBy", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Approved By</Label><Input value={f.approvedBy ?? ""} onChange={(e) => set("approvedBy", e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={create.isPending || !f.date || !f.description || !f.category || !f.requestedBy || !f.amountEtb}
              onClick={() => create.mutate({ data: f as PettyCashInput }, { onSuccess: () => { invalidate(); setCreateOpen(false); } })}
            >
              {create.isPending ? "Saving..." : "Create Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Finance() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground text-sm mt-1">Financial overview, transactions, and petty cash management.</p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="petty-cash">Petty Cash</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="petty-cash"><PettyCashTab /></TabsContent>
      </Tabs>
    </div>
  );
}
