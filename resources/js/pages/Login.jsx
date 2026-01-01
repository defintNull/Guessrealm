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


export default function Login() {
    let navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        try{
            await axios.get('/sanctum/csrf-cookie');
            await axios.post('/login', {
                'username': username,
                'password': password
            });
            navigate("/");
        } catch (error) {
            if(error.response) {
                if(error.response.status == 429) {
                    setError("Too many request!");
                } else if(error.response.status == 401) {
                    setError(error.response.data?.errors);
                } else {
                    setError("Something whent wrong!");
                }
            }
        }
    }

    return <div className="w-full min-h-svh flex flex-col items-center justify-center">
        <Card className="min-w-md">
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <FieldTitle className="text-xl font-semibold">Login</FieldTitle>
                        <Field data-invalid={!!error}>
                            <FieldLabel>Username</FieldLabel>
                            <Input
                                placeholder="Username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                aria-invalid={!!error}
                                ></Input>
                        </Field>
                        <Field data-invalid={!!error}>
                            <FieldLabel>Password</FieldLabel>
                            <Input
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={!!error}
                                type="password"
                                ></Input>
                        </Field>
                        {error && <FieldError>{error}</FieldError>}
                    </FieldGroup>
                    <div className="flex flex-col w-full items-end justify-center pt-6 pr-4">
                        <Button>Login</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
}
