import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import useDebounce from "@/hooks/useDebounce";
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";

export default function Register() {
    let navigate = useNavigate();
    const { setUser } = useAuth();

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [profile_picture, setProfilePicture] = useState(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [error_name, setErrorName] = useState([]);
    const [error_surname, setErrorSurname] = useState([]);
    const [error_email, setErrorEmail] = useState([]);
    const [error_profile_picture, setErrorProfilePicture] = useState([]);
    const [error_username, setErrorUsername] = useState([]);
    const [error_password, setErrorPassword] = useState([]);
    const [error_confirm_password, setErrorConfirmPassword] = useState([]);
    const [error, setError] = useState([]);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const debouncedUsername = useDebounce(username, 500);
    const debouncedEmail = useDebounce(email, 500);

    //username
    // Questo effetto parte ogni volta che cambia 'debouncedUsername'
    useEffect(() => {
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
    }, [debouncedUsername]);

    // useEffect per l'email
    useEffect(() => {
        // 2. NUOVO: Controllo Formato Email (Regex)
        // Questa regex controlla: testo + @ + testo + . + testo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(debouncedEmail) && debouncedEmail.length > 0) {
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
    }, [debouncedEmail]);

    async function handleSubmit(event) {
        event.preventDefault();

        let form = new FormData();

        form.append("name", name);
        form.append("surname", surname);
        form.append("email", email);
        form.append("username", username);
        form.append("password", password);
        form.append("confirm_password", confirm_password);

        if (profile_picture) {
            form.append("profile_picture", profile_picture);
        }

        try {
            let res = await axios.post("spa/register", form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            navigate("/login");
        } catch (error) {
            if (error.response) {
                if (error.response.status == 429) {
                    setError([{ message: "Too many request!" }]);
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
                        if (errors?.profile_picture) {
                            setErrorProfilePicture(
                                errors.profile_picture.map((el) => {
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
                        if (errors?.password) {
                            setErrorPassword(
                                errors.password.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                        if (errors?.confirm_password) {
                            setErrorConfirmPassword(
                                errors.confirm_password.map((el) => {
                                    return { message: el };
                                })
                            );
                        }
                    }
                } else {
                    setError([{ message: "Something whent wrong!" }]);
                }
            }
        }
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value);

        if (error_email.length > 0) {
            setErrorEmail([]);
        }
    };

    const handleUsernameChange = (e) => {
        // Aggiorna lo stato mentre scrivi (per far vedere le lettere a schermo)
        setUsername(e.target.value);

        // Opzionale: Pulisce l'errore visivo mentre l'utente sta ancora scrivendo
        if (error_username.length > 0) {
            setErrorUsername([]);
        }
    };

    return (
        <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
            <Card className="min-w-md">
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <FieldTitle className="text-xl font-semibold">
                                Register
                            </FieldTitle>
                            <Field data-invalid={error_name.length > 0}>
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    autoComplete="given-name"
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
                                    autoComplete="family-name"
                                    placeholder="Surname"
                                    required
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    aria-invalid={error_surname.length > 0}
                                ></Input>
                                <FieldError errors={error_surname} />
                            </Field>
                            <Field data-invalid={error_email.length > 0}>
                                <FieldLabel>Email</FieldLabel>
                                <Input
                                    autoComplete="email"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={handleEmailChange}
                                    aria-invalid={error_email.length > 0}
                                    type="email"
                                ></Input>
                                {isCheckingEmail && (
                                    <span>Checking email...</span>
                                )}
                                {!isCheckingEmail &&
                                    email === debouncedEmail &&
                                    error_email.length === 0 &&
                                    email && (
                                        <span style={{ color: "green" }}>
                                            Email is available!
                                        </span>
                                    )}
                                <FieldError errors={error_email} />
                            </Field>
                            <Field
                                data-invalid={error_profile_picture.length > 0}
                            >
                                <FieldLabel>Profile Picture</FieldLabel>
                                <Input
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) => {
                                        const file =
                                            e.target.files?.[0] ?? null;
                                        setProfilePicture(file);
                                    }}
                                    aria-invalid={
                                        error_profile_picture.length > 0
                                    }
                                    type="file"
                                ></Input>
                                <FieldDescription>
                                    Allowed types: jpeg, png, webp
                                </FieldDescription>
                                <FieldError errors={error_profile_picture} />
                            </Field>
                            <FieldSeparator></FieldSeparator>
                            <Field data-invalid={error_username.length > 0}>
                                <FieldLabel>Username</FieldLabel>
                                <Input
                                    autoComplete="username"
                                    placeholder="Username"
                                    required
                                    value={username}
                                    onChange={handleUsernameChange}
                                    aria-invalid={error_username.length > 0}
                                ></Input>
                                {isCheckingUsername && (
                                    <span>Checking username...</span>
                                )}
                                {!isCheckingUsername &&
                                    username === debouncedUsername &&
                                    error_username.length === 0 &&
                                    username && (
                                        <span style={{ color: "green" }}>
                                            Username is available!
                                        </span>
                                    )}
                                <FieldError errors={error_username} />
                            </Field>
                            <Field data-invalid={error_password.length > 0}>
                                <FieldLabel>Password</FieldLabel>
                                <Input
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    aria-invalid={error_password.length > 0}
                                    type="password"
                                ></Input>
                                <FieldError errors={error_password} />
                            </Field>
                            <Field
                                data-invalid={error_confirm_password.length > 0}
                            >
                                <FieldLabel>Confirm password</FieldLabel>
                                <Input
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    required
                                    value={confirm_password}
                                    onChange={(e) => {
                                        let current_psw = e.target.value;
                                        setConfirmPassword(current_psw);
                                        if (
                                            current_psw == "" ||
                                            current_psw == password
                                        ) {
                                            setErrorConfirmPassword([]);
                                        } else if (current_psw != password) {
                                            setErrorConfirmPassword([
                                                {
                                                    message:
                                                        "Password doesn't match!",
                                                },
                                            ]);
                                        }
                                    }}
                                    aria-invalid={
                                        error_confirm_password.length > 0
                                    }
                                    type="password"
                                ></Input>
                                <FieldError errors={error_confirm_password} />
                            </Field>
                            <FieldError errors={error} />
                        </FieldGroup>
                        <div className="flex flex-col w-full items-end justify-center pt-6 pr-4">
                            <Button>Register</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
