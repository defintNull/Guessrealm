import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageCropDialog from "@/components/ImageCropDialog";
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
        profile_picture: z
            .any()
            .refine(
                (file) => !file || file.size <= MAX_MB,
                "File too large (max 2MB)"
            )
            .refine(
                (file) => !file || ALLOWED_FORMAT.includes(file.type),
                "Format not supported"
            )
            .optional(),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"], // <--- Questo deve corrispondere al 'name' del FormField
    });

export default function Register() {
    let navigate = useNavigate();
    const { setUser } = useAuth();
    const [preview, setPreview] = useState(null);
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);

    const form = useForm({
        resolver: zodResolver(formSchema),
        reValidateMode: "onBlur",
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

    // Profile picture change handler with validations and crop dialog
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_MB) {
            toast.error("File is too large. Max size is 2MB.");
            return;
        }
        if (!ALLOWED_FORMAT.includes(file.type)) {
            toast.error("Invalid file format. Please upload JPG, PNG or WEBP.");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setCropSrc(objectUrl);
        setOriginalFile(file);
        setCropOpen(true);
    };

    const handleRemoveImage = () => {
        setPreview(null);
        // Clear form value
        form.setValue("profile_picture", null);
    };

    // Cleanup cropSrc object URL when dialog closes
    useEffect(() => {
        return () => {
            if (cropSrc) URL.revokeObjectURL(cropSrc);
        };
    }, [cropSrc]);

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
                                        {form.formState.isValidating && field.value && (
                                            <p className="text-xs text-muted-foreground">Checking availability...</p>
                                        )}
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
                                        {form.formState.isValidating && field.value && (
                                            <p className="text-xs text-muted-foreground">Checking availability...</p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* PROFILE PICTURE (with preview + crop) */}
                            <FormField
                                control={form.control}
                                name="profile_picture"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Profile Picture</FormLabel>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage src={preview} />
                                                <AvatarFallback>
                                                    {(form.watch("name") || "")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                    {(form.watch("surname") || "")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    type="file"
                                                    id="register-picture-upload"
                                                    className="hidden"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    onChange={handleImageChange}
                                                />
                                                <Button asChild variant="outline" type="button">
                                                    <label htmlFor="register-picture-upload" className="cursor-pointer">
                                                        Change Photo
                                                    </label>
                                                </Button>
                                                {preview && (
                                                    <Button
                                                        variant="destructive"
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
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
            {/* Crop Dialog */}
            <ImageCropDialog
                open={cropOpen}
                onOpenChange={(open) => {
                    if (!open && cropSrc) {
                        URL.revokeObjectURL(cropSrc);
                        setCropSrc(null);
                        setOriginalFile(null);
                    }
                    setCropOpen(open);
                }}
                imageSrc={cropSrc}
                originalFile={originalFile}
                fileName={form.watch("username") || "profile-picture"}
                onCropComplete={(file, url) => {
                    form.setValue("profile_picture", file);
                    setPreview(url);
                }}
            />
        </div>
    );
}
