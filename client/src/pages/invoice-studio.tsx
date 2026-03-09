import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Trash2,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CircleDollarSign,
  Save,
  Palette,
  Briefcase,
  Users,
  ShoppingCart,
  CreditCard,
  Image as ImageIcon,
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  Invoice,
  InvoiceTemplate,
  InvoiceTemplateData,
  InsertInvoice,
  InsertInvoiceTemplate,
} from "@shared/schema";

type TaxMode = "none" | "gst" | "vat";
type LineItem = { id: string; description: string; qty: number; unitPrice: number };
type Client = { id: string; name: string; email: string; address: string };
type PaymentDetails = InsertInvoice["paymentDetails"];

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const THEMES = [
  { id: "lavender", name: "Lavender Dream", colors: "from-violet-100 to-white", accent: "text-violet-600", bg: "bg-violet-50", primary: "bg-violet-600" },
  { id: "mint", name: "Minty Fresh", colors: "from-emerald-100 to-white", accent: "text-emerald-600", bg: "bg-emerald-50", primary: "bg-emerald-600" },
  { id: "sunset", name: "Peach Sunset", colors: "from-orange-100 to-white", accent: "text-orange-600", bg: "bg-orange-50", primary: "bg-orange-600" },
];

const FONTS = [
  { id: "display", name: "Cartoonish", family: "font-display" },
  { id: "sans", name: "Modern Sans", family: "font-sans" },
];

const THEME_BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]));
const FONT_BY_ID = new Map(FONTS.map((font) => [font.id, font]));
const EMPTY_BANK_DETAILS = {
  accountName: "",
  accountNumber: "",
  ifscOrSwift: "",
  bankName: "",
};

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

  // Tax & Payments & Status
  const [taxMode, setTaxMode] = useState<TaxMode>("gst");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"upi" | "cash" | "bank">("upi");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    sender: {
      upiId: "lavender@upi",
      bankDetails: { ...EMPTY_BANK_DETAILS },
    },
    receiver: {
      upiId: "",
      bankDetails: { ...EMPTY_BANK_DETAILS },
    },
  });
  const [transactionId, setTransactionId] = useState("");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [hasDownloadedInvoice, setHasDownloadedInvoice] = useState(false);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/invoice-templates"],
  });
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      const payload: InsertInvoiceTemplate = {
        name,
        data: {
          sender,
          items: items.map(({ description, qty, unitPrice }) => ({
            description,
            qty,
            unitPrice,
          })),
          taxMode,
          taxRate,
          discount,
          paymentType,
          paymentDetails,
          themeId: theme.id,
          fontId: font.id,
        },
      };

      const res = await apiRequest("POST", "/api/invoice-templates", payload);
      return (await res.json()) as InvoiceTemplate;
    },
    onSuccess: (savedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      setSelectedTemplateId(savedTemplate.id);
      toast({
        title: "Template saved",
        description: `"${savedTemplate.name}" is now available in Use Template.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save template",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });
  const saveInvoiceMutation = useMutation({
    mutationFn: async () => {
      const payload: InsertInvoice = {
        status: isPaid ? "paid" : "unpaid",
        sender,
        client,
        items: items.map(({ description, qty, unitPrice }) => ({
          description,
          qty,
          unitPrice,
        })),
        taxMode,
        taxRate,
        discount,
        paymentType,
        paymentDetails,
        transactionId,
        total,
        themeId: theme.id,
        fontId: font.id,
      };

      const res = await apiRequest("POST", "/api/invoices", payload);
      return (await res.json()) as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice saved",
        description: "Invoice status and details were stored successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save invoice",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const markInvoicePaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await apiRequest("PATCH", `/api/invoices/${invoiceId}/status`, {
        status: "paid",
      });
      return (await res.json()) as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice updated",
        description: "Invoice status changed to paid.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  // Calculations
  const subtotal = useMemo(() => items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0), [items]);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = useMemo(() => (taxMode === "none" ? 0 : discountedSubtotal * (taxRate / 100)), [taxMode, taxRate, discountedSubtotal]);
  const total = discountedSubtotal + taxAmount;
  const amountPaid = isPaid ? total : 0;
  const balanceDue = Math.max(0, total - amountPaid);
  const printableItems = items.slice(0, 10);
  const hiddenItemCount = Math.max(0, items.length - printableItems.length);
  const invoiceNumber = useMemo(
    () => `INV-${format(new Date(), "yyyyMMdd")}-${String(items.length).padStart(2, "0")}`,
    [items.length],
  );
  const dueDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  }, []);

  const progress = (step / 5) * 100;

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { title: "Business", icon: Briefcase },
    { title: "Client", icon: Users },
    { title: "Items", icon: ShoppingCart },
    { title: "Style", icon: Palette },
    { title: "Finalize", icon: CreditCard },
  ];

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSender({ ...sender, logoDataUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateUpiId = (party: "sender" | "receiver", value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [party]: {
        ...prev[party],
        upiId: value,
      },
    }));
  };

  const updateBankDetail = (
    party: "sender" | "receiver",
    field: "accountName" | "accountNumber" | "ifscOrSwift" | "bankName",
    value: string,
  ) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [party]: {
        ...prev[party],
        bankDetails: {
          ...prev[party].bankDetails,
          [field]: value,
        },
      },
    }));
  };

  const applyTemplate = (templateData: InvoiceTemplateData) => {
    setSender(templateData.sender);
    setItems(
      templateData.items.map((item) => ({
        ...item,
        id: uid(),
      })),
    );
    setTaxMode(templateData.taxMode);
    setTaxRate(templateData.taxRate);
    setDiscount(templateData.discount);
    setPaymentType(templateData.paymentType);
    setPaymentDetails(templateData.paymentDetails);
    setTheme(THEME_BY_ID.get(templateData.themeId) ?? THEMES[0]);
    setFont(FONT_BY_ID.get(templateData.fontId) ?? FONTS[0]);
    setStep(1);
  };

  const onTemplateSelect = (value: string) => {
    setSelectedTemplateId(value);
    if (value === "none") {
      return;
    }

    const selectedTemplate = templates.find((template) => template.id === value);
    if (!selectedTemplate) {
      return;
    }

    applyTemplate(selectedTemplate.data);
    toast({
      title: "Template applied",
      description: "Layout and business defaults loaded. Client details were kept.",
    });
  };

  const onSaveTemplate = () => {
    const name = window.prompt("Template name");
    const normalizedName = name?.trim();
    if (!normalizedName) {
      return;
    }

    saveTemplateMutation.mutate(normalizedName);
  };

  const onSaveInvoice = () => {
    if (isPaid && !transactionId.trim()) {
      toast({
        title: "Transaction ID required",
        description: "Enter transaction ID before saving a paid invoice.",
        variant: "destructive",
      });
      return;
    }

    saveInvoiceMutation.mutate();
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500 pb-20", theme.bg, font.family)}>
      {/* Print-only View */}
      <div className="invoice-container hidden print:block bg-white text-black">
        <div className="invoice-header page-break">
          <div className="invoice-header-left">
            {sender.logoDataUrl && (
              <img src={sender.logoDataUrl} alt="Logo" className="invoice-logo" />
            )}
            <h1 className="invoice-company-name">{sender.businessName}</h1>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">Invoice</h2>
            <p><span>Invoice #:</span> {invoiceNumber}</p>
            <p><span>Date:</span> {format(new Date(), "dd MMM yyyy")}</p>
            <p><span>Due Date:</span> {format(dueDate, "dd MMM yyyy")}</p>
            <p>
              <span>Status:</span>{" "}
              <strong>{isPaid ? "Paid" : "Unpaid"}</strong>
            </p>
          </div>
        </div>

        <div className="invoice-billing page-break">
          <div>
            <h3>Bill From</h3>
            <p>{sender.businessName}</p>
            <p>{sender.address}</p>
            <p>{sender.email}</p>
            <p>{sender.phone}</p>
          </div>
          <div>
            <h3>Bill To</h3>
            <p>{client.name}</p>
            <p>{client.address}</p>
            <p>{client.email}</p>
            <p>{"phone" in client ? (client as { phone?: string }).phone || "-" : "-"}</p>
          </div>
        </div>

        <div className="page-break">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Item</th>
                <th style={{ width: "35%" }}>Description</th>
                <th style={{ width: "10%" }}>Qty</th>
                <th style={{ width: "15%" }}>Price</th>
                <th style={{ width: "15%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {printableItems.map((it, idx) => (
                <tr key={it.id}>
                  <td>Item {idx + 1}</td>
                  <td>{it.description || "-"}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">Rs {money(it.unitPrice)}</td>
                  <td className="num">Rs {money(it.qty * it.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hiddenItemCount > 0 && (
            <p className="invoice-truncation-note">
              +{hiddenItemCount} more item(s) not shown in print to keep a single-page layout.
            </p>
          )}
        </div>

        <div className="invoice-totals page-break">
          <div className="invoice-totals-inner">
            <div><span>Subtotal</span><span>Rs {money(subtotal)}</span></div>
            <div><span>Tax</span><span>Rs {money(taxAmount)}</span></div>
            <div><span>Discount</span><span>- Rs {money(discount)}</span></div>
            <div className="invoice-total-row"><span>Total</span><span>Rs {money(total)}</span></div>
            <div><span>Amount Paid</span><span>Rs {money(amountPaid)}</span></div>
            <div><span>Balance Due</span><span>Rs {money(balanceDue)}</span></div>
          </div>
        </div>

        <div className="invoice-bottom page-break">
          <div className="invoice-payment">
            <h3>Payment Details</h3>
            <p>Bank Name: {paymentDetails.receiver.bankDetails.bankName || paymentDetails.sender.bankDetails.bankName || "-"}</p>
            <p>Account Name: {paymentDetails.receiver.bankDetails.accountName || paymentDetails.sender.bankDetails.accountName || "-"}</p>
            <p>Account Number: {paymentDetails.receiver.bankDetails.accountNumber || paymentDetails.sender.bankDetails.accountNumber || "-"}</p>
            <p>IFSC / SWIFT: {paymentDetails.receiver.bankDetails.ifscOrSwift || paymentDetails.sender.bankDetails.ifscOrSwift || "-"}</p>
            <p>UPI ID: {paymentDetails.receiver.upiId || paymentDetails.sender.upiId || "-"}</p>
          </div>
          <div className="invoice-notes">
            <h3>Notes</h3>
            <p>
              Thank you for working with us. Please complete payment by the due date.
              {transactionId ? ` Transaction ID: ${transactionId}.` : ""}
            </p>
          </div>
        </div>

        <div className="invoice-footer">Thank you for your business</div>
      </div>

      {/* App Interface */}
      <div className="print:hidden mx-auto max-w-4xl px-4 py-8">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl">Create Invoice</h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[210px]">
                <Select value={selectedTemplateId} onValueChange={onTemplateSelect}>
                  <SelectTrigger className="rounded-xl bg-white">
                    <SelectValue placeholder="Use Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Use Template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={onSaveTemplate}
                disabled={saveTemplateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
              <span className="text-sm font-medium text-muted-foreground">Step {step} of 5</span>
            </div>
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
                <div className="grid gap-6">
                  <div className="flex items-center gap-6 p-4 border rounded-2xl bg-gray-50/50">
                    <div className="h-24 w-24 rounded-2xl border bg-white flex items-center justify-center overflow-hidden">
                      {sender.logoDataUrl ? (
                        <img src={sender.logoDataUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium block mb-2">Business Logo</label>
                      <Input type="file" accept="image/*" onChange={onLogoChange} className="rounded-xl" />
                    </div>
                  </div>
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

                <div className="p-6 border rounded-2xl bg-violet-50/30">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-bold">Adjustments</h3>
                      <div>
                        <label className="text-sm font-medium">Discount (₹)</label>
                        <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="rounded-xl mt-1 bg-white" placeholder="0.00" />
                      </div>
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
                    </div>
                    <div className="flex flex-col justify-end text-right">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Subtotal: ₹{money(subtotal)}</div>
                        {discount > 0 && <div className="text-sm text-emerald-600">Discount: - ₹{money(discount)}</div>}
                        {taxMode !== "none" && <div className="text-sm text-muted-foreground">GST (18%): ₹{money(taxAmount)}</div>}
                      </div>
                      <div className="text-2xl font-display mt-4 p-4 rounded-2xl bg-white border">Total: ₹{money(total)}</div>
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

            {/* Step 5: Finalize */}
            {step === 5 && (
              <Card className="cartoon-card border bg-white p-6 rounded-3xl">
                <h2 className="font-display text-2xl mb-6">Finalize & Payment</h2>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
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
                      {paymentType === "upi" && (
                        <div className="mt-4 grid gap-3">
                          <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground">Sender UPI ID</label>
                            <Input
                              value={paymentDetails.sender.upiId}
                              onChange={(e) => updateUpiId("sender", e.target.value)}
                              className="rounded-xl mt-1"
                              placeholder="sender@upi"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground">Receiver UPI ID</label>
                            <Input
                              value={paymentDetails.receiver.upiId}
                              onChange={(e) => updateUpiId("receiver", e.target.value)}
                              className="rounded-xl mt-1"
                              placeholder="receiver@upi"
                            />
                          </div>
                        </div>
                      )}
                      {paymentType === "bank" && (
                        <div className="mt-4 grid gap-4">
                          <div className="rounded-2xl border bg-white p-3">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Sender Bank Details</p>
                            <div className="grid gap-2">
                              <Input
                                value={paymentDetails.sender.bankDetails.accountName}
                                onChange={(e) => updateBankDetail("sender", "accountName", e.target.value)}
                                className="rounded-xl"
                                placeholder="Account name"
                              />
                              <Input
                                value={paymentDetails.sender.bankDetails.accountNumber}
                                onChange={(e) => updateBankDetail("sender", "accountNumber", e.target.value)}
                                className="rounded-xl"
                                placeholder="Account number"
                              />
                              <Input
                                value={paymentDetails.sender.bankDetails.ifscOrSwift}
                                onChange={(e) => updateBankDetail("sender", "ifscOrSwift", e.target.value)}
                                className="rounded-xl"
                                placeholder="IFSC / SWIFT"
                              />
                              <Input
                                value={paymentDetails.sender.bankDetails.bankName}
                                onChange={(e) => updateBankDetail("sender", "bankName", e.target.value)}
                                className="rounded-xl"
                                placeholder="Bank name"
                              />
                            </div>
                          </div>
                          <div className="rounded-2xl border bg-white p-3">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Receiver Bank Details</p>
                            <div className="grid gap-2">
                              <Input
                                value={paymentDetails.receiver.bankDetails.accountName}
                                onChange={(e) => updateBankDetail("receiver", "accountName", e.target.value)}
                                className="rounded-xl"
                                placeholder="Account name"
                              />
                              <Input
                                value={paymentDetails.receiver.bankDetails.accountNumber}
                                onChange={(e) => updateBankDetail("receiver", "accountNumber", e.target.value)}
                                className="rounded-xl"
                                placeholder="Account number"
                              />
                              <Input
                                value={paymentDetails.receiver.bankDetails.ifscOrSwift}
                                onChange={(e) => updateBankDetail("receiver", "ifscOrSwift", e.target.value)}
                                className="rounded-xl"
                                placeholder="IFSC / SWIFT"
                              />
                              <Input
                                value={paymentDetails.receiver.bankDetails.bankName}
                                onChange={(e) => updateBankDetail("receiver", "bankName", e.target.value)}
                                className="rounded-xl"
                                placeholder="Bank name"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {paymentType === "cash" && (
                        <p className="mt-4 text-xs text-muted-foreground">
                          Cash selected. No UPI or bank details needed.
                        </p>
                      )}
                    </div>
                    <div className="p-5 border rounded-3xl bg-gray-50">
                      <label className="text-sm font-medium mb-3 block">Invoice Status</label>
                      <div className="flex gap-2">
                        <Button
                          variant={!isPaid ? "default" : "secondary"}
                          className={cn("flex-1 rounded-2xl", !isPaid && "bg-orange-500 hover:bg-orange-600")}
                          onClick={() => setIsPaid(false)}
                        >
                          UNPAID
                        </Button>
                        <Button
                          variant={isPaid ? "default" : "secondary"}
                          className={cn("flex-1 rounded-2xl", isPaid && "bg-emerald-500 hover:bg-emerald-600")}
                          onClick={() => setIsPaid(true)}
                        >
                          PAID
                        </Button>
                      </div>
                      {!isPaid && (
                        <Button
                          variant="outline"
                          className="mt-3 w-full rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setIsPaid(true)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      {isPaid && (
                        <div className="mt-4">
                          <label className="text-xs font-bold uppercase text-rose-500">Transaction ID (Required)*</label>
                          <Input
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                            className="rounded-xl mt-1 border-rose-200 focus-visible:ring-rose-500"
                            placeholder="Enter transaction reference"
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-4">This will be printed on the final invoice document.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Payment Preview</p>
                    <p className="text-sm mb-2">
                      Method: <span className="font-bold uppercase">{paymentType}</span>
                    </p>
                    {paymentType === "cash" && (
                      <p className="text-sm">Cash payment selected.</p>
                    )}
                    {paymentType === "upi" && (
                      <div className="grid gap-1">
                        <p className="text-sm">Sender UPI ID: <span className="font-bold">{paymentDetails.sender.upiId || "-"}</span></p>
                        <p className="text-sm">Receiver UPI ID: <span className="font-bold">{paymentDetails.receiver.upiId || "-"}</span></p>
                      </div>
                    )}
                    {paymentType === "bank" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border bg-white p-3">
                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Sender Bank</p>
                          <p className="text-sm">Account Name: <span className="font-bold">{paymentDetails.sender.bankDetails.accountName || "-"}</span></p>
                          <p className="text-sm">Account Number: <span className="font-bold">{paymentDetails.sender.bankDetails.accountNumber || "-"}</span></p>
                          <p className="text-sm">IFSC / SWIFT: <span className="font-bold">{paymentDetails.sender.bankDetails.ifscOrSwift || "-"}</span></p>
                          <p className="text-sm">Bank Name: <span className="font-bold">{paymentDetails.sender.bankDetails.bankName || "-"}</span></p>
                        </div>
                        <div className="rounded-xl border bg-white p-3">
                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Receiver Bank</p>
                          <p className="text-sm">Account Name: <span className="font-bold">{paymentDetails.receiver.bankDetails.accountName || "-"}</span></p>
                          <p className="text-sm">Account Number: <span className="font-bold">{paymentDetails.receiver.bankDetails.accountNumber || "-"}</span></p>
                          <p className="text-sm">IFSC / SWIFT: <span className="font-bold">{paymentDetails.receiver.bankDetails.ifscOrSwift || "-"}</span></p>
                          <p className="text-sm">Bank Name: <span className="font-bold">{paymentDetails.receiver.bankDetails.bankName || "-"}</span></p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={cn("p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center", theme.colors)}>
                    <CheckCircle2 className={cn("h-16 w-16 mb-4", theme.accent)} />
                    <h3 className="font-display text-2xl">Perfect!</h3>
                    <p className="text-sm text-muted-foreground mt-2">Your professional invoice for ₹{money(total)} is ready.</p>
                    <div className="mt-8 flex flex-wrap gap-4 w-full">
                      <Button 
                        className={cn("flex-1 rounded-2xl h-14 text-lg text-white", theme.primary)} 
                        onClick={() => {
                          window.print();
                        }}
                        disabled={isPaid && !transactionId}
                      >
                        <Printer className="mr-2 h-5 w-5" /> Print / Save PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-2xl h-14 text-lg border-2" 
                        onClick={() => {
                          setHasDownloadedInvoice(true);
                          window.print();
                        }}
                        disabled={isPaid && !transactionId}
                      >
                        <Download className="mr-2 h-5 w-5" /> Download PDF
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 rounded-2xl h-14 text-lg"
                        onClick={onSaveInvoice}
                        disabled={saveInvoiceMutation.isPending || (isPaid && !transactionId)}
                      >
                        <Save className="mr-2 h-5 w-5" />
                        {saveInvoiceMutation.isPending ? "Saving..." : "Save Invoice"}
                      </Button>
                    </div>
                    {hasDownloadedInvoice && (
                      <Link href="/">
                        <Button variant="outline" className="mt-4 rounded-2xl">
                          Return to Home
                        </Button>
                      </Link>
                    )}
                    {isPaid && !transactionId && (
                      <p className="text-xs text-rose-500 mt-4 font-bold">Please enter a Transaction ID to generate the invoice.</p>
                    )}
                  </div>

                  <div className="rounded-3xl border bg-white p-6">
                    <h3 className="font-display text-xl">Saved Invoices</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update status later from here.
                    </p>
                    <div className="mt-4 grid gap-3">
                      {invoices.length === 0 && (
                        <p className="text-sm text-muted-foreground">No invoices saved yet.</p>
                      )}
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
                        >
                          <div>
                            <p className="font-medium">{invoice.client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(invoice.createdAt), "dd MMM yyyy")} | ₹{money(invoice.total)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold uppercase",
                                invoice.status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-orange-100 text-orange-700",
                              )}
                            >
                              {invoice.status}
                            </span>
                            {invoice.status === "unpaid" && (
                              <Button
                                size="sm"
                                className="rounded-xl"
                                disabled={markInvoicePaidMutation.isPending}
                                onClick={() => markInvoicePaidMutation.mutate(invoice.id)}
                              >
                                <CircleDollarSign className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="print:hidden mt-8 flex justify-between">
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
              className={cn("rounded-full px-8 h-12 text-white", theme.primary)}
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <style>{`
        .invoice-container {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm;
          box-sizing: border-box;
          font-family: Inter, Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          overflow: hidden;
        }

        .invoice-header {
          display: grid;
          grid-template-columns: 60% 40%;
          gap: 12px;
          margin-bottom: 16px;
        }

        .invoice-header-left {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 8px;
        }

        .invoice-logo {
          max-height: 60px;
          max-width: 180px;
          width: auto;
          object-fit: contain;
        }

        .invoice-company-name {
          font-size: 24px;
          line-height: 1.2;
          margin: 0;
          font-weight: 700;
        }

        .invoice-header-right {
          text-align: right;
          font-size: 11px;
          line-height: 1.3;
        }

        .invoice-header-right p {
          margin: 2px 0;
        }

        .invoice-header-right span {
          font-weight: 600;
        }

        .invoice-title {
          font-size: 24px;
          margin: 0 0 6px;
          text-transform: uppercase;
          font-weight: 800;
        }

        .invoice-billing {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 12px;
          margin-bottom: 25px;
          font-size: 11px;
          line-height: 1.35;
        }

        .invoice-billing h3 {
          margin: 0 0 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .invoice-billing p {
          margin: 1px 0;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-bottom: 8px;
          font-size: 11px;
        }

        .invoice-table thead tr {
          background: #f5f5f5;
        }

        .invoice-table th,
        .invoice-table td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: left;
          min-height: 32px;
          vertical-align: top;
        }

        .invoice-table .num {
          text-align: right;
        }

        .invoice-truncation-note {
          margin: 0 0 6px;
          font-size: 10px;
          color: #6b7280;
        }

        .invoice-totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .invoice-totals-inner {
          width: 40%;
          min-width: 220px;
          font-size: 11px;
          line-height: 1.4;
        }

        .invoice-totals-inner > div {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }

        .invoice-total-row {
          font-size: 16px;
          font-weight: 700;
          border-top: 1px solid #d1d5db;
          padding-top: 4px;
          margin-top: 4px;
        }

        .invoice-bottom {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 12px;
          margin-top: auto;
        }

        .invoice-payment,
        .invoice-notes {
          font-size: 11px;
          line-height: 1.35;
        }

        .invoice-payment h3,
        .invoice-notes h3 {
          margin: 0 0 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .invoice-payment p {
          margin: 1px 0;
        }

        .invoice-notes {
          font-size: 10px;
        }

        .invoice-notes p {
          margin: 0;
          max-height: 70px;
          overflow: hidden;
        }

        .invoice-footer {
          text-align: center;
          margin-top: 12px;
          font-size: 10px;
        }

        .page-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        @media print {
          @page {
            size: A4;
            margin-top: 20mm;
            margin-right: 15mm;
            margin-bottom: 20mm;
            margin-left: 15mm;
          }

          body {
            margin: 0;
          }

          .print\:hidden {
            display: none !important;
          }

          .invoice-container {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm 15mm;
            box-sizing: border-box;
          }

          .page-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}


