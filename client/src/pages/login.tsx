import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [setLocation, user]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await loginMutation.mutateAsync({ email, password });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-violet-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-violet-700 font-semibold">
          <ReceiptText className="h-5 w-5" />
          Invoxa
        </Link>
        <Card className="mt-6 rounded-3xl border-violet-100 p-8">
          <h1 className="font-display text-3xl text-violet-950">Login</h1>
          <p className="mt-2 text-sm text-violet-900/60">Enter your email and password to open your invoice dashboard.</p>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-2xl"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-2xl"
            />
            <Button type="submit" className="h-12 w-full rounded-2xl bg-violet-600 hover:bg-violet-700" disabled={loginMutation.isPending}>
              <LogIn className="mr-2 h-4 w-4" />
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-violet-900/60">
            New here? <Link href="/signup" className="font-semibold text-violet-700">Create an account</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
