import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Company profile and system configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Profile</CardTitle>
          <CardDescription>Your company details as they appear on documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input defaultValue="Midas Trading Co." readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>TIN Number</Label>
              <Input defaultValue="0014-XXXX-ETH" readOnly />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Head Office Address</Label>
            <Input defaultValue="Bole Sub-City, Addis Ababa, Ethiopia" readOnly />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input defaultValue="+251 11 XXX XXXX" readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue="trade@midastrading.et" readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currency & Regulatory</CardTitle>
          <CardDescription>Ethiopian regulatory settings and currency display preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Primary Currency</Label>
              <Input defaultValue="ETB — Ethiopian Birr" readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Foreign Currency</Label>
              <Input defaultValue="USD — US Dollar" readOnly />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">NBE USD Retention Rate</p>
              <p className="text-xs text-muted-foreground">Mandatory retention applied to all export CAD payments per NBE directive.</p>
            </div>
            <Badge variant="secondary" className="text-base font-bold px-3 py-1">30%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Petty Cash Ceiling</p>
              <p className="text-xs text-muted-foreground">Maximum float before mandatory replenishment.</p>
            </div>
            <Badge variant="secondary" className="font-bold px-3 py-1">ETB 15,000</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Max Per Voucher</p>
              <p className="text-xs text-muted-foreground">Single petty cash voucher limit.</p>
            </div>
            <Badge variant="secondary" className="font-bold px-3 py-1">ETB 2,000</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banking Partners</CardTitle>
          <CardDescription>Monitored banks for exchange rate tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {["CBE — Commercial Bank of Ethiopia", "Dashen Bank", "Awash Bank", "Bank of Abyssinia"].map((bank) => (
              <div key={bank} className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">{bank}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <Badge variant="outline">Development</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Region</span>
            <span>Addis Ababa, Ethiopia</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
