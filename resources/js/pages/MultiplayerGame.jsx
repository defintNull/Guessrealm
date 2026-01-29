import { FacialAttributesClassifier } from "@/services/ai_bot/standalone";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useEcho, useEchoPresence } from "@laravel/echo-react";
import { useEnableLobby } from "@/context/LobbyProvider";
import Questions from "@/services/Questions";
import SideChat from "@/components/SideChat";
import Photo from "@/components/Photo";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import Timer from "@/components/Timer";
import { FaStar } from "react-icons/fa";
import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IoIosSettings } from "react-icons/io";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IoPerson } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Spinner } from "@/components/ui/spinner";
import { TextColor } from "@/components/ColoredText";
import { ImCheckmark, ImCross } from "react-icons/im";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthProvider";
import useExitGamePage from "@/hooks/useExitGamePage";
import { useEnableMultiplayerGame } from "@/context/MultiplayerGameProvider";
import { useEnableCacheLoad } from "@/context/CacheProvider";

function waitForEnableCacheLoad(getEnableCacheLoad) {
    return new Promise(resolve => {
        if (getEnableCacheLoad()) {
            resolve();
            return;
        }

        const interval = setInterval(() => {
        if (getEnableCacheLoad()) {
            clearInterval(interval);
            resolve();
        }
        }, 50);
    });
}

export default function MultiplayerGame() {
    const navigate = useNavigate();
    const { enableCacheLoad } = useEnableCacheLoad();

    const { setEnableLobby } = useEnableLobby();
    const { setEnableMultiplayerGame } = useEnableMultiplayerGame();
    // state: {
    //     ai_help: res.data.aihelp,
    //     timeout: res.data.timeout,
    //     game_id: res.data.game_id,
    //     game_websocket: res.data.game_websocket
    //     chat_websocket:
    //     enemy: {
    //         id:
    //         username:
    //         avatar:
    //     }
    // }
    const { state } = useLocation();
    const { user } = useAuth();
    const enemy = state.enemy;

    // AI
    const [ aiEnabled, setAiEnabled ] = useState(state.ai_help);
    const [ aiHelp, setAiHelp ] = useState(true);

    // Settings
    const [ enableBgMusic, setEnableBgMusic ] = useState(true);
    const audioRef = useRef(null);

    // Game states
    const gameId = state.game_id;
    const [ gameState, setGameState ] = useState(1);
    const [ websocketPayload, setWebsocketPayload ] = useState(null);
    const [ photos, setPhotos ] = useState([]);
    const [ questions, setQuestions ] = useState([]);
    const [ photoSelected, setPhotoSelected ] = useState(null);
    const [ questionSelected, setQuestionSelected ] = useState(null);
    const [ enemyClosed, setEnemyClosed ] = useState(24);
    const [ enableGuess, setEnableGuess ] = useState(false);
    const [ guessCharacter, setGuessCharacter ] = useState(null);

    // Timer
    const TIMER = state.timeout;
    const [ time, setTime ] = useState(TIMER);
    const [ timerRunning, setTimerRunning ] = useState(false);
    const [ enableForward, setEnableForward ] = useState(false);

    // Command selector
    const commandRef = useRef(null);
    const [ commandVisibility, setCommandVisibility ] = useState(false);
    const [ commandBlockVisibility, setCommandBlockVisibility ] = useState(false);

    // Chat
    const [ messages, setMessages ] = useState([]);
    const [ typingUser, setTypingUser ] = useState(null);
    const typingTimer = useRef(null);

    // Modals
    // Loading dialog state
    const [ loadingDialogState, setLoadingDialogState ] = useState(false);
    const [ loadingDialogContent, setLoadingDialogContent ] = useState(null);

    // Dialog state
    const [dialogState, setDialogState] = useState(false);
    const [contentDialogState, setContentDialogState] = useState("");

    // Ask Question dialog
    const [ askQuestionDialogState, setAskQuestionDialogState ] = useState(false);
    const [ contentAskQuestionDialog, setContentAskQuestionDialog ] = useState(null);
    const [ questionResponse, setQuestionResponse ] = useState(null);

    // Response Question Dialog state
    const [ responseQuestionDialogState, setResponseQuestionDialogState ] = useState(false);
    const [ contentResponseQuestionDialog, setContentResponseQuestionDialog ] = useState(null);

    // Guess question dialog state
    const [ guessCharacterDialogState, setGuessCharacterDialogState ] = useState(false);
    const [ responseGuessCharacterDialogState, setResponseGuessCharacterDialogState ] = useState(false);

    // Exit hook
    useExitGamePage({
        type: 'game',
        id: gameId,
        cleanup: () => {
            setEnableMultiplayerGame(false);
        }
    });

    // Preprocessing
    useEffect(() => {
        setEnableLobby(false);
        // Foto loading
        (async () => {
            let res = await axios.post("/spa/multiplayer/photos", {
                id: gameId
            });

            // Set questions
            let questionsArray = Questions().map((el, index) => {
                return {
                    id: index,
                    text: el,
                    best: false,
                    done: false
                };
            });
            setQuestions(questionsArray);

            // Set photos
            let photosArray = res.data?.photos.map((el) => {
                let qs = [];
                questionsArray.forEach((q) => {
                    qs.push({
                        id: q.id,
                        response: false,
                        affidability: 0.0,
                    });
                });
                return {
                    id: el?.id,
                    path: "/spa/game/photo/show/" + el?.id,
                    data: {
                        name: el?.name || "Pippo",
                    },
                    questions: qs,
                    state: false,
                    help: false,
                };
            });
            setPhotos(photosArray);

            // AI MODEL CODE
            (async () => {
                let aiModel = FacialAttributesClassifier.getInstance();

                await waitForEnableCacheLoad(() => enableCacheLoad);

                await aiModel.loadModel(
                    true, //CAMBIARE QUI PER ABILITARE WEBGPU
                    "/spa/ai/aimodel",
                    axios
                );
                for (let i = 0; i < photosArray.length; i++) {
                    const photo = photosArray[i];

                    const aiRes = await aiModel.classifyImage(
                        photo.path,
                        photo?.data?.name,
                        {
                            axios: axios,
                            modelPath: "/spa/ai/aimodel",
                        }
                    );

                    const questionsArray = aiRes.map((ai) => {
                        const { questionId, answer, percentage } = ai;
                        return {
                            id: questionId,
                            response: answer,
                            affidability: Number((percentage / 100).toFixed(2)),
                        };
                    });

                    photosArray[i] = {
                        ...photo,
                        questions: questionsArray,
                    };
                }

                photosArray = await Promise.all(photosArray);
                setPhotos(photosArray);

                axios.post('/spa/multiplayer/endloading', {
                    id: gameId,
                });
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
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Websocket
    useEcho(
        state.game_websocket,
        'GameEvent',
        (e) => {
            if(gameState != 13) {
                setGameState(e.game_phase);
                setWebsocketPayload(e.payload);
            }
        }
    );

    const { channel: chatChannel } = useEcho(
        state.chat_websocket,
    );
    useEffect(() => {
        chatChannel()
        .listenForWhisper('typing', (e) => {
            if(e.state) {
                setTypingUser(e.user);
            } else {
                setTypingUser(null);
            }
        })
        .listenForWhisper('message', (e) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.RED,
                    content: e.message,
                    user: {
                        id: enemy.id,
                        username: enemy.username,
                        avatar: enemy.avatar,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
        });
    }, []);

    // Audio effect
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = 0.4;
        if (enableBgMusic) {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
        }
    }, [enableBgMusic]);

    // Game Logic FSM
    function game() {
        if(gameState == 1) {
            // Lodaing phase
            setLoadingDialogContent("Loading...");
            setLoadingDialogState(true);
        } else if(gameState == 2) {
            // Coose characret phase
            setLoadingDialogState(false);
            setLoadingDialogContent(null);

            restartTimer();

            setContentDialogState("Select your character");
            setDialogState(true);

            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GRAY,
                    content: "Player choosing character...",
                    user: {
                        id: 0,
                        username: "System",
                        avatar: null,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);

        } else if(gameState == 3) {
            // Ask question phase
            restartTimer();
            setLoadingDialogState(false);
            setLoadingDialogContent(null);
            setContentDialogState("Your turn!");
            setDialogState(true);

            setEnableForward(true);
            setEnableGuess(true);

            setEnemyClosed(websocketPayload?.remaining || 24);

            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GRAY,
                    content: "Player choosing question...",
                    user: {
                        id: 0,
                        username: "System",
                        avatar: null,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);

            setCommandBlockVisibility(true);
        } else if(gameState == 4) {
            // Wait response phase
            setDialogState(false);
            setContentDialogState(null);
            setEnableForward(false);
            setEnableGuess(false);
            setCommandBlockVisibility(false);
            restartTimer();

            setQuestionResponse(null);
            setContentAskQuestionDialog(questionSelected.text)
            setAskQuestionDialogState(true);
        } else if(gameState == 5) {
            // Close characters phase
            setEnableForward(true);
            restartTimer();
            setQuestionResponse(websocketPayload?.response);
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.RED,
                    content: "Response: " + websocketPayload?.response,
                    user: {
                        id: enemy.id,
                        username: enemy.username,
                        avatar: enemy.avatar,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
            if(aiEnabled) {
                aiCloseSuggestions(websocketPayload?.response);
            }

        } else if(gameState == 6) {
            // Wait question phase
            setQuestionSelected(null);
            setQuestionResponse(null);
            setDialogState(false);
            setContentDialogState(null);

            // Reset ai close suggestion
            setPhotos(prev =>
                prev.map(photo => ({
                    ...photo,
                    help: false
                }))
            );

            setEnableForward(false);
            restartTimer();

            setLoadingDialogContent("Waiting for a question...");
            setLoadingDialogState(true);

        } else if(gameState == 7) {
            // Response question phase
            setLoadingDialogState(false);
            setLoadingDialogContent(null);

            restartTimer();
            let questionText = questions.find(el => el.id == websocketPayload.question)?.text;
            setContentResponseQuestionDialog(questionText);
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.RED,
                    content: "Asking: " + questionText,
                    user: {
                        id: enemy.id,
                        username: enemy.username,
                        avatar: enemy.avatar,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
            setResponseQuestionDialogState(true);

        } else if(gameState == 8) {
            // Wait character closure phase
            restartTimer();

            setLoadingDialogContent("Waiting enemy closing phase");
            setLoadingDialogState(true);

        } else if(gameState == 9) {
            // Guess character phase
            restartTimer();

            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GRAY,
                    content: "Player is guessing...",
                    user: {
                        id: 0,
                        username: "System",
                        avatar: null,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
            setContentDialogState("Guess the character!");
            setDialogState(true);

        } else if(gameState == 10) {
            // Wait guess response phase
            restartTimer();

            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GRAY,
                    content: "Player is guessing...",
                    user: {
                        id: 0,
                        username: "System",
                        avatar: null,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
            setGuessCharacterDialogState(true);

        } else if(gameState == 11) {
            // Wait guess pahse
            restartTimer();

            setLoadingDialogContent("Enemy is guessing!");
            setLoadingDialogState(true);

        } else if(gameState == 12) {
            // Response guess phase
            restartTimer();
            setLoadingDialogState(false);
            setLoadingDialogContent(null);

            let guessPhoto = photos.find(el => el.id == websocketPayload?.character);
            setGuessCharacter(guessPhoto);
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.RED,
                    content: "Guessing: " + guessPhoto.name,
                    user: {
                        id: enemy.id,
                        username: enemy.username,
                        avatar: enemy.avatar,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);

            setResponseGuessCharacterDialogState(true);

        } else if(gameState == 13) {
            // End phase
            restartTimer();
            setTimerRunning(false);

            setGuessCharacterDialogState(false);
            setContentDialogState(websocketPayload.end ? "You win!" : "You lose!");
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GRAY,
                    content: (websocketPayload.end ? "You win!" : "You lose!"),
                    user: {
                        id: 0,
                        username: "System",
                        avatar: null,
                    },
                    time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
            setDialogState(true);
        }
    }

    useEffect(() => {
        game();
        aiQuestionSuggestions();
    }, [gameState]);

    // AI Functions
    async function aiQuestionSuggestions() {
        if (aiEnabled && aiHelp && gameState == 3) {
            let map = questions.map((el) => {
                return {
                    id: el?.id,
                    count: 0,
                };
            });

            let photoArray = photos.filter((el) => !el.state);

            photoArray.forEach((el) => {
                el?.questions.forEach((q) => {
                    if (q?.response) {
                        const item = map.find((m) => m.id === q.id);
                        if (item) {
                            item.count++;
                        }
                    }
                });
            });
            const target = photoArray.length / 2;
            let sorted = map
                .filter((item) => item.count !== photoArray.length)
                .sort((a, b) => {
                    return (
                        Math.abs(a.count - target) - Math.abs(b.count - target)
                    );
                });

            let top4 = sorted.slice(0, 4);
            top4 = top4.map((item) => questions.find((q) => q.id === item.id));
            let questionsArray = [...questions];
            questionsArray.forEach((el) => {
                if (top4.some((q) => q.id === el.id)) {
                    el.best = true;
                } else {
                    el.best = false;
                }
            });
            setQuestions(questionsArray);
        }
    }

    async function aiCloseSuggestions(response) {
        if(aiEnabled && aiHelp) {
            let photosArray = photos.map((el) => {
                if (
                    !el.state &&
                    response != null &&
                    questionSelected != null &&
                    el?.questions.find((q) => q.id == questionSelected?.id)?.response != response
                ) {
                    return {
                        ...el,
                        help: true,
                    };
                }
                return el;
            });
            setPhotos(photosArray);
        }
    }

    // Command block click handle
    function commandInputClickHandler() {
        setCommandVisibility(true);
    }

    function commandClickHandle(id) {
        let chosenQuestion = questions.find((el) => el.id == id);

        setMessages((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                color: TextColor.GREEN,
                content: 'Asking: "' + chosenQuestion.text + '"',
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.profile_picture_url,
                },
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
        ]);

        setQuestionSelected(chosenQuestion);
        setQuestions(prev => prev.map(el => {
            if(el.id == chosenQuestion.id) {
                return {
                    ...el,
                    done: true
                }
            } else {
                return {...el}
            }
        }));
        axios.post('/spa/multiplayer/choosequestion', {
            id: gameId,
            question: chosenQuestion.id
        })
    }

    // Timer
    useEffect(() => {
        if (!timerRunning) return;
        if (time <= 0) {
            forwardClickHandle();
            setTimerRunning(false);
            return;
        }

        const interval = setInterval(() => {
            setTime((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timerRunning, time]);

    function forwardClickHandle() {
        if(gameState == 5) {
            let remaining = photos.filter(el => !el.state).length;
            axios.post('/spa/multiplayer/endclosure', {
                id: gameId,
                remaining: remaining
            });
        } else if(gameState == 3) {
            axios.post('/spa/multiplayer/skip', {
                id: gameId
            });
        } else {
            axios.post('/spa/multiplayer/endtimer', {
                id: gameId
            });
        }
    }

    function resetTimer() {
        setTime(TIMER);
        setTimerRunning(false);
    }

    function restartTimer() {
        setTime(TIMER);
        setTimerRunning(true);
    }

    // Photo click handle
    function characterClick(event) {
        if(gameState == 2) {
            if(photoSelected == null) {
                let photo = photos.find((el) => el.id == event.currentTarget.dataset.id);
                setPhotoSelected(photo);

                axios.post('/spa/multiplayer/choosecharacter', {
                    id: gameId,
                    character: photo.id
                });
                setLoadingDialogContent("Waiting other player...");
                setLoadingDialogState(true);
            }
        } else if(gameState == 9) {
            if(guessCharacter == null) {
                let photo = photos.find((el) => el.id == event.currentTarget.dataset.id);
                setGuessCharacter(photo);
                axios.post('/spa/multiplayer/guesscharacter', {
                    id: gameId,
                    character: photo.id
                });
                setMessages((prev) => [
                    ...prev,
                    {
                        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                        color: TextColor.GREEN,
                        content: 'Guessing: ' + photo.name,
                        user: {
                            id: user.id,
                            username: user.username,
                            avatar: user.profile_picture_url,
                        },
                        time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    },
                ]);
            }
        } else if(![0, 1, 2, 9].includes(gameState)) {
            let photosMap = photos.map((el) => {
                if (el.id == event.currentTarget.dataset.id) {
                    return { ...el, state: !el.state };
                }
                return el;
            });
            setPhotos(photosMap);
        }
    }

    // Guess button click handle
    function guessClickHandle() {
        axios.post('/spa/multiplayer/guess', {
            id: gameId
        });
    }

    function guessResponseHandle(response) {
        axios.post('/spa/multiplayer/guessresponse', {
            id: gameId,
            response: response
        });
    }

    // Dialog State click handle
    function dialogClickHandle() {
        if(gameState == 13) {
            navigate('/', { replace: true });
            setEnableMultiplayerGame(false);
        } else {
            setDialogState(false);
        }
    }

    // Response dialog click handle
    function questionResponseHandle(response) {
        setResponseQuestionDialogState(false);
        axios.post('/spa/multiplayer/response', {
            id: gameId,
            response: response
        });
        setMessages((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                color: TextColor.GREEN,
                content: "Response: " + response,
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.profile_picture_url,
                },
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
        ]);
    }

    // Chat callback
    function sendMessageChat(updater) {
        setMessages(prev => {
            const new_messages = updater(prev);

            chatChannel().whisper('message', {
                message: new_messages[new_messages.length - 1].content
            });

            return new_messages;
        });
    }

    function handleTyping() {

        chatChannel().whisper("typing", {
            state: true,
            user: user
        });

        // Reset timer precedente
        if (typingTimer.current) {
            clearTimeout(typingTimer.current);
        }

        // Timer di 3 secondi
        typingTimer.current = setTimeout(() => {
            // Invia typing: false
            chatChannel().whisper("typing", {
                state: false,
                user: user
            });

            typingTimer.current = null;

        }, 3000);
    }


    return <div>
        <div className="flex flex-row h-[calc(100svh-100px)] pt-4">
            {/* Left Sidebar */}
            <div className="w-1/6 h-full">
                <SideChat
                    messages={messages}
                    setMessages={sendMessageChat}
                    typingUserUsername={typingUser?.username}
                    handleTyping={handleTyping}
                />
            </div>
            {/* Main body */}
            <div className="flex flex-col items-center justify-center gap-y-2 h-full w-2/3 px-4">
                <div className="flex flex-col flex-1 items-center justify-center overflow-hidden">
                    <div className="grid grid-rows-4 grid-cols-6 gap-x-4 gap-y-2 h-full overflow-hidden">
                        {photos.map((el) => (
                            <Photo
                                className="cursor-pointer"
                                data-id={el.id}
                                name={el?.data?.name}
                                key={el.id}
                                state={el.state}
                                src={el.path}
                                animated={el.help}
                                onClick={characterClick}
                            />
                        ))}
                    </div>
                </div>

                <div className="grow-0 w-full flex flex-row gap-x-2 h-13">
                    <div
                        className={
                            "grow " +
                            (commandBlockVisibility ? "hidden" : "")
                        }
                    ></div>
                    <Command
                        ref={commandRef}
                        className={
                            "grow overflow-visible relative py-2 " +
                            (!commandBlockVisibility ? "hidden" : "")
                        }
                    >
                        <CommandList
                            className={
                                "absolute w-full max-h-42 bg-slate-50 dark:bg-gray-900 rounded-t-xl z-20 bottom-full " +
                                (!commandVisibility ? "hidden" : "")
                            }
                        >
                            <CommandEmpty>No question found!</CommandEmpty>

                            <CommandGroup>
                                <ScrollArea className="h-40">
                                    {questions.map((el) => (
                                        <CommandItem
                                            className="cursor-pointer justify-between pr-2"
                                            onSelect={() => commandClickHandle(el.id)}
                                            data-id={el.id}
                                            key={el.id}
                                        >
                                            <p>{el.text}</p>
                                            {aiHelp && el.best ? <FaStar /> : null}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>

                        <div className="px-4">
                            <CommandInput
                                onClick={commandInputClickHandler}
                                placeholder="Search for a question"
                            />
                        </div>
                    </Command>
                    <Timer
                        onClick={forwardClickHandle}
                        clickEnable={enableForward}
                        time={time}
                    />
                </div>
            </div>
            {/* Right Sidebar */}
            <div className="flex flex-col grow gap-y-5 items-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <IoIosSettings className="text-6xl mr-4 mt-8 rounded-4xl hover:bg-slate-100 dark:hover:bg-gray-800 hover:cursor-pointer" />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>Game settings</DialogDescription>
                        <FieldGroup>
                            <Field orientation="horizontal">
                                <FieldLabel>AI Help</FieldLabel>
                                <Select
                                    value={(aiEnabled && aiHelp)}
                                    onValueChange={(v) => {
                                        if(!v) {
                                            // Reset ai close suggestion
                                            setPhotos(prev =>
                                                prev.map(photo => ({
                                                    ...photo,
                                                    help: false
                                                }))
                                            );
                                        }
                                        setAiHelp(v);
                                    }}
                                    disabled = {!aiEnabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a value..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>
                                                AIHelp
                                            </SelectLabel>
                                            <SelectItem value={true}>
                                                On
                                            </SelectItem>
                                            <SelectItem value={false}>
                                                Off
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field orientation="horizontal">
                                    <FieldLabel>Audio</FieldLabel>
                                    <Select
                                        value={Number(enableBgMusic)}
                                        onValueChange={setEnableBgMusic}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a value..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Audio
                                                </SelectLabel>
                                                <SelectItem value={1}>
                                                    On
                                                </SelectItem>
                                                <SelectItem value={0}>
                                                    Off
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                        </FieldGroup>
                    </DialogContent>
                </Dialog>
                <div className="w-full h-2/3 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <Photo
                            src={photoSelected?.path}
                            name={photoSelected?.data?.name || ""}
                            className="h-full"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-y-4 items-center justify-center overflow-hidden">
                        <p className="font-bold text-center">
                            Enemy Characters
                        </p>
                        <IoPerson className="size-28" />
                        <p className="font-bold text-xl">
                            {enemyClosed + "/24"}
                        </p>
                    </div>
                </div>
                <div
                    className={
                        "flex flex-col items-center justify-center w-full " +
                        (enableGuess ? "" : "hidden")
                    }
                >
                    <Button
                        className="h-12 w-26 text-xl cursor-pointer"
                        onClick={guessClickHandle}
                    >
                        Guess
                    </Button>
                </div>
            </div>
            {/* Modals */}
            <Dialog modal={false} open={loadingDialogState}>
                <VisuallyHidden>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </VisuallyHidden>

                {/* Overlay personalizzato */}
                <DialogOverlay className="fixed inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto w-1/2 h-1/2 bg-black/40 rounded-xl" />
                </DialogOverlay>

                <DialogContent showCloseButton={false} className="pointer-events-auto">
                    <div className="flex flex-col items-center gap-y-4 justify-center py-4">
                        <p className="font-extrabold text-4xl text-center">{loadingDialogContent}</p>
                        <Spinner className="size-20" />
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog modal={false} open={dialogState}>
                <VisuallyHidden>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </VisuallyHidden>
                <DialogContent showCloseButton={false}>
                    <div className="flex flex-col items-center justify-center py-4">
                        <p className="text-4xl font-semibold py-4 text-center">
                            {contentDialogState}
                        </p>
                        <Button
                            size="lg"
                            className="w-1/2 mt-6 cursor-pointer"
                            onClick={dialogClickHandle}
                        >
                            Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog modal={false} open={askQuestionDialogState}>
                <VisuallyHidden>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </VisuallyHidden>
                <DialogContent showCloseButton={false}>
                    <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                        <p className="text-4xl font-semibold py-4 text-center">
                            {contentAskQuestionDialog}
                        </p>
                        {questionResponse == null ? (
                            <Spinner className="size-20" />
                        ) : (
                            <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                                <Card
                                    className="p-2 w-full h-full cursor-pointer"
                                    onClick={() => {
                                        setAskQuestionDialogState(false);
                                    }}
                                >
                                    {questionResponse ? (
                                        <ImCheckmark
                                            className="w-full h-full"
                                            color="green"
                                        />
                                    ) : (
                                        <ImCross
                                            className="w-full h-full"
                                            color="red"
                                        />
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog modal={false} open={responseQuestionDialogState}>
                <VisuallyHidden>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </VisuallyHidden>
                <DialogContent showCloseButton={false}>
                    <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                        <p className="text-4xl font-semibold py-4 text-center">
                            {contentResponseQuestionDialog}
                        </p>
                        <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                            <Card
                                className="p-2 w-full h-full cursor-pointer"
                                onClick={() => {
                                    questionResponseHandle(false);
                                }}
                            >
                                <ImCross
                                    className="w-full h-full"
                                    color="red"
                                />
                            </Card>
                            <Card
                                className="p-2 w-full h-full cursor-pointer"
                                onClick={() => {
                                    questionResponseHandle(true);
                                }}
                            >
                                <ImCheckmark
                                    className="w-full h-full"
                                    color="green"
                                />
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog modal={false} open={guessCharacterDialogState}>
                <VisuallyHidden>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </VisuallyHidden>
                <DialogContent showCloseButton={false}>
                    <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                        <Photo
                            src={guessCharacter?.path}
                            name={guessCharacter?.data?.name || ""}
                            className="w-1/2 aspect-square"
                        />
                        <Spinner className="size-20" />
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog modal={false} open={responseGuessCharacterDialogState}>
                <VisuallyHidden>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </VisuallyHidden>
                <DialogContent showCloseButton={false}>
                    <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                        <Photo
                            src={guessCharacter?.path}
                            name={guessCharacter?.data?.name || ""}
                            className="w-1/2 aspect-square"
                        />
                        <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                            <Card
                                className="p-2 w-full h-full cursor-pointer"
                                onClick={() => {
                                    guessResponseHandle(false);
                                }}
                            >
                                <ImCross
                                    className="w-full h-full"
                                    color="red"
                                />
                            </Card>
                            <Card
                                className="p-2 w-full h-full cursor-pointer"
                                onClick={() => {
                                    guessResponseHandle(true);
                                }}
                            >
                                <ImCheckmark
                                    className="w-full h-full"
                                    color="green"
                                />
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <audio src="/spa/game/bgmusic" loop ref={audioRef} />
        </div>
    </div>
}
