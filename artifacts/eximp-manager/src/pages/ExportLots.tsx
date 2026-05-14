import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetExportLots,
  useGetExportStockSummary,
  useCreateExportLot,
  useUpdateExportLot,
  getGetExportLotsQueryKey,
  getGetExportStockSummaryQueryKey,
} from "@workspace/api-client-react";
import type { ExportLot, ExportLotInput } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  raw: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  grading: "bg-purple-100 text-purple-700",
  awaiting_qc: "bg-yellow-100 text-yellow-700",
  ready_to_ship: "bg-green-100 text-green-700",
  shipped: "bg-emerald-100 text-emerald-700",
};

const COMMODITIES = ["All", "Coffee", "Sesame", "Lentils", "Chickpeas", "Flaxseed"];
const LOT_STATUSES = ["raw", "processing", "grading", "awaiting_qc", "ready_to_ship", "shipped"];

function LotForm({ initial, onSave, onCancel, loading }: {
  initial: Partial<ExportLotInput>;
  onSave: (d: ExportLotInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [f, setF] = useState<Partial<ExportLotInput>>(initial);
  const set = (k: keyof ExportLotInput, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Lot ID *</Label><Input value={f.lotId ?? ""} onChange={(e) => set("lotId", e.target.value)} placeholder="LOT-COF-001" /></div>
        <div className="space-y-1.5"><Label>ECX Reference</Label><Input value={f.ecxReference ?? ""} onChange={(e) => set("ecxReference", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Commodity *</Label>
          <Select value={f.commodity ?? ""} onValueChange={(v) => set("commodity", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{COMMODITIES.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Grade *</Label><Input value={f.grade ?? ""} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. Grade 1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Origin *</Label><Input value={f.origin ?? ""} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. Yirgacheffe" /></div>
        <div className="space-y-1.5"><Label>Processing Method</Label><Input value={f.processingMethod ?? ""} onChange={(e) => set("processingMethod", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Quantity (MT) *</Label><Input type="number" step="0.01" value={f.quantityMt ?? ""} onChange={(e) => set("quantityMt", parseFloat(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>Bags *</Label><Input type="number" value={f.bags ?? ""} onChange={(e) => set("bags", parseInt(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Price ETB/kg *</Label><Input type="number" step="0.01" value={f.priceEtbPerKg ?? ""} onChange={(e) => set("priceEtbPerKg", parseFloat(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>FOB Price USD/MT</Label><Input type="number" step="0.01" value={f.fobPriceUsdMt ?? ""} onChange={(e) => set("fobPriceUsdMt", parseFloat(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Warehouse *</Label><Input value={f.warehouse ?? ""} onChange={(e) => set("warehouse", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Status</Label>
          <Select value={f.status ?? "raw"} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LOT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Phyto Expiry</Label><Input type="date" value={f.phytoExpiry ?? ""} onChange={(e) => set("phytoExpiry", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Certifications</Label><Input value={f.certifications ?? ""} onChange={(e) => set("certifications", e.target.value)} /></div>
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading || !f.lotId || !f.commodity || !f.grade || !f.origin || !f.quantityMt || !f.bags || !f.priceEtbPerKg || !f.warehouse}
          onClick={() => onSave(f as ExportLotInput)}>
          {loading ? "Saving..." : "Save Lot"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function ExportLots() {
  const qc = useQueryClient();
  const [commodity, setCommodity] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [editLot, setEditLot] = useState<ExportLot | null>(null);

  const params = commodity !== "All" ? { commodity } : undefined;
  const { data: lots } = useGetExportLots(params);
  const { data: stockSummary } = useGetExportStockSummary();
  const create = useCreateExportLot();
  const update = useUpdateExportLot();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetExportLotsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetExportStockSummaryQueryKey() });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Lots</h1>
          <p className="text-muted-foreground text-sm mt-1">Commodity purchase lots for export.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />New Lot</Button>
      </div>

      {stockSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Coffee (MT)</p><p className="text-2xl font-bold mt-1">{stockSummary.coffeeMt.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Oilseeds (MT)</p><p className="text-2xl font-bold mt-1">{stockSummary.oilseedsMt.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pulses (MT)</p><p className="text-2xl font-bold mt-1">{stockSummary.pulsesMt.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Purchase Value</p><p className="text-lg font-bold mt-1">{formatCurrency(stockSummary.totalPurchaseValueEtb)}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <Tabs value={commodity} onValueChange={setCommodity}>
            <TabsList>{COMMODITIES.map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}</TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Lot ID</th>
                <th className="text-left px-4 py-3 font-medium">Commodity</th>
                <th className="text-left px-4 py-3 font-medium">Grade</th>
                <th className="text-left px-4 py-3 font-medium">Origin</th>
                <th className="text-right px-4 py-3 font-medium">Qty (MT)</th>
                <th className="text-right px-4 py-3 font-medium">Price/kg</th>
                <th className="text-right px-4 py-3 font-medium">FOB USD/MT</th>
                <th className="text-left px-4 py-3 font-medium">Warehouse</th>
                <th className="text-left px-4 py-3 font-medium">Phyto Expiry</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(lots ?? []).map((lot) => (
                <tr key={lot.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{lot.lotId}</td>
                  <td className="px-4 py-3">{lot.commodity}</td>
                  <td className="px-4 py-3">{lot.grade}</td>
                  <td className="px-4 py-3">{lot.origin}</td>
                  <td className="px-4 py-3 text-right font-mono">{lot.quantityMt.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(lot.priceEtbPerKg)}</td>
                  <td className="px-4 py-3 text-right">{lot.fobPriceUsdMt != null ? `USD ${lot.fobPriceUsdMt.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3">{lot.warehouse}</td>
                  <td className="px-4 py-3">{formatDate(lot.phytoExpiry)}</td>
                  <td className="px-4 py-3"><Badge className={`${STATUS_STYLES[lot.status] ?? ""} text-xs`} variant="outline">{lot.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditLot(lot)}><Pencil className="w-3.5 h-3.5" /></Button></td>
                </tr>
              ))}
              {(lots ?? []).length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No lots found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Export Lot</DialogTitle></DialogHeader>
          <LotForm initial={{}} loading={create.isPending} onCancel={() => setCreateOpen(false)}
            onSave={(data) => create.mutate({ data }, { onSuccess: () => { invalidate(); setCreateOpen(false); } })} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLot} onOpenChange={(o) => !o && setEditLot(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Lot — {editLot?.lotId}</DialogTitle></DialogHeader>
          {editLot && (
            <LotForm initial={editLot} loading={update.isPending} onCancel={() => setEditLot(null)}
              onSave={(data) => update.mutate({ id: editLot.id, data }, { onSuccess: () => { invalidate(); setEditLot(null); } })} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
