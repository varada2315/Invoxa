import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ReceiptText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, signupMutation } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/create");
    }
  }, [setLocation, user]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await signupMutation.mutateAsync({ name, email, password });
      setLocation("/create");
    } catch (error) {
      toast({
        title: "Signup failed",
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
          <h1 className="font-display text-3xl text-violet-950">Sign Up</h1>
          <p className="mt-2 text-sm text-violet-900/60">Create your account to start saving invoices under your own login.</p>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-2xl"
            />
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
            <Button type="submit" className="h-12 w-full rounded-2xl bg-violet-600 hover:bg-violet-700" disabled={signupMutation.isPending}>
              <UserPlus className="mr-2 h-4 w-4" />
              {signupMutation.isPending ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-violet-900/60">
            Already have an account? <Link href="/login" className="font-semibold text-violet-700">Login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
