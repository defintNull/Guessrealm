import { RouterProvider } from "react-router-dom";
import router from "./router/router";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { useEffect } from 'react';
import axios from "axios";
import { useEnableCacheLoad } from "./context/CacheProvider";

export default function App() {
    const { setEnableCacheLoad } = useEnableCacheLoad();

    useEffect(() => {
        const init = async () => {
            await axios.get("/sanctum/csrf-cookie");

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
        };

        init().catch(console.error);
    }, []);

    return (
        <ThemeProvider>
            <AuthProvider>
                <RouterProvider router={router}></RouterProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
