import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";

export default function Profile() {
    let navigate = useNavigate();
    const { setUser } = useAuth();

    const [name, setName] = useState();
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [profile_picture, setProfilePicture] = useState(null);
    const [username, setUsername] = useState("");
    //const [password, setPassword] = useState("");
    //const [confirm_password, setConfirmPassword] = useState("");
    const [error_name, setErrorName] = useState([]);
    const [error_surname, setErrorSurname] = useState([]);
    const [error_email, setErrorEmail] = useState([]);
    const [error_profile_picture, setErrorProfilePicture] = useState([]);
    const [error_username, setErrorUsername] = useState([]);
    //const [error_password, setErrorPassword] = useState([]);
    //const [error_confirm_password, setErrorConfirmPassword] = useState([]);
    const [error, setError] = useState([]);

    //funzione per prendere i dati del profilo
    const fetchProfileData = async () => {
        //fetch user profile data dal backend
        const response = await axios.get("/api/profile");
        const data = response.data;
        setName(data.name);
        setSurname(data.surname);
        setEmail(data.email);
        setUsername(data.username);
        //setProfilePicture(data.profile_picture);
    };

    //per recuperare i dati dal backend
    useEffect(() => {
        //fetch i dati del profilo
        fetchProfileData();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        let form = new FormData();

        form.append("name", name);
        form.append("surname", surname);
        form.append("email", email);
        form.append("username", username);
        //form.append('password', password);
        //form.append('confirm_password', confirm_password);

        if (profile_picture) {
            form.append("profile_picture", profile_picture);
        }

        try {
            let res = await axios.post("/api/profile", form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            navigate("/");
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
                    setError(["Something whent wrong!"]);
                }
            }
        }
    }

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
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    aria-invalid={error_email.length > 0}
                                    type="email"
                                ></Input>
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
                                <FieldLabel>Userame</FieldLabel>
                                <Input
                                    placeholder="Username"
                                    required
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    aria-invalid={error_username.length > 0}
                                ></Input>
                                <FieldError errors={error_username} />
                            </Field>
                            {/* <Field data-invalid={error_password.length > 0}>
                            <FieldLabel>Password</FieldLabel>
                            <Input
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                aria-invalid={error_password.length > 0}
                                type="password"
                                ></Input>
                            <FieldError errors={error_password} />
                        </Field>
                        <Field data-invalid={error_confirm_password.length > 0}>
                            <FieldLabel>Confirm password</FieldLabel>
                            <Input
                                placeholder="Confirm password"
                                required
                                value={confirm_password}
                                onChange={(e) => {
                                    let current_psw = e.target.value;
                                    setConfirmPassword(current_psw);
                                    if(current_psw == "" || current_psw == password) {
                                        setErrorConfirmPassword([]);
                                    } else if(current_psw != password) {
                                        setErrorConfirmPassword([{ message: "Password doesn't match!" }]);
                                    }
                                }}
                                aria-invalid={error_confirm_password.length > 0}
                                type="password"
                                ></Input>
                            <FieldError errors={error_confirm_password} />
                        </Field> */}
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
