"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import {
  Loader2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Scissors,
  CalendarCheck,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

type LoginFormProps = React.ComponentProps<"div">;

const features = [
  { icon: CalendarCheck, label: "Appointments & scheduling" },
  { icon: Users, label: "Clients & staff management" },
  { icon: TrendingUp, label: "Sales & revenue insights" },
];

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.login({
        email: email.trim(),
        password,
      });

  
      if (!response.success) {
        toast.error(response.message || "Login failed");
        return;
      }

      if(response.data?.data?.role == "ADMIN") {
        toast.success("Login successful!");
        router.replace("/dashboard");
      }else{
        router.replace("/");
        toast.error("You do not have permission to access this portal.");
      }

      
    } catch (error: unknown) {
      console.error("LOGIN ERROR:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          axiosError.response?.data?.message || "Invalid email or password"
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-svh w-full items-center justify-center bg-muted/40 p-4 md:p-8",
        className
      )}
      {...props}
    >
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 sm:p-8 md:p-12">
              <FieldGroup>
                {/* Brand */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Scissors className="size-6" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                      Salon Neo
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">
                      Admin Portal
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sign in to manage your salon.
                    </p>
                  </div>
                </div>

                {/* Email */}
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@salonneo.com"
                      className="h-10 pl-10"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </Field>

                {/* Password */}
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="/forgot-password"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-10 px-10"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </Field>

                {/* Submit */}
                <Field>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-10 w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </Field>

                <FieldDescription className="flex items-center justify-center gap-1.5 text-center text-xs">
                  <ShieldCheck className="size-3.5" />
                  Secured with encrypted authentication
                </FieldDescription>
              </FieldGroup>
            </form>

            {/* Brand panel */}
            <div className="relative hidden min-h-[560px] flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Scissors className="size-4" />
                Salon Neo
              </div>

              <div>
                <h2 className="text-3xl font-bold leading-tight">
                  Beauty, business
                  <br />
                  all in one place.
                </h2>
                <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
                  Run appointments, clients, staff and sales from a single
                  dashboard.
                </p>

                <ul className="mt-8 space-y-3">
                  {features.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 rounded-lg border border-primary-foreground/15 px-4 py-3 text-sm"
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="px-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}