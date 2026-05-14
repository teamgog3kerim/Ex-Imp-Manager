import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInventoryItems,
  useGetInventorySummary,
  useGetSales,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useCreateSale,
  getGetInventoryItemsQueryKey,
  getGetInventorySummaryQueryKey,
  getGetSalesQueryKey,
} from "@workspace/api-client-react";
import type { InventoryItem, InventoryInput, SaleInput } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil, Package } from "lucide-react";

const INV_STATUS_STYLES: Record<string, string> = {
  in_stock: "bg-green-100 text-green-700",
  low_stock: "bg-yellow-100 text-yellow-700",
  reserved: "bg-blue-100 text-blue-700",
  out_of_stock: "bg-red-100 text-red-700",
};

const SALE_STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  invoiced: "bg-blue-100 text-blue-700",
};

const INV_STATUSES = ["in_stock", "low_stock", "reserved", "out_of_stock"];

export default function ImportInventory() {
  const qc = useQueryClient();
  const [invCreateOpen, setInvCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [saleCreateOpen, setSaleCreateOpen] = useState(false);
  const [invForm, setInvForm] = useState<Partial<InventoryInput>>({});
  const [saleForm, setSaleForm] = useState<Partial<SaleInput>>({});

  const { data: items } = useGetInventoryItems();
  const { data: summary } = useGetInventorySummary();
  const { data: sales } = useGetSales();
  const createInv = useCreateInventoryItem();
  const updateInv = useUpdateInventoryItem();
  const createSale = useCreateSale();

  const setI = (k: keyof InventoryInput, v: string | number) => setInvForm((p) => ({ ...p, [k]: v }));
  const setS = (k: keyof SaleInput, v: string | number) => setSaleForm((p) => ({ ...p, [k]: v }));

  const invalidateInv = () => {
    qc.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
  };
  const invalidateSales = () => qc.invalidateQueries({ queryKey: getGetSalesQueryKey() });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">Warehouse stock and domestic sales tracking.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total SKUs</p><p className="text-2xl font-bold mt-1">{summary.totalSkus}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Warehouses</p><p className="text-2xl font-bold mt-1">{summary.warehouseCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-2xl font-bold mt-1 text-yellow-600">{summary.lowStockCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Value</p><p className="text-xl font-bold mt-1">{formatCurrency(summary.totalValueEtb)}</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-1.5" />Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader><div className="flex justify-end"><Button size="sm" onClick={() => { setInvForm({}); setInvCreateOpen(true); }}><Plus className="w-4 h-4 mr-1.5" />Add Item</Button></div></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-muted-foreground text-xs uppercase">
                    <th className="text-left px-4 py-3 font-medium">Inv ID</th>
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-left px-4 py-3 font-medium">Warehouse</th>
                    <th className="text-right px-4 py-3 font-medium">Qty</th>
                    <th className="text-right px-4 py-3 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-3 font-medium">Landed Cost</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {(items ?? []).map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-mono text-xs">{item.invId}</td>
                      <td className="px-4 py-3 font-medium">{item.product}</td>
                      <td className="px-4 py-3">{item.warehouse}</td>
                      <td className="px-4 py-3 text-right">{item.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPriceEtb)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.landedCostEtb)}</td>
                      <td className="px-4 py-3"><Badge className={`${INV_STATUS_STYLES[item.status] ?? ""} text-xs capitalize`} variant="outline">{item.status.replace("_", " ")}</Badge></td>
                      <td className="px-4 py-3"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditItem(item); setInvForm(item); }}><Pencil className="w-3.5 h-3.5" /></Button></td>
                    </tr>
                  ))}
                  {(items ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No inventory items.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader><div className="flex justify-end"><Button size="sm" onClick={() => { setSaleForm({}); setSaleCreateOpen(true); }}><Plus className="w-4 h-4 mr-1.5" />Record Sale</Button></div></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-muted-foreground text-xs uppercase">
                    <th className="text-left px-4 py-3 font-medium">Sale ID</th>
                    <th className="text-left px-4 py-3 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-right px-4 py-3 font-medium">Qty</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(sales ?? []).map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-mono text-xs">{s.saleId}</td>
                      <td className="px-4 py-3 font-medium">{s.customer}</td>
                      <td className="px-4 py-3">{s.product}</td>
                      <td className="px-4 py-3 text-right">{s.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(s.amountEtb)}</td>
                      <td className="px-4 py-3">{formatDate(s.date)}</td>
                      <td className="px-4 py-3"><Badge className={`${SALE_STATUS_STYLES[s.paymentStatus] ?? ""} text-xs capitalize`} variant="outline">{s.paymentStatus}</Badge></td>
                    </tr>
                  ))}
                  {(sales ?? []).length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No sales recorded.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={invCreateOpen || !!editItem} onOpenChange={(o) => { if (!o) { setInvCreateOpen(false); setEditItem(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? `Edit — ${editItem.invId}` : "Add Inventory Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Inv ID *</Label><Input value={invForm.invId ?? ""} onChange={(e) => setI("invId", e.target.value)} placeholder="INV-001" /></div>
              <div className="space-y-1.5"><Label>Product *</Label><Input value={invForm.product ?? ""} onChange={(e) => setI("product", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Shipment Ref *</Label><Input value={invForm.shipmentRef ?? ""} onChange={(e) => setI("shipmentRef", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Warehouse *</Label><Input value={invForm.warehouse ?? ""} onChange={(e) => setI("warehouse", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Quantity *</Label><Input type="number" value={invForm.quantity ?? ""} onChange={(e) => setI("quantity", parseInt(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={invForm.status ?? "in_stock"} onValueChange={(v) => setI("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INV_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Unit Price (ETB) *</Label><Input type="number" value={invForm.unitPriceEtb ?? ""} onChange={(e) => setI("unitPriceEtb", parseFloat(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Landed Cost (ETB) *</Label><Input type="number" value={invForm.landedCostEtb ?? ""} onChange={(e) => setI("landedCostEtb", parseFloat(e.target.value))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInvCreateOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button
              disabled={createInv.isPending || updateInv.isPending || !invForm.invId || !invForm.product || !invForm.shipmentRef || !invForm.warehouse || !invForm.quantity || !invForm.unitPriceEtb || !invForm.landedCostEtb}
              onClick={() => {
                if (editItem) {
                  updateInv.mutate({ id: editItem.id, data: invForm }, { onSuccess: () => { invalidateInv(); setEditItem(null); } });
                } else {
                  createInv.mutate({ data: invForm as InventoryInput }, { onSuccess: () => { invalidateInv(); setInvCreateOpen(false); } });
                }
              }}
            >
              {createInv.isPending || updateInv.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saleCreateOpen} onOpenChange={setSaleCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Customer *</Label><Input value={saleForm.customer ?? ""} onChange={(e) => setS("customer", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Product *</Label><Input value={saleForm.product ?? ""} onChange={(e) => setS("product", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Inventory Item ID *</Label><Input type="number" value={saleForm.inventoryItemId ?? ""} onChange={(e) => setS("inventoryItemId", parseInt(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Quantity *</Label><Input type="number" value={saleForm.quantity ?? ""} onChange={(e) => setS("quantity", parseInt(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Amount (ETB) *</Label><Input type="number" value={saleForm.amountEtb ?? ""} onChange={(e) => setS("amountEtb", parseFloat(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={saleForm.date ?? ""} onChange={(e) => setS("date", e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Payment Status</Label>
              <Select value={saleForm.paymentStatus ?? "pending"} onValueChange={(v) => setS("paymentStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={createSale.isPending || !saleForm.customer || !saleForm.product || !saleForm.quantity || !saleForm.amountEtb || !saleForm.date}
              onClick={() => createSale.mutate({ data: saleForm as SaleInput }, { onSuccess: () => { invalidateSales(); setSaleCreateOpen(false); } })}
            >
              {createSale.isPending ? "Saving..." : "Record Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
