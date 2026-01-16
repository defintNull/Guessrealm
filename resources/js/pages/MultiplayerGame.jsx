import { FacialAttributesClassifier } from "@/services/ai_bot/standalone";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useEcho } from "@laravel/echo-react";
import { useEnableLobby } from "@/context/LobbyProvider";


export default function MultiplayerGame() {
    const { setEnableLobby } = useEnableLobby();
    // state: {
    //     ai_help: res.data.aihelp,
    //     timeout: res.data.timeout,
    //     game_websocket: res.data.game_websocket
    // }
    const { state } = useLocation();
    const [ aiEnabled, setAiEnabled ] = useState(state.ai_help);

    const [ photos, setPhotos ] = useState([]);
    const [ questions, setQuestions ] = useState([]);

    // Timer
    const TIMER = state.timeout;
    const [ time, setTime ] = useState(TIMER);
    const [ timerRunning, setTimerRunning ] = useState(false);
    const [ enableForward, setEnableForward ] = useState(false);

    const [ aiLoading, setAiLoading ] = useState(true);


    // Preprocessing
    useEffect(() => {
        setEnableLobby(false);
        // Foto loading
        (async () => {
            let res = await axios.post("/spa/game/photos");

            // Set questions
            let questionsArray = Questions().map((el, index) => {
                return {
                    id: index,
                    text: el,
                    best: false
                }
            });
            setQuestions(questionsArray);

            // Set photos
            let photosArray = res.data?.photos.map(el => {
                let qs = [];
                questionsArray.forEach(q => {
                    qs.push({
                        id: q.id,
                        response: false,
                        affidability: 0.00
                    });
                });
                return {
                    id:el?.id,
                    path:"/spa/game/photo/show/" + el?.id,
                    data: {
                        name: el?.name || "Pippo"
                    },
                    questions: qs,
                    state: false,
                    help: false
                }
                }
            );
            setPhotos(photosArray);

            // AI MODEL CODE
            (async () => {
                let aiModel = FacialAttributesClassifier.getInstance();
                await aiModel.loadModel(
                    "spa/ai/aimodel",
                    "spa/ai/aidatamodel",
                    axios
                )
                photosArray = photosArray.map(async photo => {
                    let aiRes = await aiModel.classifyImage(photo.path, photo?.data?.name, {
                        axios: axios,
                        modelPath: "spa/ai/aimodel",
                        dataPath: "spa/ai/aidatamodel"
                    });
                    let questionsArray = aiRes.map(ai => {
                        const { questionId, answer, percentage } = ai;
                        return {
                            id: questionId,
                            response: answer,
                            affidability: Number((percentage / 100).toFixed(2))
                        }
                    });
                    return {
                        ...photo,
                        questions: questionsArray
                    }
                });
                photosArray = await Promise.all(photosArray);
                setPhotos(photosArray);
                setAiLoading(false);
            })();
        })();

        // Command list handle click
        function handleClickOutside(e) {
            if (commandRef.current && !commandRef.current.contains(e.target)) {
                setCommandVisibility(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        // Reversing command list handle click
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Websocket
    useEcho(
        state.game_websocket,
        '',
        (e) => {

        }
    );

    return <div>
        Ciao
    </div>
}
