
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "@/lib/firebase";
import { toast } from "sonner";

// Extend window type for Firebase
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: import("firebase/auth").ConfirmationResult;
  }
}

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, max 10
    if (/^\d{0,10}$/.test(value)) {
      setPhone(value);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;

    setLoading(true);
    try {
      // Check registration status before sending OTP
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3050";
      const res = await fetch(`${apiBaseUrl}/users/is-registered?phone=${phone}`);
      if (res.status === 202) {
        // User is registered, proceed to send OTP
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {},
            }
          );
          await window.recaptchaVerifier.render();
        }

        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          "+91" + phone,
          appVerifier
        );

        window.confirmationResult = confirmationResult;
        toast.success("OTP sent!");
        setOtpSent(true);
      } else if (res.status === 403) {
        toast.error("User is not registered. Please contact admin.");
      } else {
        toast.error("Invalid phone number or server error.");
      }
    } catch (err) {
      console.error("OTP Error:", err);
      toast.error("Failed to check registration or send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP form logic
  const otpSchema = z.object({ pin: z.string().min(6, "OTP must be 6 digits") });
  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { pin: "" },
    mode: "onChange",
  });

  const handleOtpSubmit = async (values: { pin: string }) => {
    if (!window.confirmationResult) {
      toast.error("No OTP confirmation found. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(values.pin);
      // Get Firebase JWT
      const user = result.user;
      const token = await user.getIdToken();
      localStorage.setItem("firebase_jwt", token);
      console.log("Firebase JWT:", token);
      toast.success("OTP verified! You are logged in.");
      navigate("/balance-sheet");
    } catch (err) {
      toast.error("Invalid OTP. Please try again.");
      console.error("OTP Verification Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      {!otpSent ? (
        <form
          onSubmit={handleSendOtp}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
          <div className="flex flex-col gap-3">
            <Input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
              required
            />
            <div id="recaptcha-container" />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        </form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm space-y-6">
            <h1 className="text-2xl font-bold text-center mb-4">Enter OTP</h1>
            <FormField
              control={otpForm.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Please enter the one-time password sent to your phone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full mt-4">Submit</Button>
          </form>
        </Form>
      )}
    </div>
  );
}
