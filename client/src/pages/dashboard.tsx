import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { FilePlus2, Files, LogOut, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, logoutMutation } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, setLocation, user]);

  if (isLoading || !user) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-violet-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-violet-700 font-semibold">
              <ReceiptText className="h-5 w-5" />
              Invoxa
            </Link>
            <h1 className="mt-4 font-display text-4xl text-violet-950">Welcome, {user.name}</h1>
            <p className="mt-2 text-violet-900/60">Choose what you want to do with your account.</p>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={async () => {
              await logoutMutation.mutateAsync();
              setLocation("/");
            }}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="rounded-3xl border-violet-100 p-8">
            <FilePlus2 className="h-10 w-10 text-violet-600" />
            <h2 className="mt-6 font-display text-2xl text-violet-950">Create New Invoice</h2>
            <p className="mt-2 text-sm text-violet-900/60">Open the invoice editor and create a fresh invoice under your account.</p>
            <Link href="/create">
              <Button className="mt-8 rounded-2xl bg-violet-600 hover:bg-violet-700">Create Invoice</Button>
            </Link>
          </Card>

          <Card className="rounded-3xl border-violet-100 p-8">
            <Files className="h-10 w-10 text-violet-600" />
            <h2 className="mt-6 font-display text-2xl text-violet-950">View Saved Invoices</h2>
            <p className="mt-2 text-sm text-violet-900/60">Open your saved invoice list to edit, print, or download older invoices.</p>
            <Link href="/create#saved-invoices">
              <Button variant="outline" className="mt-8 rounded-2xl border-violet-200 text-violet-700">Open Saved Invoices</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
