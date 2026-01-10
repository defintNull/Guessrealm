import { useState } from "react";
import { Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const MAX_MB = 2 * 1024 * 1024;
const ALLOWED_FORMAT = ["image/jpeg", "image/png", "image/webp"];

export default function Profile() {
    //Inizializzazione stato
    // #region contesti, stati e custom hooks
    let navigate = useNavigate();
    const { user, setUser } = useAuth();
    const { theme, setTheme } = useTheme();

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [profile_picture, setProfilePicture] = useState(null);
    const [username, setUsername] = useState("");
    const [error_name, setErrorName] = useState([]);
    const [error_surname, setErrorSurname] = useState([]);
    const [error_email, setErrorEmail] = useState([]);
    const [error_profile_picture, setErrorProfilePicture] = useState([]);
    const [error_username, setErrorUsername] = useState([]);
    const [error, setError] = useState([]);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(theme);
    const [preview, setPreview] = useState(user?.profile_picture_url || null);
    const [removeImage, setRemoveImage] = useState(false);

    const debouncedUsername = useDebounce(username, 500);
    const debouncedEmail = useDebounce(email, 500);
    // #endregion

    // Carica i dati dell'utente quando il componente viene montato
    useEffect(() => {
        if (user) {
            setName(user.name ?? "");
            setSurname(user.surname ?? "");
            setEmail(user.email ?? "");
            setUsername(user.username ?? "");
            setTheme(user.theme || "system");
            if (user.profile_picture_url) {
                setPreview(
                    `${user.profile_picture_url}?t=${new Date().getTime()}`
                );
            } else {
                setPreview(null);
            }
        }
    }, [user]);

    //username
    // Questo effetto parte ogni volta che cambia 'debouncedUsername'
    useEffect(() => {
        // 1. Se lo username è vuoto o è uguale a quello attuale dell'utente, pulisci errori e fermati.
        if (
            !debouncedUsername ||
            (user && debouncedUsername === user.username)
        ) {
            setErrorUsername([]);
            setIsCheckingUsername(false);
            return;
        }

        // 2. Funzione asincrona per fare la chiamata
        const checkUsername = async () => {
            setIsCheckingUsername(true); // Attiva il messaggio "checking..."
            try {
                const res = await axios.get(
                    `spa/checkUsername/${debouncedUsername.trim()}`
                );

                if (res.data.exists) {
                    setErrorUsername([{ message: "Username already exists" }]);
                } else {
                    setErrorUsername([]); // Tutto ok
                }
            } catch (err) {
                console.log(err);
            } finally {
                setIsCheckingUsername(false); // Spegni lo spinner
            }
        };

        // 3. Esegui la funzione
        checkUsername();
    }, [debouncedUsername, user]);

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorName([]);
        setErrorSurname([]);
        setErrorEmail([]);
        setErrorUsername([]);
        setError([]);

        let form = new FormData();

        form.append("name", name);
        form.append("surname", surname);
        form.append("email", email);
        form.append("username", username);
        form.append("theme", selectedTheme);

        if (profile_picture) {
            form.append("profile_picture", profile_picture);
        }

        if (removeImage) {
            form.append("remove_image", true);
            console.log("aggiunto remove_image");
            console.log(removeImage);
        }

        try {
            let res = await axios.post("spa/profileUpdate", form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            //aggiorna user nel context
            setUser(res.data.user);

            //aggiornamento del tema
            setTheme(selectedTheme);

            // mostra messaggio di successo
            toast.success("Profile updated successfully!");
        } catch (error) {
            if (error.response) {
                if (error.response.status == 429) {
                    setError(["Too many request!"]);
                } else if (error.response.status == 422) {
                    if (error.response.data?.errors) {
                        let errors = error.response.data?.errors;
                        if (errors?.name) {
                            setErrorName(
                                errors.name.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                        if (errors?.surname) {
                            setErrorSurname(
                                errors.surname.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                        if (errors?.email) {
                            setErrorEmail(
                                errors.email.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                        if (errors?.username) {
                            setErrorUsername(
                                errors.username.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                        if (errors?.profile_picture) {
                            setErrorProfilePicture(
                                errors.profile_picture.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                    }
                } else {
                    setError(["Something whent wrong!"]);
                }
            }
        }
    }

    // useEffect per l'email
    useEffect(() => {
        // 1. Se vuoto o uguale all'email attuale, resetta e esci
        if (!debouncedEmail || (user && debouncedEmail === user.email)) {
            setErrorEmail([]);
            setIsCheckingEmail(false);
            return;
        }

        // 2. NUOVO: Controllo Formato Email (Regex)
        // Questa regex controlla: testo + @ + testo + . + testo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(debouncedEmail)) {
            setErrorEmail([{ message: "Invalid email format" }]);
            setIsCheckingEmail(false);
            return; // STOP! Non contattare il server se il formato è sbagliato
        }

        // 3. Se il formato è giusto, controlla se esiste nel database
        const checkEmail = async () => {
            setIsCheckingEmail(true);
            try {
                const res = await axios.get(
                    `spa/checkEmail/${debouncedEmail.trim()}`
                );
                if (res.data.exists) {
                    setErrorEmail([{ message: "Email already exists" }]);
                } else {
                    setErrorEmail([]);
                }
            } catch (err) {
                console.log(err);
            } finally {
                setIsCheckingEmail(false);
            }
        };

        checkEmail();
    }, [debouncedEmail, user]);

    const handleUsernameChange = (e) => {
        // Aggiorna lo stato mentre scrivi (per far vedere le lettere a schermo)
        setUsername(e.target.value);

        // Opzionale: Pulisce l'errore visivo mentre l'utente sta ancora scrivendo
        if (error_username.length > 0) {
            setErrorUsername([]);
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);

        if (error_email.length > 0) {
            setErrorEmail([]);
        }
    };

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
        setProfilePicture(file);

        // Importante: Se l'utente aveva cliccato "Rimuovi" ma poi carica una nuova foto,
        // dobbiamo resettare il flag di rimozione.
        setRemoveImage(false);
    };

    // fix per memory leak
    useEffect(() => {
        if (profile_picture) {
            const previewUrl = URL.createObjectURL(profile_picture);
            setPreview(previewUrl);
        }
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [profile_picture]);

    const handleRemoveImage = (e) => {
        setProfilePicture(null);
        setPreview(null);
        setRemoveImage(true);
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
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <FieldTitle className="text-xl font-semibold">
                                Edit Profile
                            </FieldTitle>

                            <div className="flex items-center gap-4">
                                {/* Immagine circolare */}
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={preview} />
                                    <AvatarFallback>
                                        {name?.charAt(0).toUpperCase()}
                                        {surname?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col gap-2">
                                    {/* Input nascosto */}
                                    <Input
                                        accept="image/png,image/jpeg,image/webp"
                                        type="file"
                                        id="picture-upload"
                                        className="hidden" // Nascondilo con CSS
                                        onChange={handleImageChange}
                                    />

                                    {/* Bottone che agisce come label per l'input */}
                                    <Button asChild variant="outline">
                                        <label
                                            htmlFor="picture-upload"
                                            className="cursor-pointer"
                                        >
                                            Change Photo
                                        </label>
                                    </Button>

                                    {/* Bottone Rimuovi - mostralo solo se c'è una preview diversa dal default */}
                                    {preview !== "/default-avatar.png" && (
                                        <Button
                                            variant="destructive"
                                            type="button" // Importante: altrimenti fa submit del form!
                                            onClick={handleRemoveImage}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <FieldError errors={error_profile_picture} />
                            </div>

                            <Field data-invalid={error_name.length > 0}>
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    autocoplete="given-name"
                                    placeholder="Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    aria-invalid={error_name.length > 0}
                                ></Input>
                                <FieldError errors={error_name} />
                            </Field>
                            <Field data-invalid={error_surname.length > 0}>
                                <FieldLabel>Surname</FieldLabel>
                                <Input
                                    autocoplete="family-name"
                                    placeholder="Surname"
                                    required
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    aria-invalid={error_surname.length > 0}
                                ></Input>
                                <FieldError errors={error_surname} />
                            </Field>
                            <Field>
                                <FieldLabel>Theme</FieldLabel>
                                <Select
                                    value={selectedTheme}
                                    onValueChange={(value) => {
                                        setSelectedTheme(value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
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
                            </Field>
                            <Field data-invalid={error_email.length > 0}>
                                <FieldLabel>Email</FieldLabel>
                                <Input
                                    autocoplete="email"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={handleEmailChange}
                                    aria-invalid={error_email.length > 0}
                                    type="email"
                                ></Input>
                                <FieldError errors={error_email} />
                                {isCheckingEmail && (
                                    <span>Checking email...</span>
                                )}
                                {!isCheckingEmail &&
                                    email === debouncedEmail &&
                                    error_email.length === 0 &&
                                    user?.email !== email &&
                                    email && (
                                        <span style={{ color: "green" }}>
                                            Email is available!
                                        </span>
                                    )}
                            </Field>
                            <Field data-invalid={error_username.length > 0}>
                                <FieldLabel>Userame</FieldLabel>
                                <Input
                                    autocoplete="username"
                                    placeholder="Username"
                                    required
                                    value={username}
                                    onChange={handleUsernameChange}
                                    aria-invalid={error_username.length > 0}
                                ></Input>
                                <FieldError errors={error_username} />
                                {isCheckingUsername && (
                                    <span>Checking username...</span>
                                )}
                                {!isCheckingUsername &&
                                    username === debouncedUsername &&
                                    error_username.length === 0 &&
                                    username !== user?.username &&
                                    username && (
                                        <span style={{ color: "green" }}>
                                            Username is available!
                                        </span>
                                    )}
                            </Field>
                            <FieldError errors={error} />
                        </FieldGroup>
                        <div className="flex w-full items-end justify-center pt-6 pr-4 gap-4">
                            <Button type="submit">Save Changes</Button>
                            <Button asChild variant="outline" type="button">
                                <Link to="/password">Change Password</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
