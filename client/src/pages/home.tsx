import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  CheckCircle,
  ReceiptText,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-violet-50 font-sans selection:bg-violet-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 p-1.5 rounded-xl shadow-lg shadow-violet-200">
              <ReceiptText className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-violet-950">Invoxa</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/create#saved-invoices">
              <Button variant="outline" className="rounded-full border-violet-200 text-violet-700 hover:bg-violet-100 px-6">
                View Saved Invoices
              </Button>
            </Link>
            <Link href="/create">
              <Button className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-6">
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-bold mb-6 border border-violet-200">
              <Sparkles className="h-4 w-4" />
              <span>Smart GST Invoicing for India</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-violet-950 mb-6 leading-tight">
              Invoicing that feels like <span className="text-violet-600">magic.</span>
            </h1>
            <p className="text-lg md:text-xl text-violet-900/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create professional, GST-compliant invoices in seconds with Invoxa. 
              Beautiful themes, automatic calculations, and cartoon-ish charm.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/create">
                <Button className="h-14 px-10 rounded-2xl bg-violet-600 hover:bg-violet-700 text-lg font-bold shadow-xl shadow-violet-200 group">
                  Start Invoicing Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/create#saved-invoices">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl text-violet-600 font-bold hover:bg-violet-100">
                  <Archive className="mr-2 h-5 w-5" />
                  View Saved Invoices
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-violet-400/20 blur-3xl rounded-full" />
            <div className="relative border-8 border-white rounded-[2.5rem] shadow-2xl overflow-hidden bg-white/50 backdrop-blur">
              <img 
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2000&auto=format&fit=crop" 
                alt="App Interface" 
                className="w-full h-auto opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-violet-900/10 backdrop-blur-[2px]">
                <div className="bg-white/90 p-8 rounded-3xl shadow-2xl max-w-md border border-violet-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-violet-950">GST Calculated!</div>
                      <div className="text-sm text-violet-900/60">Auto-applied 18% CGST/SGST</div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-violet-100 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-violet-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-orange-500" />}
              title="Lightning Fast"
              description="5-step wizard designed for speed. Go from zero to invoice in under 60 seconds."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
              title="GST Compliant"
              description="Built for the Indian market with automatic GST and professional tax formatting."
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6 text-violet-500" />}
              title="Print Ready"
              description="Beautifully formatted PDF output that looks great on paper or screen."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-violet-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ReceiptText className="h-5 w-5 text-violet-600" />
          <span className="font-display text-xl font-bold text-violet-950">Invoxa</span>
        </div>
        <p className="text-violet-900/40 text-sm">© 2026 Invoxa Invoicing. Crafted with love.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="p-8 border-violet-100 rounded-3xl hover:shadow-xl hover:shadow-violet-100 transition-all border-2">
      <div className="mb-6 p-3 bg-violet-50 w-fit rounded-2xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-violet-950 mb-3">{title}</h3>
      <p className="text-violet-900/60 leading-relaxed">{description}</p>
    </Card>
  );
}
