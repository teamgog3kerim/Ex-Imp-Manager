import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLcs,
  useGetLcSummary,
  useCreateLc,
  useUpdateLc,
  useDeleteLc,
  getGetLcsQueryKey,
  getGetLcSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Lc, LCInput, LcStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  approved: "bg-blue-100 text-blue-700",
  settled: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
};

const BANKS = ["CBE", "Dashen", "Awash", "Abyssinia"];
const STATUSES: LcStatus[] = ["draft", "approved", "settled", "expired"];

function LcForm({ initial, onSave, onCancel, loading }: {
  initial: Partial<LCInput>;
  onSave: (d: LCInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [f, setF] = useState<Partial<LCInput>>(initial);
  const set = (k: keyof LCInput, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>LC Number *</Label><Input value={f.lcNumber ?? ""} onChange={(e) => set("lcNumber", e.target.value)} placeholder="LC-2024-001" /></div>
        <div className="space-y-1.5"><Label>PI Number *</Label><Input value={f.piNumber ?? ""} onChange={(e) => set("piNumber", e.target.value)} placeholder="PI-001" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Supplier *</Label><Input value={f.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Bank *</Label>
          <Select value={f.bank ?? ""} onValueChange={(v) => set("bank", v)}>
            <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent>{BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Value (USD) *</Label><Input type="number" value={f.valueUsd ?? ""} onChange={(e) => set("valueUsd", parseFloat(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>Opening Cost (ETB) *</Label><Input type="number" value={f.openingCostEtb ?? ""} onChange={(e) => set("openingCostEtb", parseFloat(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Terms *</Label><Input value={f.terms ?? ""} onChange={(e) => set("terms", e.target.value)} placeholder="e.g. 90 days sight" /></div>
        <div className="space-y-1.5"><Label>Margin %</Label><Input type="number" step="0.01" value={f.marginPct ?? ""} onChange={(e) => set("marginPct", parseFloat(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>EC Number</Label><Input value={f.ecNumber ?? ""} onChange={(e) => set("ecNumber", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>EC Expiry</Label><Input type="date" value={f.ecExpiry ?? ""} onChange={(e) => set("ecExpiry", e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label>Notes</Label><Input value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={loading || !f.lcNumber || !f.piNumber || !f.supplier || !f.bank || !f.valueUsd || !f.terms || !f.openingCostEtb}
          onClick={() => onSave(f as LCInput)}
        >
          {loading ? "Saving..." : "Save LC"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function LcManagement() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editLc, setEditLc] = useState<Lc | null>(null);
  const [deleteLc, setDeleteLc] = useState<Lc | null>(null);

  const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
  const { data: lcs } = useGetLcs(params);
  const { data: summary } = useGetLcSummary();
  const create = useCreateLc();
  const update = useUpdateLc();
  const del = useDeleteLc();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetLcsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLcSummaryQueryKey() });
  };

  const filtered = (lcs ?? []).filter((lc) =>
    !search || lc.lcNumber.toLowerCase().includes(search.toLowerCase()) || lc.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LC Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Letters of Credit — import financing.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New LC</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Credit Facility</p><p className="text-xl font-bold mt-1">USD {summary.creditFacility.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Credit Used</p><p className="text-xl font-bold mt-1 text-orange-600">USD {summary.creditUsed.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Available</p><p className="text-xl font-bold mt-1 text-green-600">USD {summary.creditAvailable.toLocaleString()}</p></CardContent></Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className="text-xl font-bold mt-1">{summary.utilizationPct?.toFixed(1) ?? "—"}%</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(summary.utilizationPct ?? 0, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            <Input className="max-w-xs" placeholder="Search LC# or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">LC #</th>
                <th className="text-left px-4 py-3 font-medium">PI #</th>
                <th className="text-left px-4 py-3 font-medium">Supplier</th>
                <th className="text-left px-4 py-3 font-medium">Bank</th>
                <th className="text-right px-4 py-3 font-medium">Value (USD)</th>
                <th className="text-left px-4 py-3 font-medium">Terms</th>
                <th className="text-right px-4 py-3 font-medium">Margin%</th>
                <th className="text-left px-4 py-3 font-medium">Opening Cost</th>
                <th className="text-left px-4 py-3 font-medium">EC Expiry</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lc) => (
                <tr key={lc.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono font-medium text-xs"><div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-muted-foreground" />{lc.lcNumber}</div></td>
                  <td className="px-4 py-3">{lc.piNumber}</td>
                  <td className="px-4 py-3">{lc.supplier}</td>
                  <td className="px-4 py-3">{lc.bank}</td>
                  <td className="px-4 py-3 text-right font-mono">{lc.valueUsd.toLocaleString()}</td>
                  <td className="px-4 py-3">{lc.terms}</td>
                  <td className="px-4 py-3 text-right">{lc.marginPct != null ? `${lc.marginPct}%` : "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(lc.openingCostEtb)}</td>
                  <td className="px-4 py-3">{formatDate(lc.ecExpiry)}</td>
                  <td className="px-4 py-3"><Badge className={`${STATUS_STYLES[lc.status] ?? ""} capitalize`} variant="outline">{lc.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditLc(lc)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteLc(lc)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No LCs found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Letter of Credit</DialogTitle></DialogHeader>
          <LcForm initial={{}} loading={create.isPending} onCancel={() => setCreateOpen(false)}
            onSave={(data) => create.mutate({ data }, { onSuccess: () => { invalidate(); setCreateOpen(false); } })} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLc} onOpenChange={(o) => !o && setEditLc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit LC — {editLc?.lcNumber}</DialogTitle></DialogHeader>
          {editLc && (
            <LcForm initial={editLc} loading={update.isPending} onCancel={() => setEditLc(null)}
              onSave={(data) => update.mutate({ id: editLc.id, data }, { onSuccess: () => { invalidate(); setEditLc(null); } })} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteLc} onOpenChange={(o) => !o && setDeleteLc(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete LC</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{deleteLc?.lcNumber}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLc(null)}>Cancel</Button>
            <Button variant="destructive" disabled={del.isPending}
              onClick={() => del.mutate({ id: deleteLc!.id }, { onSuccess: () => { invalidate(); setDeleteLc(null); } })}>
              {del.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
