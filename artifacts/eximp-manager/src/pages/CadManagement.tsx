import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCads,
  useGetCadPaymentSummary,
  useCreateCad,
  useUpdateCad,
  getGetCadsQueryKey,
  getGetCadPaymentSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Cad, CADInput, CADUpdate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { Plus, Pencil, WalletCards } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  docs_submitted: "bg-purple-100 text-purple-700",
  negotiating: "bg-yellow-100 text-yellow-700",
  awaiting_payment: "bg-orange-100 text-orange-700",
  received: "bg-green-100 text-green-700",
  docs_incomplete: "bg-red-100 text-red-700",
};

const CAD_STATUSES = ["active", "docs_submitted", "negotiating", "awaiting_payment", "received", "docs_incomplete"];
const CAD_TYPES = ["CAD", "LC", "TT", "DP"];

function CreateCadForm({ onSave, onCancel, loading }: {
  onSave: (d: CADInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [f, setF] = useState<Partial<CADInput>>({ cadType: "CAD", status: "active" });
  const set = (k: keyof CADInput, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>CAD Ref *</Label><Input value={f.cadRef ?? ""} onChange={(e) => set("cadRef", e.target.value)} placeholder="CAD-2024-001" /></div>
        <div className="space-y-1.5"><Label>Type *</Label>
          <Select value={f.cadType ?? "CAD"} onValueChange={(v) => set("cadType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CAD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Buyer *</Label><Input value={f.buyer ?? ""} onChange={(e) => set("buyer", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Buyer Country *</Label><Input value={f.buyerCountry ?? ""} onChange={(e) => set("buyerCountry", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Destination *</Label><Input value={f.destination ?? ""} onChange={(e) => set("destination", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Commodity *</Label><Input value={f.commodity ?? ""} onChange={(e) => set("commodity", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>FOB USD *</Label><Input type="number" step="0.01" value={f.fobUsd ?? ""} onChange={(e) => set("fobUsd", parseFloat(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>Quantity (MT)</Label><Input type="number" step="0.01" value={f.quantityMt ?? ""} onChange={(e) => set("quantityMt", parseFloat(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Payment Terms *</Label><Input value={f.paymentTerms ?? ""} onChange={(e) => set("paymentTerms", e.target.value)} placeholder="e.g. 60 days" /></div>
        <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={f.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label>Status</Label>
        <Select value={f.status ?? "active"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Missing Docs</Label><Input value={f.missingDocs ?? ""} onChange={(e) => set("missingDocs", e.target.value)} /></div>
      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading || !f.cadRef || !f.buyer || !f.buyerCountry || !f.destination || !f.commodity || !f.fobUsd || !f.paymentTerms}
          onClick={() => onSave(f as CADInput)}>
          {loading ? "Saving..." : "Create CAD"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function UpdateCadForm({ cad, onSave, onCancel, loading }: {
  cad: Cad;
  onSave: (d: CADUpdate) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [f, setF] = useState<CADUpdate>({ status: cad.status, dueDate: cad.dueDate ?? undefined, missingDocs: cad.missingDocs ?? undefined });
  const set = (k: keyof CADUpdate, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-4 py-1">
      <div className="space-y-1.5"><Label>Status</Label>
        <Select value={f.status ?? cad.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={f.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Received Date</Label><Input type="date" value={f.receivedDate ?? ""} onChange={(e) => set("receivedDate", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>ETB Equiv</Label><Input type="number" value={f.etbEquiv ?? ""} onChange={(e) => set("etbEquiv", parseFloat(e.target.value))} /></div>
        <div className="space-y-1.5"><Label>ETB Converted</Label><Input type="number" value={f.etbConverted ?? ""} onChange={(e) => set("etbConverted", parseFloat(e.target.value))} /></div>
      </div>
      <div className="space-y-1.5"><Label>Missing Docs</Label><Input value={f.missingDocs ?? ""} onChange={(e) => set("missingDocs", e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading} onClick={() => onSave(f)}>
          {loading ? "Saving..." : "Update CAD"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function CadManagement() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCad, setEditCad] = useState<Cad | null>(null);

  const { data: cads } = useGetCads();
  const { data: paymentSummary } = useGetCadPaymentSummary();
  const create = useCreateCad();
  const update = useUpdateCad();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetCadsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetCadPaymentSummaryQueryKey() });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CAD Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Cash Against Documents — export payment collection.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />New CAD</Button>
      </div>

      {paymentSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total FOB</p><p className="text-xl font-bold mt-1">USD {paymentSummary.totalFobUsd.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Received</p><p className="text-xl font-bold mt-1 text-green-600">USD {paymentSummary.receivedUsd.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold mt-1 text-orange-600">USD {paymentSummary.outstandingUsd.toLocaleString()}</p></CardContent></Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">NBE Retained (30%)</p>
              <p className="text-xl font-bold mt-1">USD {paymentSummary.usdRetained.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">ETB {paymentSummary.etbConverted.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active CADs</p><p className="text-2xl font-bold mt-1">{paymentSummary.activeCads}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Awaiting Payment</p><p className="text-2xl font-bold mt-1 text-yellow-600">{paymentSummary.pendingPayment}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Payments Received</p><p className="text-2xl font-bold mt-1 text-green-600">{paymentSummary.paymentsReceived}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">CAD Register</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">CAD Ref</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Buyer</th>
                <th className="text-left px-4 py-3 font-medium">Country</th>
                <th className="text-left px-4 py-3 font-medium">Commodity</th>
                <th className="text-right px-4 py-3 font-medium">FOB USD</th>
                <th className="text-right px-4 py-3 font-medium">NBE Retained</th>
                <th className="text-left px-4 py-3 font-medium">Terms</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(cads ?? []).map((cad) => (
                <tr key={cad.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs font-medium"><div className="flex items-center gap-1.5"><WalletCards className="w-3.5 h-3.5 text-muted-foreground" />{cad.cadRef}</div></td>
                  <td className="px-4 py-3">{cad.cadType}</td>
                  <td className="px-4 py-3 font-medium">{cad.buyer}</td>
                  <td className="px-4 py-3">{cad.buyerCountry}</td>
                  <td className="px-4 py-3">{cad.commodity}</td>
                  <td className="px-4 py-3 text-right font-mono">{cad.fobUsd.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{cad.usdRetained != null ? cad.usdRetained.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">{cad.paymentTerms}</td>
                  <td className="px-4 py-3">{formatDate(cad.dueDate)}</td>
                  <td className="px-4 py-3"><Badge className={`${STATUS_STYLES[cad.status] ?? ""} text-xs`} variant="outline">{cad.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCad(cad)}><Pencil className="w-3.5 h-3.5" /></Button></td>
                </tr>
              ))}
              {(cads ?? []).length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No CADs found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New CAD</DialogTitle></DialogHeader>
          <CreateCadForm loading={create.isPending} onCancel={() => setCreateOpen(false)}
            onSave={(data) => create.mutate({ data }, { onSuccess: () => { invalidate(); setCreateOpen(false); } })} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCad} onOpenChange={(o) => !o && setEditCad(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update CAD — {editCad?.cadRef}</DialogTitle></DialogHeader>
          {editCad && (
            <UpdateCadForm cad={editCad} loading={update.isPending} onCancel={() => setEditCad(null)}
              onSave={(data) => update.mutate({ id: editCad.id, data }, { onSuccess: () => { invalidate(); setEditCad(null); } })} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
