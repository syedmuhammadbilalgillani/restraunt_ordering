"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/lib/iron-session/auth/auth.actions";
import { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().trim().max(20).optional(),
  gender: z.string().trim().max(20).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditProfileComponent({
  isAuthenticated,
  user,
}: {
  isAuthenticated: boolean;
  user: User;
}) {
  const navigate = useRouter();

  useEffect(() => {
    if (!isAuthenticated) navigate.push("/login");
  }, [isAuthenticated, navigate]);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    const res = await updateProfileAction({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      gender: data.gender || "",
    });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile updated successfully!");
    navigate.push("/profile");
  };
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-lg">
        <Button
          variant="ghost"
          className="gap-2 mb-6"
          onClick={() => navigate.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="font-display text-3xl font-bold mb-8">Edit Profile</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Input placeholder="Male, Female, Other" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full rounded-xl h-12">
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
