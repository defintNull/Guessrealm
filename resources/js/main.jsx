import "./bootstrap";

import ReactDOM from "react-dom/client";
import App from "./App";
import { CacheProvider } from "./context/CacheProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
    <CacheProvider>
        <App />
    </CacheProvider>
);
