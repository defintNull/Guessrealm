import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useEnableCacheLoad } from "@/context/CacheProvider";

const loginSchema = z.object({
    username: z.string().min(1, "Insert Username").max(255),
    password: z.string().min(8, "Insert Password").max(255),
});

export default function Login() {

    let navigate = useNavigate();
    const { setUser } = useAuth();
    const { setEnableCacheLoad } = useEnableCacheLoad();

    //setup form
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values) {

        try {
            let res = await axios.post("spa/login", values);
            setUser(res.data.user);

            (async () => {
                if ("caches" in window) {
                    const mPath = "/spa/ai/aimodel";
                    const CACHE_NAME = "ai-model-cache-v1";

                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(mPath);

                    if (!cachedResponse) {
                        setEnableCacheLoad(false);

                        const modelResponse = await axios.get(mPath, {
                        responseType: "arraybuffer",
                        });

                        const blob = new Blob([modelResponse.data]);
                        const response = new Response(blob);

                        await cache.put(mPath, response);

                        setEnableCacheLoad(true);
                        console.log("💾 Model cached successfully!");
                    }
                }
            })();
            navigate("/", { replace: true });
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status == 401) {
                    form.setError("root", {
                        message: "Wrong credentials!",
                    });
                } else if (status == 429) {
                    form.setError("root", {
                        message: "Too many requests!",
                    });
                } else {
                    form.setError("root", {
                        message: "Something went wrong!",
                    });
                }
            }
        }
    }

    return (
        <div className="w-full min-h-svh flex flex-col items-center justify-center">
            <Card className="min-w-md">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                        Login
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Form Wrapper */}
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            {/* CAMPO USERNAME */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Username"
                                                autoComplete="username"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* CAMPO PASSWORD */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Password"
                                                autoComplete="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* AREA ERRORI GENERICI (ROOT) */}
                            {/* Se c'è un errore generale (es. 401), lo mostriamo qui */}
                            {form.formState.errors.root && (
                                <div className="text-red-500 text-sm font-medium">
                                    {form.formState.errors.root.message}
                                </div>
                            )}

                            {/* Pulsante */}
                            <div className="flex flex-col w-full items-end justify-center pt-2">
                                {/* Il bottone disabilita il click mentre sta inviando (isSubmitting) */}
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    Login
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
