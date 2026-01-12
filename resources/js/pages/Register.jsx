import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useDebounce from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { toast, Toaster } from "sonner";
import { z } from "zod";

const MAX_MB = 2 * 1024 * 1024;
const ALLOWED_FORMAT = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        surname: z.string().min(1, "Surname is required"),
        email: z
            .string()
            .email("Invalid email")
            .refine(async (val) => {
                try {
                    const res = await axios.get(`checkEmail/${val}`);
                    return !res.data.exists;
                } catch {
                    return false;
                }
            }, "Email already taken"),
        username: z
            .string()
            .min(3, "Too short")
            .refine(async (val) => {
                try {
                    const res = await axios.get(`checkUsername/${val}`);
                    return !res.data.exists;
                } catch {
                    return false;
                }
            }, "Username taken"),
        password: z.string().min(8, "Min 8 characters"),
        confirm_password: z.string().min(1, "Please confirm your password"),
        profile_picture: z.any().optional(),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"], // <--- Questo deve corrispondere al 'name' del FormField
    });

export default function Register() {
    let navigate = useNavigate();
    const { setUser } = useAuth();

    const form = useForm({
        resolver: zodResolver(formSchema),
        reValidateMode: "onChange",
        defaultValues: {
            name: "",
            surname: "",
            email: "",
            username: "",
            password: "",
            confirm_password: "",
            profile_picture: null,
        },
        mode: "onBlur",
    });

    async function onSubmit(values) {
        try {
            const formData = new FormData();

            // Mappatura automatica dei valori semplici
            Object.keys(values).forEach((key) => {
                if (key !== "profile_picture") {
                    formData.append(key, values[key]);
                }
            });

            // Gestione specifica del file
            if (values.profile_picture) {
                formData.append("profile_picture", values.profile_picture);
            }

            await axios.post("spa/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Registration successful!");
            navigate("/login");
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const serverErrors = error.response.data.errors;

                // Distribuisce gli errori di Laravel sui campi corretti del form
                Object.keys(serverErrors).forEach((field) => {
                    form.setError(field, {
                        type: "server",
                        message: serverErrors[field][0],
                    });
                });
            } else {
                form.setError("root", {
                    message: "Something went wrong. Please try again later.",
                });
            }
        }
    }

    return (
        <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
            <Toaster position="top-right" richColors />
            <Card className="min-w-md">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FieldTitle className="text-xl font-semibold text-center mb-6">
                                Register
                            </FieldTitle>

                            {/* NOME E COGNOME */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    autoComplete="given-name"
                                                    placeholder="John"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="surname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Surname</FormLabel>
                                            <FormControl>
                                                <Input
                                                    autoComplete="family-name"
                                                    placeholder="Doe"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* EMAIL */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* USERNAME */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="username"
                                                placeholder="johndoe88"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* FOTO PROFILO */}
                            <FormField
                                control={form.control}
                                name="profile_picture"
                                render={({
                                    field: { value, onChange, ...fieldProps },
                                }) => (
                                    <FormItem>
                                        <FormLabel>Profile Picture</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept={ALLOWED_FORMAT.join(
                                                    ","
                                                )}
                                                onChange={(e) =>
                                                    onChange(
                                                        e.target.files?.[0]
                                                    )
                                                }
                                                {...fieldProps}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* PASSWORD */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
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

                            {/* CONFERMA PASSWORD */}
                            <FormField
                                control={form.control}
                                name="confirm_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="confirm-password"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* ERRORE GENERALE */}
                            {form.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.root.message}
                                </p>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting
                                        ? "Registering..."
                                        : "Register"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
