import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { toast, Toaster } from "sonner";

export default function Password() {
    let navigate = useNavigate();
    const { user } = useAuth();

    // 1. Uniformiamo i nomi: usiamo camelCase per React (setNewPassword)
    // e snake_case per il backend se serve.
    const [current_password, setCurrentPassword] = useState("");
    const [new_password, setNewPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");

    // Stati per gli errori
    const [error_currentpassword, setErrorCurrentPassword] = useState([]);
    const [error_newpassword, setErrorNewPassword] = useState([]);
    const [error_confirm_password, setErrorConfirmPassword] = useState([]);
    const [error, setError] = useState([]);

    async function handleSubmit(event) {
        event.preventDefault();

        // Reset degli errori generali prima di riprovare
        setError([]);

        // Validazione pre-invio (opzionale ma consigliata)
        if (new_password !== confirm_password) {
            setErrorConfirmPassword([
                { message: "Passwords does not match!" },
            ]);
            return;
        }

        let form = new FormData();
        form.append("current_password", current_password);
        form.append("new_password", new_password);
        form.append("confirm_password", confirm_password);

        try {
            // Assicurati di mettere l'URL corretto nel post
            let res = await axios.post("/spa/updatePassword", form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            // navigate("/login");
            toast.success("Password Changed!");
        } catch (error) {
            if (error.response) {
                if (error.response.status === 429) {
                    setError([{ message: "Too many requests!" }]);
                } else if (error.response.status === 422) {
                    if (error.response.data?.errors) {
                        let errors = error.response.data?.errors;

                        // NOTA: Qui i nomi devono corrispondere a quelli che Laravel ti rimanda
                        // Solitamente Laravel usa i nomi dei campi del form ('new_password')
                        if (errors?.new_password) {
                            setErrorNewPassword(
                                errors.new_password.map((el) => ({
                                    message: el,
                                }))
                            );
                        }
                        // Fallback: se Laravel risponde con 'password' invece di 'new_password'
                        if (errors?.password) {
                            setErrorNewPassword(
                                errors.password.map((el) => ({ message: el }))
                            );
                        }

                        if (errors?.confirm_password) {
                            setErrorConfirmPassword(
                                errors.confirm_password.map((el) => ({
                                    message: el,
                                }))
                            );
                        }
                        if (errors?.current_password) {
                            setErrorCurrentPassword(
                                errors.current_password.map((el) => ({
                                    message: el,
                                }))
                            );
                        }
                    }
                } else {
                    setError([{ message: "Something went wrong!" }]);
                }
            }
        }
    }

    return (
        <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
            <Toaster position="top-right" richColors />
            <Card className="min-w-md">
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <FieldTitle className="text-xl font-semibold">
                                Change Password
                            </FieldTitle>

                            {/* Questo input è invisibile ma dice al browser chi è l'utente */}
                            <input
                                type="text"
                                name="username"
                                autoComplete="username"
                                value= {useAuth().user?.username || "" }
                                style={{ display: "none" }}
                                readOnly
                            />

                            {/* CAMPO 0: Password Attuale */}
                            <Field data-invalid={error_currentpassword.length > 0}>
                                <FieldLabel htmlFor="current_password">Current Password</FieldLabel>
                                <Input
                                    id="current_password"
                                    placeholder="Current Password"
                                    required
                                    value={current_password}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    aria-invalid={error_currentpassword.length > 0}
                                    type="password"
                                    name="current_password" // Utile per i password manager
                                    autoComplete="current-password"
                                />
                                <FieldError errors={error_currentpassword} />
                            </Field>

                            {/* CAMPO 1: Nuova Password */}
                            <Field data-invalid={error_newpassword.length > 0}>
                                <FieldLabel htmlFor="new_password">Password</FieldLabel>
                                <Input
                                    id="new_password"
                                    placeholder="Password"
                                    required
                                    value={new_password}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    aria-invalid={error_newpassword.length > 0}
                                    type="password"
                                    name="new_password" // Utile per i password manager
                                    autoComplete="new-password"
                                />
                                <FieldError errors={error_newpassword} />
                            </Field>

                            {/* CAMPO 2: Conferma Password */}
                            <Field
                                data-invalid={error_confirm_password.length > 0}
                            >
                                <FieldLabel htmlFor="confirm_password">Confirm password</FieldLabel>
                                <Input
                                    id="confirm_password"
                                    placeholder="Confirm password"
                                    required
                                    value={confirm_password}
                                    onChange={(e) => {
                                        let current_val = e.target.value;
                                        setConfirmPassword(current_val);

                                        if (
                                            current_val === "" ||
                                            current_val === new_password
                                        ) {
                                            setErrorConfirmPassword([]);
                                        } else {
                                            // Non mostrare errore mentre sta ancora scrivendo la prima lettera
                                            if (new_password.length > 0) {
                                                setErrorConfirmPassword([
                                                    {
                                                        message:
                                                            "Password doesn't match!",
                                                    },
                                                ]);
                                            }
                                        }
                                    }}
                                    aria-invalid={
                                        error_confirm_password.length > 0
                                    }
                                    type="password"
                                    name="confirm_password"
                                    autoComplete="new-password"
                                />
                                <FieldError errors={error_confirm_password} />
                            </Field>

                            <FieldError errors={error} />
                        </FieldGroup>
                        <div className="flex flex-col w-full items-end justify-center pt-6 pr-4">
                            <Button type="submit">Change Password</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
