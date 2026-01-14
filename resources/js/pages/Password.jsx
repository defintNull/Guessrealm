import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { toast, Toaster } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z
    .object({
        current_password: z.string().min(1, "Current password is required"),
        new_password: z
            .string()
            .min(8, "New password must be at least 8 characters long"),
        confirm_new_password: z
            .string()
            .min(8, "Please confirm your new password"),
    })
    .refine((data) => data.new_password === data.confirm_new_password, {
        message: "Passwords do not match",
        path: ["confirm_new_password"],
    });

export default function Password() {
    let navigate = useNavigate();
    const { user } = useAuth();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            current_password: "",
            new_password: "",
            confirm_new_password: "",
        },
        mode: "onBlur",
    });

async function onSubmit(values) {
    try {
        await axios.post('/spa/updatePassword', {
            current_password: values.current_password,
            new_password: values.new_password,
            confirm_password: values.confirm_new_password,
        });
        toast.success("Password updated successfully");
        form.reset();
    } catch (error) {
        if (error.response && error.response.status === 422) {
            const serverErrors = error.response.data.errors;
            Object.keys(serverErrors).forEach((key) => {
                form.setError(key, {
                    type: "server",
                    message: serverErrors[key][0],
                });
            });
        } else {
            // Errore generico che appare sopra il pulsante (root)
            form.setError("root", {
                message: "Something went wrong. Please try again."
            });
        }
    }
}

    return (
        <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
            <Toaster position="top-right" richColors />
            <Card className="min-w-md">
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FieldTitle>Change Password</FieldTitle>
                            {/* Campo per la password attuale */}
                            <FormField
                                control={form.control}
                                name="current_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="current-password"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Campo per la nuova password */}
                            <FormField
                                control={form.control}
                                name="new_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="new-password"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Campo per la conferma della nuova password */}
                            <FormField
                                control={form.control}
                                name="confirm_new_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Confirm New Password
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="new-password"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* ERRORI ROOT (ERRORE SERVER GENERALE) */}
                            {form.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.root.message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting
                                    ? "Updating..."
                                    : "Update Password"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
