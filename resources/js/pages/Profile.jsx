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
    const [selectedTheme, setSelectedTheme] = useState(theme)

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
                    `spa/checkEditUsername/${debouncedUsername.trim()}`
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
        form.append("theme", theme)

        if (profile_picture) {
            form.append("profile_picture", profile_picture);
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
                    `spa/checkEditEmail/${debouncedEmail.trim()}`
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
                                    onValueChange={(value) => {setSelectedTheme(value)}}
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
                        <div className="flex flex-col w-full items-end justify-center pt-6 pr-4">
                            <Button>Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
