"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { otpStart } from "@/lib/customer-auth";
import { useAuthStore } from "@/store/auth-store";

const startSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

const verifySchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

type StartForm = z.infer<typeof startSchema>;
type VerifyForm = z.infer<typeof verifySchema>;

export default function LoginOtpPage() {
  const router = useRouter();
  const { loginWithOtpVerify } = useAuthStore();

  const [step, setStep] = useState<"start" | "verify">("start");
  const [loading, setLoading] = useState(false);

  const startForm = useForm<StartForm>({
    resolver: zodResolver(startSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: "", otp: "" },
  });

  const emailValue = useMemo(() => {
    return step === "start" ? startForm.watch("email") : verifyForm.watch("email");
  }, [startForm, step, verifyForm]);

  const onStart = async (data: StartForm) => {
    setLoading(true);
    try {
      await otpStart({ email: data.email, channel: "email", purpose: "login" });
      toast.success("If the email exists, an OTP was sent.");
      verifyForm.setValue("email", data.email);
      setStep("verify");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data: VerifyForm) => {
    setLoading(true);
    try {
      await loginWithOtpVerify({ email: data.email, otp: data.otp });
      toast.success("Logged in!");
      router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display text-xl font-bold">
              F
            </div>
          </div>
          <CardTitle className="font-display text-2xl">Sign in with OTP</CardTitle>
          <CardDescription>
            {step === "start" ? "We’ll email you a 6-digit code." : "Enter the 6-digit code we sent."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "start" ? (
            <Form {...startForm}>
              <form onSubmit={startForm.handleSubmit(onStart)} className="space-y-4">
                <FormField
                  control={startForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send code"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={() => setStep("start")}
                  >
                    Back
                  </Button>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & sign in"}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={loading || !emailValue}
                  onClick={() => startForm.handleSubmit(onStart)()}
                >
                  Resend code
                </Button>
              </form>
            </Form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Back to password login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}