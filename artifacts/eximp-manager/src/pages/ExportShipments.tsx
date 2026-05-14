import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetShipments,
  useCreateShipment,
  useUpdateShipment,
  getGetShipmentsQueryKey,
} from "@workspace/api-client-react";
import type { Shipment, ShipmentInput } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import { Plus, Pencil, PlaneTakeoff } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  "Loading": "bg-purple-100 text-purple-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "At Customs": "bg-yellow-100 text-yellow-700",
  "Delivered": "bg-green-100 text-green-700",
};

const STATUSES = ["Loading", "In Transit", "At Customs", "Delivered"];

function ShipmentForm({ initial, onSave, onCancel, loading, type }: {
  initial: Partial<ShipmentInput>;
  onSave: (d: ShipmentInput) => void;
  onCancel: () => void;
  loading: boolean;
  type: string;
}) {
  const [f, setF] = useState<Partial<ShipmentInput>>({ ...initial, type });
  const set = (k: keyof ShipmentInput, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Shipment Ref *</Label><Input value={f.shipmentRef ?? ""} onChange={(e) => set("shipmentRef", e.target.value)} placeholder="SHP-EXP-001" /></div>
        <div className="space-y-1.5"><Label>Status *</Label>
          <Select value={f.status ?? ""} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Origin *</Label><Input value={f.origin ?? ""} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. Djibouti" /></div>
        <div className="space-y-1.5"><Label>Destination *</Label><Input value={f.destination ?? ""} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. Hamburg" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>ETA *</Label><Input type="date" value={f.eta ?? ""} onChange={(e) => set("eta", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Progress %</Label><Input type="number" min={0} max={100} value={f.progressPct ?? ""} onChange={(e) => set("progressPct", parseInt(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Vessel</Label><Input value={f.vessel ?? ""} onChange={(e) => set("vessel", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Forwarder</Label><Input value={f.forwarder ?? ""} onChange={(e) => set("forwarder", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>B/L Number</Label><Input value={f.blNumber ?? ""} onChange={(e) => set("blNumber", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Freight (USD)</Label><Input type="number" value={f.freightUsd ?? ""} onChange={(e) => set("freightUsd", parseFloat(e.target.value))} /></div>
      </div>
      <div className="space-y-1.5"><Label>Description</Label><Input value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading || !f.shipmentRef || !f.status || !f.origin || !f.destination || !f.eta} onClick={() => onSave(f as ShipmentInput)}>
          {loading ? "Saving..." : "Save Shipment"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ShipmentCard({ s, onEdit }: { s: Shipment; onEdit: (s: Shipment) => void }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-medium text-sm">{s.shipmentRef}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${STATUS_STYLES[s.status] ?? "bg-gray-100 text-gray-700"}`} variant="outline">{s.status}</Badge>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
          <div><span className="text-muted-foreground">Origin:</span> <span className="font-medium ml-1">{s.origin}</span></div>
          <div><span className="text-muted-foreground">Dest:</span> <span className="font-medium ml-1">{s.destination}</span></div>
          <div><span className="text-muted-foreground">ETA:</span> <span className="font-medium ml-1">{formatDate(s.eta)}</span></div>
          <div><span className="text-muted-foreground">Vessel:</span> <span className="font-medium ml-1">{s.vessel ?? "—"}</span></div>
          <div><span className="text-muted-foreground">Forwarder:</span> <span className="font-medium ml-1">{s.forwarder ?? "—"}</span></div>
          {s.freightUsd != null && <div><span className="text-muted-foreground">Freight:</span> <span className="font-medium ml-1">USD {s.freightUsd.toLocaleString()}</span></div>}
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progress</span><span>{s.progressPct ?? 0}%</span></div>
          <Progress value={s.progressPct ?? 0} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExportShipments() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editShipment, setEditShipment] = useState<Shipment | null>(null);

  const { data: shipments } = useGetShipments({ type: "export" });
  const create = useCreateShipment();
  const update = useUpdateShipment();
  const invalidate = () => qc.invalidateQueries({ queryKey: getGetShipmentsQueryKey() });

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (shipments ?? []).filter((sh) => sh.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Shipments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track outbound shipments to international buyers.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Shipment</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATUSES.map((s) => (
          <Card key={s}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s}</p><p className="text-2xl font-bold mt-1">{counts[s] ?? 0}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {(shipments ?? []).map((s) => <ShipmentCard key={s.id} s={s} onEdit={setEditShipment} />)}
        {(shipments ?? []).length === 0 && <div className="col-span-3 py-12 text-center text-muted-foreground">No export shipments found.</div>}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Export Shipment</DialogTitle></DialogHeader>
          <ShipmentForm initial={{}} type="export" loading={create.isPending} onCancel={() => setCreateOpen(false)}
            onSave={(data) => create.mutate({ data }, { onSuccess: () => { invalidate(); setCreateOpen(false); } })} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editShipment} onOpenChange={(o) => !o && setEditShipment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Shipment — {editShipment?.shipmentRef}</DialogTitle></DialogHeader>
          {editShipment && (
            <ShipmentForm initial={editShipment} type="export" loading={update.isPending} onCancel={() => setEditShipment(null)}
              onSave={(data) => update.mutate({ id: editShipment.id, data }, { onSuccess: () => { invalidate(); setEditShipment(null); } })} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
