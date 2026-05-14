import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetExchangeRates,
  useGetBestRates,
  useUpsertExchangeRate,
  getGetExchangeRatesQueryKey,
  getGetBestRatesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

const BANKS = ["CBE", "Dashen", "Awash", "Abyssinia"];
const CURRENCIES = ["USD", "EUR"];

export default function ExchangeRates() {
  const qc = useQueryClient();
  const { data: rates } = useGetExchangeRates();
  const { data: best } = useGetBestRates();
  const upsert = useUpsertExchangeRate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bank: "", currency: "USD", buyRate: "", sellRate: "" });

  const grouped = (rates ?? []).reduce<Record<string, Record<string, { buyRate: number; sellRate: number; spread?: number; updatedAt: string }>>>((acc, r) => {
    if (!acc[r.bank]) acc[r.bank] = {};
    acc[r.bank][r.currency] = { buyRate: r.buyRate, sellRate: r.sellRate, spread: r.spread, updatedAt: r.updatedAt };
    return acc;
  }, {});

  function handleSubmit() {
    upsert.mutate(
      { data: { bank: form.bank, currency: form.currency, buyRate: parseFloat(form.buyRate), sellRate: parseFloat(form.sellRate) } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetExchangeRatesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetBestRatesQueryKey() });
          setOpen(false);
          setForm({ bank: "", currency: "USD", buyRate: "", sellRate: "" });
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exchange Rates</h1>
          <p className="text-muted-foreground text-sm mt-1">Live rate comparison across monitored banks.</p>
        </div>
        <Button onClick={() => setOpen(true)}><RefreshCw className="w-4 h-4 mr-2" />Update Rate</Button>
      </div>

      {best && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-xs font-medium text-green-700">Best Buy Rate (USD)</span></div>
              <p className="text-2xl font-bold text-green-800">{best.bestBuyRate.toFixed(4)}</p>
              <p className="text-xs text-green-600 mt-1">{best.bestBuyBank}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-blue-600" /><span className="text-xs font-medium text-blue-700">Best Sell Rate (USD)</span></div>
              <p className="text-2xl font-bold text-blue-800">{best.bestSellRate.toFixed(4)}</p>
              <p className="text-xs text-blue-600 mt-1">{best.bestSellBank}</p>
            </CardContent>
          </Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Average Rate (USD)</p><p className="text-2xl font-bold">{best.averageRate.toFixed(4)}</p><p className="text-xs text-muted-foreground mt-1">Mid-market</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Banks Monitored</p><p className="text-2xl font-bold">{best.monitoredBanks}</p><p className="text-xs text-muted-foreground mt-1">Active feeds</p></CardContent></Card>
        </div>
      )}

      {CURRENCIES.map((currency) => (
        <Card key={currency}>
          <CardHeader><CardTitle className="text-base">{currency} / ETB Rates</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Bank</th>
                  <th className="text-right pb-2 font-medium">Buy Rate</th>
                  <th className="text-right pb-2 font-medium">Sell Rate</th>
                  <th className="text-right pb-2 font-medium">Spread</th>
                  <th className="text-right pb-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {BANKS.map((bank) => {
                  const r = grouped[bank]?.[currency];
                  return (
                    <tr key={bank} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 font-medium">{bank}</td>
                      <td className="py-2.5 text-right font-mono">{r ? r.buyRate.toFixed(4) : "—"}</td>
                      <td className="py-2.5 text-right font-mono">{r ? r.sellRate.toFixed(4) : "—"}</td>
                      <td className="py-2.5 text-right">{r?.spread != null ? <Badge variant="outline" className="font-mono">{r.spread.toFixed(4)}</Badge> : "—"}</td>
                      <td className="py-2.5 text-right text-muted-foreground text-xs">{r ? formatDate(r.updatedAt) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update Exchange Rate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Bank</Label>
              <Select value={form.bank} onValueChange={(v) => setForm((f) => ({ ...f, bank: v }))}>
                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>{BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Buy Rate (ETB)</Label><Input type="number" step="0.0001" value={form.buyRate} onChange={(e) => setForm((f) => ({ ...f, buyRate: e.target.value }))} placeholder="e.g. 57.25" /></div>
              <div className="space-y-1.5"><Label>Sell Rate (ETB)</Label><Input type="number" step="0.0001" value={form.sellRate} onChange={(e) => setForm((f) => ({ ...f, sellRate: e.target.value }))} placeholder="e.g. 57.85" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.bank || !form.buyRate || !form.sellRate || upsert.isPending}>
              {upsert.isPending ? "Saving..." : "Save Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
