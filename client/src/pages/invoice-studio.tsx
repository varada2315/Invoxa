import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Palette,
  Briefcase,
  Users,
  ShoppingCart,
  CreditCard,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type TaxMode = "none" | "gst" | "vat";
type LineItem = { id: string; description: string; qty: number; unitPrice: number };
type Client = { id: string; name: string; email: string; address: string };

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const THEMES = [
  { id: "lavender", name: "Lavender Dream", colors: "from-violet-100 to-white", accent: "text-violet-600", bg: "bg-violet-50" },
  { id: "mint", name: "Minty Fresh", colors: "from-emerald-100 to-white", accent: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "sunset", name: "Peach Sunset", colors: "from-orange-100 to-white", accent: "text-orange-600", bg: "bg-orange-50" },
];

const FONTS = [
  { id: "display", name: "Cartoonish", family: "font-display" },
  { id: "sans", name: "Modern Sans", family: "font-sans" },
];

export default function InvoiceStudio() {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState(THEMES[0]);
  const [font, setFont] = useState(FONTS[0]);

  // Business Details
  const [sender, setSender] = useState({
    businessName: "Lavender Studio Co.",
    address: "101 Softcloud Lane, Dreamtown, IN",
    phone: "+91 90000 00000",
    email: "hello@lavender.studio",
    logoDataUrl: "",
  });

  // Client Details
  const [client, setClient] = useState<Client>({
    id: "c1",
    name: "Maple & Co.",
    email: "billing@mapleco.com",
    address: "22 Pine Street, Somewhere",
  });

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "Design & layout", qty: 1, unitPrice: 4999 },
  ]);

  // Tax & Payments
  const [taxMode, setTaxMode] = useState<TaxMode>("gst");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [paymentType, setPaymentType] = useState<"upi" | "cash" | "bank">("upi");
  const [paymentDetails, setPaymentDetails] = useState("lavender@upi");

  // Calculations
  const subtotal = useMemo(() => items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0), [items]);
  const taxAmount = useMemo(() => (taxMode === "none" ? 0 : subtotal * (taxRate / 100)), [taxMode, taxRate, subtotal]);
  const total = subtotal + taxAmount;

  const progress = (step / 5) * 100;

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { title: "Business", icon: Briefcase },
    { title: "Client", icon: Users },
    { title: "Items", icon: ShoppingCart },
    { title: "Style", icon: Palette },
    { title: "Payment", icon: CreditCard },
  ];

  return (
    <div className={cn("min-h-screen transition-colors duration-500", theme.bg, font.family)}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl">Create Invoice</h1>
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 5</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-6 flex justify-between">
            {steps.map((s, i) => (
              <div key={i} className={cn("flex flex-col items-center gap-1 opacity-40 transition-opacity", step === i + 1 && "opacity-100")}>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border bg-white", step >= i + 1 && "border-primary text-primary")}>
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Business Details */}
            {step === 1 && (
              <Card className="cartoon-card border bg-white p-6 rounded-3xl">
                <h2 className="font-display text-2xl mb-6">Business Details</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">Business Name</label>
                    <Input value={sender.businessName} onChange={e => setSender({...sender, businessName: e.target.value})} className="rounded-2xl mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Textarea value={sender.address} onChange={e => setSender({...sender, address: e.target.value})} className="rounded-2xl mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input value={sender.email} onChange={e => setSender({...sender, email: e.target.value})} className="rounded-2xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <Input value={sender.phone} onChange={e => setSender({...sender, phone: e.target.value})} className="rounded-2xl mt-1" />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Client Details */}
            {step === 2 && (
              <Card className="cartoon-card border bg-white p-6 rounded-3xl">
                <h2 className="font-display text-2xl mb-6">Client Details</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">Client Name</label>
                    <Input value={client.name} onChange={e => setClient({...client, name: e.target.value})} className="rounded-2xl mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input value={client.email} onChange={e => setClient({...client, email: e.target.value})} className="rounded-2xl mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Textarea value={client.address} onChange={e => setClient({...client, address: e.target.value})} className="rounded-2xl mt-1" />
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Items & Taxes */}
            {step === 3 && (
              <Card className="cartoon-card border bg-white p-6 rounded-3xl">
                <h2 className="font-display text-2xl mb-6">Line Items & Taxes</h2>
                <div className="grid gap-4 mb-6">
                  {items.map((it, idx) => (
                    <div key={it.id} className="flex gap-4 items-end p-4 border rounded-2xl bg-gray-50/50">
                      <div className="flex-1">
                        <label className="text-xs font-medium">Description</label>
                        <Input value={it.description} onChange={e => {
                          const newItems = [...items];
                          newItems[idx].description = e.target.value;
                          setItems(newItems);
                        }} className="rounded-xl mt-1" />
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-medium">Qty</label>
                        <Input type="number" value={it.qty} onChange={e => {
                          const newItems = [...items];
                          newItems[idx].qty = Number(e.target.value);
                          setItems(newItems);
                        }} className="rounded-xl mt-1" />
                      </div>
                      <div className="w-32">
                        <label className="text-xs font-medium">Price</label>
                        <Input type="number" value={it.unitPrice} onChange={e => {
                          const newItems = [...items];
                          newItems[idx].unitPrice = Number(e.target.value);
                          setItems(newItems);
                        }} className="rounded-xl mt-1" />
                      </div>
                      <Button variant="secondary" className="rounded-xl" onClick={() => setItems(items.filter(item => item.id !== it.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="secondary" className="rounded-2xl border-dashed" onClick={() => setItems([...items, {id: uid(), description: "", qty: 1, unitPrice: 0}])}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>

                <div className="p-4 border rounded-2xl bg-violet-50/30">
                  <h3 className="font-bold mb-4">Indian Taxation (GST)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tax Mode</label>
                      <Select value={taxMode} onValueChange={(v: TaxMode) => setTaxMode(v)}>
                        <SelectTrigger className="rounded-xl mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gst">GST (18%)</SelectItem>
                          <SelectItem value="none">No Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Subtotal: ₹{money(subtotal)}</div>
                        <div className="text-sm text-muted-foreground">GST (18%): ₹{money(taxAmount)}</div>
                        <div className="text-xl font-display mt-2">Total: ₹{money(total)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 4: Theme & Styling */}
            {step === 4 && (
              <Card className="cartoon-card border bg-white p-6 rounded-3xl">
                <h2 className="font-display text-2xl mb-6">Choose Style</h2>
                <div className="grid gap-8">
                  <div>
                    <label className="text-sm font-medium mb-4 block">Color Palette</label>
                    <div className="grid grid-cols-3 gap-4">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t)}
                          className={cn(
                            "h-20 rounded-2xl border-2 p-2 text-left transition-all",
                            theme.id === t.id ? "border-primary scale-105 shadow-lg" : "border-transparent bg-gray-50"
                          )}
                        >
                          <div className={cn("h-4 w-full rounded-full bg-gradient-to-r mb-2", t.colors)} />
                          <span className="text-xs font-bold">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-4 block">Typography</label>
                    <div className="grid grid-cols-2 gap-4">
                      {FONTS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFont(f)}
                          className={cn(
                            "p-4 rounded-2xl border-2 text-center transition-all",
                            font.id === f.id ? "border-primary bg-primary/5" : "border-gray-100 bg-gray-50"
                          )}
                        >
                          <div className={cn("text-xl mb-1", f.family)}>AaBbCc</div>
                          <span className="text-xs font-bold">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 5: Payment & Finalize */}
            {step === 5 && (
              <Card className="cartoon-card border bg-white p-6 rounded-3xl">
                <h2 className="font-display text-2xl mb-6">Finalize & Payment</h2>
                <div className="grid gap-6">
                  <div className="p-5 border rounded-3xl bg-gray-50">
                    <label className="text-sm font-medium mb-3 block">Payment Method</label>
                    <div className="flex gap-2">
                      {['upi', 'bank', 'cash'].map(m => (
                        <Button
                          key={m}
                          variant={paymentType === m ? "default" : "secondary"}
                          className="flex-1 rounded-2xl"
                          onClick={() => setPaymentType(m as any)}
                        >
                          {m.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Payment Details (ID / Acc No)</label>
                      <Input
                        value={paymentDetails}
                        onChange={e => setPaymentDetails(e.target.value)}
                        className="rounded-xl mt-1"
                        placeholder="Enter UPI ID or Bank details"
                      />
                    </div>
                  </div>

                  <div className={cn("p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center", theme.colors)}>
                    <CheckCircle2 className={cn("h-16 w-16 mb-4", theme.accent)} />
                    <h3 className="font-display text-2xl">Ready to Go!</h3>
                    <p className="text-sm text-muted-foreground mt-2">Your professional invoice for ₹{money(total)} is ready.</p>
                    <div className="mt-8 flex gap-4 w-full">
                      <Button className="flex-1 rounded-2xl h-14 text-lg" onClick={() => window.print()}>
                        <Printer className="mr-2 h-5 w-5" /> Print / PDF
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-2xl h-14 text-lg" onClick={() => alert("Downloaded!")}>
                        <Download className="mr-2 h-5 w-5" /> Download
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            className="rounded-full px-8 h-12"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step < 5 && (
            <Button
              onClick={nextStep}
              className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90"
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .mx-auto { max-width: 100% !important; padding: 0 !important; }
          button, .Progress, .ChevronLeft, .ChevronRight, h1, .mb-12 { display: none !important; }
          .cartoon-card { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
