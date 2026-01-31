import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Sparkles,
  Download,
  Printer,
  BadgeCheck,
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

type TaxMode = "none" | "gst" | "vat";

type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
};

type Client = {
  id: string;
  name: string;
  email: string;
  address: string;
};

function money(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function nextInvoiceNumber(existingCount: number) {
  const year = new Date().getFullYear();
  const seq = (existingCount + 1).toString().padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export default function InvoiceStudio() {
  const [savedInvoices, setSavedInvoices] = useState<any[]>([]);

  const [invoiceDate, setInvoiceDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(() => format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd"));

  const invoiceNumber = useMemo(
    () => nextInvoiceNumber(savedInvoices.length),
    [savedInvoices.length],
  );

  const [sender, setSender] = useState({
    businessName: "Lavender Studio Co.",
    address: "101 Softcloud Lane, Dreamtown, IN",
    phone: "+91 90000 00000",
    email: "hello@lavender.studio",
    logoDataUrl: "",
  });

  const [clients, setClients] = useState<Client[]>([
    {
      id: "c1",
      name: "Maple & Co.",
      email: "billing@mapleco.com",
      address: "22 Pine Street, Somewhere",
    },
    {
      id: "c2",
      name: "Sunny Snacks",
      email: "accounts@sunnysnacks.com",
      address: "44 Lemon Ave, Somewhere",
    },
  ]);

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? "");
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const [clientDraft, setClientDraft] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "Design & layout", qty: 1, unitPrice: 4999 },
    { id: uid(), description: "Revision pack", qty: 2, unitPrice: 999 },
  ]);

  const [taxMode, setTaxMode] = useState<TaxMode>("gst");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("INR");

  const [terms, setTerms] = useState(
    "Payment due within 7 days. Please include the invoice number as reference.",
  );
  const [notes, setNotes] = useState(
    "Thank you! You’re awesome. If you have questions, just reply to this email.",
  );

  const [paymentLinkType, setPaymentLinkType] = useState<"none" | "upi" | "paypal" | "stripe">(
    "upi",
  );
  const [paymentLinkValue, setPaymentLinkValue] = useState<string>(
    "upi://pay?pa=lavender@upi&pn=Lavender%20Studio&am=0",
  );
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "partial">(
    "unpaid",
  );

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const d = Number(discount) || 0;
    return Math.max(0, Math.min(subtotal, d));
  }, [discount, subtotal]);

  const taxableBase = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const taxAmount = useMemo(() => {
    if (taxMode === "none") return 0;
    const r = Math.max(0, Number(taxRate) || 0) / 100;
    return taxableBase * r;
  }, [taxMode, taxRate, taxableBase]);

  const total = useMemo(() => taxableBase + taxAmount, [taxableBase, taxAmount]);

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), description: "", qty: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function onLogoPick(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSender((s) => ({ ...s, logoDataUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  function saveInvoice() {
    const inv = {
      id: uid(),
      invoiceNumber,
      invoiceDate,
      dueDate,
      sender,
      client: selectedClient,
      items,
      taxMode,
      taxRate,
      discount,
      currency,
      terms,
      notes,
      payment: {
        type: paymentLinkType,
        value: paymentLinkValue,
        status: paymentStatus,
      },
      totals: {
        subtotal,
        discountAmount,
        taxAmount,
        total,
      },
      createdAt: new Date().toISOString(),
    };
    setSavedInvoices((prev) => [inv, ...prev]);
  }

  function printInvoice() {
    window.print();
  }

  function downloadAsJson() {
    const inv = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      sender,
      client: selectedClient,
      items,
      taxMode,
      taxRate,
      discount,
      currency,
      terms,
      notes,
      payment: {
        type: paymentLinkType,
        value: paymentLinkValue,
        status: paymentStatus,
      },
      totals: {
        subtotal,
        discountAmount,
        taxAmount,
        total,
      },
    };

    const blob = new Blob([JSON.stringify(inv, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addClient() {
    const name = clientDraft.name.trim();
    const email = clientDraft.email.trim();
    const address = clientDraft.address.trim();
    if (!name || !email) return;

    const c: Client = { id: uid(), name, email, address };
    setClients((prev) => [c, ...prev]);
    setSelectedClientId(c.id);
    setClientDraft({ name: "", email: "", address: "" });
  }

  const taxLabel = taxMode === "gst" ? "GST" : taxMode === "vat" ? "VAT" : "Tax";

  return (
    <div className="min-h-screen lavender-grid">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 subtle-noise" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-sm text-muted-foreground backdrop-blur sticker">
              <Sparkles className="h-4 w-4 text-primary" />
              <span data-testid="text-tagline">Cute, fast, and tidy invoices</span>
            </div>
            <h1 className="font-display mt-3 text-3xl leading-tight md:text-5xl" data-testid="text-title">
              Lavender Invoice Studio
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-subtitle">
              A cartoon-ish invoice maker with automatic totals, taxes, discounts, and a print-ready layout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={saveInvoice}
              data-testid="button-save-invoice"
            >
              <BadgeCheck className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={downloadAsJson}
              data-testid="button-download-json"
            >
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
            <Button
              className="rounded-full"
              onClick={printInvoice}
              data-testid="button-print-invoice"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="cartoon-card rounded-3xl border bg-white/80 p-5 backdrop-blur md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground" data-testid="text-invoice-number-label">Invoice No.</div>
                <div className="font-display text-xl" data-testid="text-invoice-number">{invoiceNumber}</div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10 w-[120px] rounded-full" data-testid="select-currency">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR" data-testid="option-currency-inr">INR</SelectItem>
                    <SelectItem value="USD" data-testid="option-currency-usd">USD</SelectItem>
                    <SelectItem value="EUR" data-testid="option-currency-eur">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium" data-testid="label-invoice-date">Invoice date</label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="mt-2 rounded-2xl"
                  data-testid="input-invoice-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium" data-testid="label-due-date">Due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-2 rounded-2xl"
                  data-testid="input-due-date"
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="font-display text-lg" data-testid="text-sender-title">From</div>
                <div className="mt-3 grid gap-3">
                  <Input
                    value={sender.businessName}
                    onChange={(e) => setSender((s) => ({ ...s, businessName: e.target.value }))}
                    className="rounded-2xl"
                    placeholder="Business name"
                    data-testid="input-sender-business"
                  />
                  <Textarea
                    value={sender.address}
                    onChange={(e) => setSender((s) => ({ ...s, address: e.target.value }))}
                    className="min-h-[92px] rounded-2xl"
                    placeholder="Address"
                    data-testid="input-sender-address"
                  />
                  <Input
                    value={sender.phone}
                    onChange={(e) => setSender((s) => ({ ...s, phone: e.target.value }))}
                    className="rounded-2xl"
                    placeholder="Phone"
                    data-testid="input-sender-phone"
                  />
                  <Input
                    value={sender.email}
                    onChange={(e) => setSender((s) => ({ ...s, email: e.target.value }))}
                    className="rounded-2xl"
                    placeholder="Email"
                    data-testid="input-sender-email"
                  />

                  <div className="rounded-2xl border bg-white/60 p-3">
                    <div className="text-xs text-muted-foreground" data-testid="text-logo-helper">
                      Optional logo (stored in browser memory)
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onLogoPick(e.target.files?.[0] ?? null)}
                        className="rounded-xl"
                        data-testid="input-sender-logo"
                      />
                    </div>
                    {sender.logoDataUrl ? (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={sender.logoDataUrl}
                          alt="Sender logo"
                          className="h-12 w-12 rounded-2xl border bg-white object-contain p-2"
                          data-testid="img-sender-logo"
                        />
                        <Button
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => setSender((s) => ({ ...s, logoDataUrl: "" }))}
                          data-testid="button-remove-logo"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-display text-lg" data-testid="text-client-title">Bill to</div>
                <div className="mt-3 grid gap-3">
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="h-11 rounded-2xl" data-testid="select-client">
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                          data-testid={`option-client-${c.id}`}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="rounded-2xl border bg-white/60 p-4">
                    <div className="text-xs text-muted-foreground" data-testid="text-client-preview-label">Selected client</div>
                    <div className="mt-2">
                      <div className="font-medium" data-testid="text-client-name">
                        {selectedClient?.name || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid="text-client-email">
                        {selectedClient?.email || ""}
                      </div>
                      <div className="mt-1 whitespace-pre-line text-sm" data-testid="text-client-address">
                        {selectedClient?.address || ""}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium" data-testid="text-add-client-title">Add new client</div>
                    </div>
                    <div className="mt-3 grid gap-3">
                      <Input
                        value={clientDraft.name}
                        onChange={(e) => setClientDraft((d) => ({ ...d, name: e.target.value }))}
                        className="rounded-2xl"
                        placeholder="Client name"
                        data-testid="input-client-name"
                      />
                      <Input
                        value={clientDraft.email}
                        onChange={(e) => setClientDraft((d) => ({ ...d, email: e.target.value }))}
                        className="rounded-2xl"
                        placeholder="Client email"
                        data-testid="input-client-email"
                      />
                      <Textarea
                        value={clientDraft.address}
                        onChange={(e) => setClientDraft((d) => ({ ...d, address: e.target.value }))}
                        className="min-h-[84px] rounded-2xl"
                        placeholder="Client address"
                        data-testid="input-client-address"
                      />
                      <Button
                        variant="secondary"
                        className="rounded-full"
                        onClick={addClient}
                        data-testid="button-add-client"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add client
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <div className="flex items-center justify-between">
                <div className="font-display text-lg" data-testid="text-items-title">Line items</div>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={addItem}
                  data-testid="button-add-item"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                {items.map((it, index) => {
                  const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <div
                      key={it.id}
                      className="rounded-2xl border bg-white/60 p-4"
                      data-testid={`row-item-${it.id}`}
                    >
                      <div className="grid gap-3 md:grid-cols-12 md:items-end">
                        <div className="md:col-span-6">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            data-testid={`label-item-desc-${it.id}`}
                          >
                            Description
                          </label>
                          <Input
                            value={it.description}
                            onChange={(e) => updateItem(it.id, { description: e.target.value })}
                            className="mt-2 rounded-2xl"
                            placeholder="What are you billing for?"
                            data-testid={`input-item-desc-${it.id}`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            data-testid={`label-item-qty-${it.id}`}
                          >
                            Qty
                          </label>
                          <Input
                            type="number"
                            value={String(it.qty)}
                            onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) })}
                            className="mt-2 rounded-2xl"
                            data-testid={`input-item-qty-${it.id}`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            data-testid={`label-item-unit-${it.id}`}
                          >
                            Unit
                          </label>
                          <Input
                            type="number"
                            value={String(it.unitPrice)}
                            onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                            className="mt-2 rounded-2xl"
                            data-testid={`input-item-unit-${it.id}`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground" data-testid={`label-item-total-${it.id}`}>
                                Total
                              </div>
                              <div className="mt-2 font-display" data-testid={`text-item-total-${it.id}`}>
                                {currency} {money(lineTotal)}
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              className="h-10 w-10 rounded-full p-0"
                              onClick={() => removeItem(it.id)}
                              disabled={items.length <= 1}
                              data-testid={`button-remove-item-${it.id}`}
                              aria-label={`Remove line item ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border bg-white/60 p-4">
                <div className="font-display text-lg" data-testid="text-tax-discount-title">Tax & discount</div>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium" data-testid="label-tax-mode">Tax type</label>
                      <Select value={taxMode} onValueChange={(v) => setTaxMode(v as TaxMode)}>
                        <SelectTrigger className="mt-2 h-11 rounded-2xl" data-testid="select-tax-mode">
                          <SelectValue placeholder="Tax" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" data-testid="option-tax-none">None</SelectItem>
                          <SelectItem value="gst" data-testid="option-tax-gst">GST</SelectItem>
                          <SelectItem value="vat" data-testid="option-tax-vat">VAT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium" data-testid="label-tax-rate">Rate (%)</label>
                      <Input
                        type="number"
                        value={String(taxRate)}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="mt-2 rounded-2xl"
                        disabled={taxMode === "none"}
                        data-testid="input-tax-rate"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium" data-testid="label-discount">Discount (flat)</label>
                    <Input
                      type="number"
                      value={String(discount)}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="mt-2 rounded-2xl"
                      data-testid="input-discount"
                    />
                    <div className="mt-2 text-xs text-muted-foreground" data-testid="text-discount-helper">
                      Tip: for percentage discounts, we can add a toggle later.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white/60 p-4">
                <div className="font-display text-lg" data-testid="text-payment-title">Payment link</div>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="text-sm font-medium" data-testid="label-payment-link-type">Type</label>
                    <Select value={paymentLinkType} onValueChange={(v) => setPaymentLinkType(v as any)}>
                      <SelectTrigger className="mt-2 h-11 rounded-2xl" data-testid="select-payment-link-type">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" data-testid="option-payment-none">None</SelectItem>
                        <SelectItem value="upi" data-testid="option-payment-upi">UPI</SelectItem>
                        <SelectItem value="paypal" data-testid="option-payment-paypal">PayPal</SelectItem>
                        <SelectItem value="stripe" data-testid="option-payment-stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium" data-testid="label-payment-link-value">Link / URI</label>
                    <Input
                      value={paymentLinkValue}
                      onChange={(e) => setPaymentLinkValue(e.target.value)}
                      className="mt-2 rounded-2xl"
                      disabled={paymentLinkType === "none"}
                      placeholder="Paste a payment link"
                      data-testid="input-payment-link"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" data-testid="label-payment-status">Status</label>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                      <SelectTrigger className="mt-2 h-11 rounded-2xl" data-testid="select-payment-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid" data-testid="option-payment-status-unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial" data-testid="option-payment-status-partial">Partial</SelectItem>
                        <SelectItem value="paid" data-testid="option-payment-status-paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs text-muted-foreground" data-testid="text-payment-helper">
                    This mockup displays your link on the print layout. Real payments + webhooks require a backend.
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="font-display text-lg" data-testid="text-terms-title">Terms</div>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="mt-3 min-h-[120px] rounded-2xl"
                  data-testid="input-terms"
                />
              </div>
              <div>
                <div className="font-display text-lg" data-testid="text-notes-title">Notes</div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-3 min-h-[120px] rounded-2xl"
                  data-testid="input-notes"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-white/60 p-4">
              <div className="font-display text-lg" data-testid="text-summary-title">Summary</div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between" data-testid="row-subtotal">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal">{currency} {money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between" data-testid="row-discount">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium" data-testid="text-discount">- {currency} {money(discountAmount)}</span>
                </div>
                {taxMode !== "none" ? (
                  <div className="flex items-center justify-between" data-testid="row-tax">
                    <span className="text-muted-foreground">{taxLabel} ({money(taxRate)}%)</span>
                    <span className="font-medium" data-testid="text-tax">{currency} {money(taxAmount)}</span>
                  </div>
                ) : null}
                <Separator className="my-2" />
                <div className="flex items-center justify-between" data-testid="row-total">
                  <span className="font-display text-base">Total</span>
                  <span className="font-display text-xl" data-testid="text-total">{currency} {money(total)}</span>
                </div>
              </div>
            </div>

            {savedInvoices.length ? (
              <div className="mt-6 rounded-2xl border bg-white/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg" data-testid="text-saved-title">Saved invoices (session)</div>
                  <div className="text-xs text-muted-foreground" data-testid="text-saved-helper">
                    Stored in memory for this prototype
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {savedInvoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-2xl border bg-white/60 p-3"
                      data-testid={`card-saved-${inv.id}`}
                    >
                      <div>
                        <div className="font-medium" data-testid={`text-saved-number-${inv.id}`}>{inv.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground" data-testid={`text-saved-meta-${inv.id}`}>
                          {inv.client?.name || "—"} • {inv.currency} {money(inv.totals?.total ?? 0)}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="rounded-full"
                        onClick={() => {
                          setInvoiceDate(inv.invoiceDate);
                          setDueDate(inv.dueDate);
                          setSender(inv.sender);
                          if (inv.client?.id) setSelectedClientId(inv.client.id);
                          setItems(inv.items);
                          setTaxMode(inv.taxMode);
                          setTaxRate(inv.taxRate);
                          setDiscount(inv.discount);
                          setCurrency(inv.currency);
                          setTerms(inv.terms);
                          setNotes(inv.notes);
                          setPaymentLinkType(inv.payment?.type ?? "none");
                          setPaymentLinkValue(inv.payment?.value ?? "");
                          setPaymentStatus(inv.payment?.status ?? "unpaid");
                        }}
                        data-testid={`button-load-invoice-${inv.id}`}
                      >
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <div className="lg:sticky lg:top-6">
            <Card className="cartoon-card rounded-3xl border bg-white/85 p-6 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {sender.logoDataUrl ? (
                    <img
                      src={sender.logoDataUrl}
                      alt="Logo"
                      className="h-12 w-12 rounded-2xl border bg-white object-contain p-2"
                      data-testid="img-preview-logo"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br from-violet-200 to-white"
                      data-testid="img-preview-logo-placeholder"
                    >
                      <span className="font-display text-lg text-violet-700">LS</span>
                    </div>
                  )}
                  <div>
                    <div className="font-display text-xl" data-testid="text-preview-header">Invoice</div>
                    <div className="text-sm text-muted-foreground" data-testid="text-preview-number">
                      {invoiceNumber}
                    </div>
                  </div>
                </div>
                <div className="rounded-full border bg-white/70 px-3 py-1 text-xs text-muted-foreground" data-testid="badge-payment-status">
                  Payment: {paymentStatus}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground" data-testid="text-preview-from-label">From</div>
                  <div className="font-medium" data-testid="text-preview-from-name">{sender.businessName}</div>
                  <div className="mt-1 whitespace-pre-line text-sm" data-testid="text-preview-from-address">{sender.address}</div>
                  <div className="mt-2 text-sm" data-testid="text-preview-from-contact">
                    {sender.phone} • {sender.email}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground" data-testid="text-preview-to-label">Bill to</div>
                  <div className="font-medium" data-testid="text-preview-to-name">{selectedClient?.name || "—"}</div>
                  <div className="mt-1 whitespace-pre-line text-sm" data-testid="text-preview-to-address">{selectedClient?.address || ""}</div>
                  <div className="mt-2 text-sm" data-testid="text-preview-to-email">{selectedClient?.email || ""}</div>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between" data-testid="row-preview-date">
                  <span className="text-muted-foreground">Invoice date</span>
                  <span data-testid="text-preview-invoice-date">{invoiceDate}</span>
                </div>
                <div className="flex items-center justify-between" data-testid="row-preview-due">
                  <span className="text-muted-foreground">Due date</span>
                  <span data-testid="text-preview-due-date">{dueDate}</span>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="overflow-hidden rounded-2xl border bg-white/60">
                <div className="grid grid-cols-12 gap-2 border-b bg-white/70 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <div className="col-span-6" data-testid="col-desc">Description</div>
                  <div className="col-span-2 text-right" data-testid="col-qty">Qty</div>
                  <div className="col-span-2 text-right" data-testid="col-unit">Unit</div>
                  <div className="col-span-2 text-right" data-testid="col-total">Total</div>
                </div>
                <div className="divide-y">
                  {items.map((it) => {
                    const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
                    return (
                      <div
                        key={it.id}
                        className="grid grid-cols-12 gap-2 px-4 py-3 text-sm"
                        data-testid={`row-preview-item-${it.id}`}
                      >
                        <div className="col-span-6" data-testid={`text-preview-desc-${it.id}`}>{it.description || "—"}</div>
                        <div className="col-span-2 text-right" data-testid={`text-preview-qty-${it.id}`}>{it.qty}</div>
                        <div className="col-span-2 text-right" data-testid={`text-preview-unit-${it.id}`}>{currency} {money(it.unitPrice)}</div>
                        <div className="col-span-2 text-right font-medium" data-testid={`text-preview-total-${it.id}`}>{currency} {money(lineTotal)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border bg-white/60 p-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between" data-testid="row-preview-subtotal">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="text-preview-subtotal">{currency} {money(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between" data-testid="row-preview-discount">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium" data-testid="text-preview-discount">- {currency} {money(discountAmount)}</span>
                  </div>
                  {taxMode !== "none" ? (
                    <div className="flex items-center justify-between" data-testid="row-preview-tax">
                      <span className="text-muted-foreground">{taxLabel}</span>
                      <span className="font-medium" data-testid="text-preview-tax">{currency} {money(taxAmount)}</span>
                    </div>
                  ) : null}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between" data-testid="row-preview-total">
                    <span className="font-display">Total</span>
                    <span className="font-display text-lg" data-testid="text-preview-total">{currency} {money(total)}</span>
                  </div>
                </div>
              </div>

              {paymentLinkType !== "none" && paymentLinkValue.trim() ? (
                <div className="mt-5 rounded-2xl border bg-gradient-to-br from-violet-100 to-white p-4">
                  <div className="font-display text-base" data-testid="text-preview-pay-title">Pay now</div>
                  <div className="mt-1 text-sm text-muted-foreground" data-testid="text-preview-pay-type">
                    {paymentLinkType.toUpperCase()} link
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={paymentLinkValue}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
                      data-testid="link-payment"
                    >
                      Open payment link
                    </a>
                    <div className="text-xs text-muted-foreground" data-testid="text-preview-pay-note">
                      (Included on your printed invoice)
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground" data-testid="text-preview-terms-label">Terms</div>
                  <div className="mt-1 whitespace-pre-line text-sm" data-testid="text-preview-terms">{terms}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground" data-testid="text-preview-notes-label">Notes</div>
                  <div className="mt-1 whitespace-pre-line text-sm" data-testid="text-preview-notes">{notes}</div>
                </div>
              </div>

              <div className="mt-6 text-xs text-muted-foreground" data-testid="text-print-hint">
                Tip: Click “Print / Save PDF” to generate a PDF via your browser print dialog.
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .lavender-grid, .subtle-noise { display: none !important; }
          header, nav { display: none !important; }
          button, [data-testid^="button-"], [data-testid^="select-"] { display: none !important; }
          .cartoon-card { box-shadow: none !important; }
          .sticker { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
