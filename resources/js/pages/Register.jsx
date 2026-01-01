import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Register() {
    let navigate = useNavigate();
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [error_name, setErrorName] = useState("");
    const [error_surname, setErrorSurname] = useState("");
    const [error_email, setErrorEmail] = useState("");
    const [error_username, setErrorUsername] = useState("");
    const [error_password, setErrorPassword] = useState("");
    const [error_confirm_password, setErrorConfirmPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        try{
            await axios.post('/register', {
                'name': name,
                'surname': surname,
                'email': email,
                'username': username,
                'password': password,
                'confirm_password': password
            });
            navigate("/");
        } catch (error) {
            if(error.response) {
                if(error.response.status == 429) {
                    setError("Too many request!");
                } else if(error.response.status == 401 || error.response.status == 422) {
                    if(error.response.data?.errors) {
                        let errors = error.response.data?.errors;
                        if(errors?.name) {
                            setErrorName(errors.name);
                        } else if(errors?.surname) {
                            setErrorSurname(errors.surname);
                        } else if(errors?.email) {
                            setErrorEmail(errors.email);
                        } else if(errors?.username) {
                            setErrorUsername(errors.username);
                        } else if(errors?.password) {
                            setErrorPassword(errors.password);
                        } else if(errors?.confirm_password) {
                            setErrorConfirmPassword(errors.confirm_password);
                        }
                    }
                } else {
                    setError("Something whent wrong!");
                }
            }
        }
    }

    return <div className="w-full min-h-svh flex py-12 flex-col items-center justify-center">
        <Card className="min-w-md">
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <FieldTitle className="text-xl font-semibold">Register</FieldTitle>
                        <Field data-invalid={!!error_name}>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                                placeholder="Name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                aria-invalid={!!error_name}
                                ></Input>
                            {error_name && <FieldError>{error_name}</FieldError>}
                        </Field>
                        <Field data-invalid={!!error_surname}>
                            <FieldLabel>Surname</FieldLabel>
                            <Input
                                placeholder="Surname"
                                required
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                aria-invalid={!!error_surname}
                                ></Input>
                            {error_surname && <FieldError>{error_surname}</FieldError>}
                        </Field>
                        <Field data-invalid={!!error_email}>
                            <FieldLabel>Email</FieldLabel>
                            <Input
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-invalid={!!error_email}
                                type="email"
                                ></Input>
                            {error_email && <FieldError>{error_email}</FieldError>}
                        </Field>
                        <FieldSeparator></FieldSeparator>
                        <Field data-invalid={!!error_username}>
                            <FieldLabel>Userame</FieldLabel>
                            <Input
                                placeholder="Username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                aria-invalid={!!error_username}
                                ></Input>
                            {error_username && <FieldError>{error_username}</FieldError>}
                        </Field>
                        <Field data-invalid={!!error_password}>
                            <FieldLabel>Password</FieldLabel>
                            <Input
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={!!error_password}
                                type="password"
                                ></Input>
                            {error_password && <FieldError>{error_password}</FieldError>}
                        </Field>
                        <Field data-invalid={!!error_confirm_password}>
                            <FieldLabel>Confirm password</FieldLabel>
                            <Input
                                placeholder="Confirm password"
                                required
                                value={confirm_password}
                                onChange={(e) => {
                                    let current_psw = e.target.value;
                                    setConfirmPassword(current_psw);
                                    if(current_psw == "" || current_psw == password) {
                                        setErrorConfirmPassword("");
                                    } else if(current_psw != password) {
                                        setErrorConfirmPassword("Password doesn't match!");
                                    }
                                }}
                                aria-invalid={!!error_confirm_password}
                                type="password"
                                ></Input>
                            {error_confirm_password && <FieldError>{error_confirm_password}</FieldError>}
                        </Field>
                        {error && <FieldError>{error}</FieldError>}
                    </FieldGroup>
                    <div className="flex flex-col w-full items-end justify-center pt-6 pr-4">
                        <Button>Register</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
}
