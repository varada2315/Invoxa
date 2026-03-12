import { Link } from "wouter";
import { LogIn, ReceiptText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-violet-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-violet-600 p-2 text-white">
              <ReceiptText className="h-6 w-6" />
            </div>
            <span className="font-display text-3xl text-violet-950">Invoxa</span>
          </div>
          {!isLoading && user && (
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full border-violet-200 text-violet-700">
                Open Dashboard
              </Button>
            </Link>
          )}
        </nav>

        <section className="grid items-center gap-8 pt-20 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
              Multi-user invoice workspace
            </p>
            <h1 className="mt-6 font-display text-5xl leading-tight text-violet-950 md:text-7xl">
              Login or sign up to manage your invoices.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-violet-900/65">
              Each user gets a separate account with private saved invoices and templates. Login to continue, or create a new account to start invoicing.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login">
                <Button className="h-14 rounded-2xl bg-violet-600 px-8 text-lg hover:bg-violet-700">
                  <LogIn className="mr-2 h-5 w-5" />
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="h-14 rounded-2xl border-violet-200 px-8 text-lg text-violet-700">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>

          <Card className="rounded-[2rem] border-violet-100 p-8 shadow-xl shadow-violet-100/60">
            <h2 className="font-display text-3xl text-violet-950">Workflow</h2>
            <div className="mt-8 space-y-5 text-sm text-violet-900/70">
              <div>
                <p className="font-semibold text-violet-950">1. Home page</p>
                <p>Choose Login or Sign Up.</p>
              </div>
              <div>
                <p className="font-semibold text-violet-950">2. Login</p>
                <p>Open your dashboard, then choose Create New Invoice or View Saved Invoices.</p>
              </div>
              <div>
                <p className="font-semibold text-violet-950">3. Sign Up</p>
                <p>Create a new account with name, email, and password, then continue directly to invoice creation.</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
