import axios from 'axios';
import { configureEcho } from "@laravel/echo-react";
import Echo from 'laravel-echo';

window.axios = axios;

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

configureEcho({
    broadcaster: "reverb"
});
