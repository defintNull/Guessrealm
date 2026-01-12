import { useState } from "react";
import { Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import { useTheme } from "@/context/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { email, z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const MAX_MB = 2 * 1024 * 1024;
const ALLOWED_FORMAT = ["image/jpeg", "image/png", "image/webp"];

let renderCount = 0;

const formSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(255)
        .refine(
            async (value) => {
                const response = await axios.get(`spa/checkUsername/${value}`);
                return !response.data.exists;
            },
            {
                message: "Username already exists",
            }
        ),
    surname: z.string().min(1).max(255),
    email: z
        .string()
        .min(1)
        .max(255)
        .email()
        .refine(
            async (value) => {
                const response = await axios.get(`spa/checkEmail/${value}`);
                return !response.data.exists;
            },
            {
                message: "Email already exists",
            }
        ),
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
    username: z.string().min(1).max(255),
    selectedTheme: z.enum(["system", "light", "dark"]),
    removeImage: z.boolean().optional(),
});

export default function Profile() {
    renderCount++;
    console.log("RenderCount: " + renderCount);

    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            surname: "",
            email: "",
            username: "",
            selectedTheme: "system",
            removeImage: false,
        },
    });

    //Inizializzazione stato
    // #region contesti, stati e custom hooks
    let navigate = useNavigate();
    const { user, setUser } = useAuth();
    const { theme, setTheme } = useTheme();

    const [preview, setPreview] = useState(user?.profile_picture_url || null);

    // #endregion

    // Carica i dati dell'utente quando il componente viene montato
    useEffect(() => {
        if (user) {
            // Popoliamo il form con i dati che arrivano dal context
            form.reset({
                name: user.name || "",
                surname: user.surname || "",
                email: user.email || "",
                username: user.username || "",
                selectedTheme: user.theme || "system",
                removeImage: false,
            });
        }
    }, [user, form.reset]);

    async function onSubmit(values) {
        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("surname", values.surname);
            formData.append("email", values.email);
            formData.append("username", values.username);
            formData.append("theme", values.selectedTheme);

            if (values.profile_picture) {
                formData.append("profile_picture", values.profile_picture);
            }

            // Laravel riceve i booleani spesso come 1/0 o stringhe
            formData.append("removeImage", values.removeImage ? "1" : "0");

            let res = await axios.post("/spa/profileUpdate", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Successo
            setUser(res.data.user);
            setTheme(values.selectedTheme);
            toast.success("Profile updated successfully!");
        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;

                if (status === 422) {
                    // Mappiamo gli errori di Laravel sui campi di Zod
                    const serverErrors = data.errors; // Esempio: { email: ["Già presa"], username: [...] }

                    Object.keys(serverErrors).forEach((key) => {
                        form.setError(key, {
                            type: "server",
                            message: serverErrors[key][0], // Prendiamo il primo messaggio dell'array
                        });
                    });

                    toast.error("Please check the highlighted fields.");
                } else if (status === 429) {
                    form.setError("root", {
                        message: "Too many requests. Try again later.",
                    });
                    toast.error("Too many requests!");
                } else {
                    form.setError("root", {
                        message: "A server error occurred.",
                    });
                    toast.error("Something went wrong!");
                }
            } else {
                console.error(error);
                toast.error("Connection error.");
            }
        }
    }

    // #region immagine del profilo
    const handleImageChange = (e) => {
        const file = e.target.files[0];

        // 1. Se l'utente ha aperto la finestra ma poi ha cliccato "Annulla", file sarà undefined.
        if (!file) return;

        // 2. Controllo Dimensione (Guard Clause 1)
        if (file.size > MAX_MB) {
            toast.error("File is too large. Max size is 2MB.");
            return; // STOP! Non procedere oltre.
        }

        // 3. Controllo Formato (Guard Clause 2)
        // Se la lista dei formati permessi NON (!) include il tipo del file...
        if (!ALLOWED_FORMAT.includes(file.type)) {
            toast.error("Invalid file format. Please upload JPG, PNG or WEBP.");
            return; // STOP!
        }

        // 4. Se siamo arrivati qui, il file è valido!
        form.setValue("profile_picture", file);

        // Importante: Se l'utente aveva cliccato "Rimuovi" ma poi carica una nuova foto,
        // dobbiamo resettare il flag di rimozione.
        form.setValue("removeImage", false);

        //aggiorniamo l'anteprima
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
    };

    // 1. "Estrai" il valore dal form per usarlo come dipendenza
    const profilePictureValue = form.watch("profile_picture");

    useEffect(() => {
        // Se non c'è un file (perché è null o è una stringa URL esistente), non fare nulla
        if (!profilePictureValue || !(profilePictureValue instanceof File)) {
            return;
        }

        // Crea l'URL per il file selezionato
        const objectUrl = URL.createObjectURL(profilePictureValue);
        setPreview(objectUrl);

        // FUNZIONE DI PULIZIA (Cleanup)
        // Questa funzione gira PRIMA che l'effetto venga eseguito di nuovo
        // o quando il componente viene smontato.
        return () => {
            URL.revokeObjectURL(objectUrl);
            // È buona norma resettare la preview a null se il file sparisce
            // ma attenzione a non sovrascrivere l'immagine del server se presente
        };
    }, [profilePictureValue]); // L'effetto parte solo quando cambia il file

    const handleRemoveImage = (e) => {
        form.setValue("profile_picture", null);
        form.setValue("removeImage", true);
        setPreview(null);
    };

    // #endregion

    // Se l'utente non è ancora pronto, mostriamo lo scheletro
    if (!user) {
        return (
            <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
                <Card className="min-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-6">
                            {/* Titolo */}
                            <Skeleton className="h-8 w-32" />

                            {/* Blocco Avatar */}
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-20 w-20 rounded-full" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-10 w-32" />{" "}
                                    {/* Bottone finto */}
                                </div>
                            </div>

                            {/* Campi Input */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />{" "}
                                    {/* Label */}
                                    <Skeleton className="h-10 w-full" />{" "}
                                    {/* Input */}
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>

                            {/* Bottone Save */}
                            <div className="flex justify-end pt-4">
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
            <Toaster position="top-right" richColors />
            <Card className="min-w-md">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FieldTitle className="text-xl font-semibold">
                                Edit Profile
                            </FieldTitle>

                            {/* SEZIONE AVATAR */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={preview} />
                                    <AvatarFallback>
                                        {user?.name?.charAt(0).toUpperCase()}
                                        {user?.surname?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col gap-2">
                                    {/* Input file nascosto gestito manualmente per la preview */}
                                    <Input
                                        type="file"
                                        id="picture-upload"
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleImageChange}
                                    />

                                    <Button
                                        asChild
                                        variant="outline"
                                        type="button"
                                    >
                                        <label
                                            htmlFor="picture-upload"
                                            className="cursor-pointer"
                                        >
                                            Change Photo
                                        </label>
                                    </Button>

                                    {/* Pulsante Rimuovi gestito tramite watch */}
                                    {preview && !form.watch("removeImage") && (
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

                            {/* CAMPO NOME */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="given-name"
                                                placeholder="Name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* CAMPO COGNOME */}
                            <FormField
                                control={form.control}
                                name="surname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Surname</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="family-name"
                                                placeholder="Surname"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* CAMPO TEMA */}
                            <FormField
                                control={form.control}
                                name="selectedTheme"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Theme</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a theme" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="system">
                                                    System
                                                </SelectItem>
                                                <SelectItem value="light">
                                                    Light
                                                </SelectItem>
                                                <SelectItem value="dark">
                                                    Dark
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* CAMPO EMAIL */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="email"
                                                placeholder="Email"
                                                type="email"
                                                {...field}
                                            />
                                        </FormControl>
                                        {/* Feedback disponibilità asincrona */}
                                        {form.formState.isValidating &&
                                            field.value && (
                                                <p className="text-xs text-muted-foreground">
                                                    Checking availability...
                                                </p>
                                            )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* CAMPO USERNAME */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                autoComplete="username"
                                                placeholder="Username"
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

                            {/* PULSANTI AZIONE */}
                            <div className="flex w-full items-center justify-end gap-4 pt-6">
                                <Button asChild variant="outline" type="button">
                                    <Link to="/password">Change Password</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting
                                        ? "Saving..."
                                        : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
