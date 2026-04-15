"use client";

import { useState } from "react";
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
import { otpStart, passwordResetConfirm, passwordResetVerifyOtp } from "@/lib/customer-auth";

const startSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

const verifySchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const confirmSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type StartForm = z.infer<typeof startSchema>;
type VerifyForm = z.infer<typeof verifySchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"start" | "verify" | "confirm">("start");
  const [loading, setLoading] = useState(false);

  const [resetSessionToken, setResetSessionToken] = useState<string | null>(null);

  const startForm = useForm<StartForm>({
    resolver: zodResolver(startSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: "", otp: "" },
  });

  const confirmForm = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onStart = async (data: StartForm) => {
    setLoading(true);
    try {
      await otpStart({ email: data.email, channel: "email", purpose: "reset" });
      toast.success("If the email exists, we sent a reset code.");
      verifyForm.setValue("email", data.email);
      setStep("verify");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reset OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data: VerifyForm) => {
    setLoading(true);
    try {
      const res = await passwordResetVerifyOtp({
        purpose: "reset",
        email: data.email,
        otp: data.otp,
      });
      setResetSessionToken(res.resetSessionToken);
      toast.success("Code verified. Set a new password.");
      setStep("confirm");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async (data: ConfirmForm) => {
    if (!resetSessionToken) {
      toast.error("Missing reset session. Please restart.");
      setStep("start");
      return;
    }
    setLoading(true);
    try {
      await passwordResetConfirm({
        resetSessionToken,
        newPassword: data.newPassword,
      });
      toast.success("Password reset. You can sign in now.");
      router.push("/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid or expired reset session");
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
          <CardTitle className="font-display text-2xl">Reset password</CardTitle>
          <CardDescription>
            {step === "start"
              ? "We’ll email you a reset code."
              : step === "verify"
                ? "Enter the 6-digit code."
                : "Choose a new password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "start" && (
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
                  {loading ? "Sending..." : "Send reset code"}
                </Button>
              </form>
            </Form>
          )}

          {step === "verify" && (
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
                    {loading ? "Verifying..." : "Verify code"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {step === "confirm" && (
            <Form {...confirmForm}>
              <form onSubmit={confirmForm.handleSubmit(onConfirm)} className="space-y-4">
                <FormField
                  control={confirmForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={confirmForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Set new password"}
                </Button>
              </form>
            </Form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}