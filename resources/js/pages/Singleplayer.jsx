import Photo from "@/components/Photo";
import SideChat from "@/components/SideChat";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { IoIosSettings } from "react-icons/io";
import { IoPerson } from "react-icons/io5";
import { FaStar } from "react-icons/fa";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Questions from "@/services/Questions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextColor } from "@/components/ColoredText";
import { ImCross } from "react-icons/im";
import { ImCheckmark } from "react-icons/im";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import {
    botChooseCharacter,
    botAskQuestion,
    botQuestionResponse,
    botRegisterResponse,
    botChooseIfGuess,
    botGuess,
} from "@/services/BOT";
import { ScrollArea } from "@/components/ui/scroll-area";
import Timer from "@/components/Timer";
import { FacialAttributesClassifier } from "@/services/ai_bot/standalone";
import { id } from "zod/v4/locales";

export default function Singleplayer() {
    const { user } = useAuth();
    const navigate = useNavigate();
    // Game states
    const [gameState, setGameState] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [botPhotos, setBotPhotos] = useState([]);
    const [endGame, setEndGame] = useState(false);

    const TIMER = 120;
    const [time, setTime] = useState(TIMER);
    const [timerRunning, setTimerRunning] = useState(false);
    const [enableForward, setEnableForward] = useState(false);

    const [photoSelected, setPhotoSelected] = useState(null);
    const [photoTargetSelected, setPhotoTargetSelected] = useState(null);
    const [botPhotoSelected, setBotPhotoSelected] = useState(null);
    const [botPhotoTargetSelected, setBotPhotoTargetSelected] = useState(null);

    const [messages, setMessages] = useState([]);

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [awaitResponse, setAwaitResponse] = useState(false);
    const [response, setResponse] = useState(false);

    // Settings
    const [difficulty, setDifficulty] = useState(1);
    const [aiHelp, setAiHelp] = useState(1);
    const [aiLoading, setAiLoading] = useState(true);
    const aiLoadingRef = useRef(aiLoading);

    useEffect(() => {
        aiLoadingRef.current = aiLoading;
    }, [aiLoading]);

    // Enable Guess
    const [enableGuess, setEnableGuess] = useState(false);

    // Dialog state
    const [dialogState, setDialogState] = useState(false);
    const [contentDialogState, setContentDialogState] = useState("");

    // Loading dialog state
    const [loadingDialogState, setLoadingDialogState] = useState(true);

    // Question Dialog state
    const [askQuestionDialogState, setAskQuestionDialogState] = useState(false);
    const [contentAskQuestionDialog, setContentAskQuestionDialog] = useState("");

    // Question Dialog state
    const [responseQuestionDialogState, setResponseQuestionDialogState] = useState(false);
    const [contentResponseQuestionDialog, setContentResponseQuestionDialog] = useState("");

    // Command selector
    const commandRef = useRef(null);
    const [commandVisibility, setCommandVisibility] = useState(false);
    const [commandBlockVisibility, setCommandBlockVisibility] = useState(false);

    // Click photo mode
    const [mode, setMode] = useState(0);

    useEffect(() => {
        //console.log(botPhotoSelected);
    }, [botPhotoSelected]);

    // Preprocessing
    useEffect(() => {
        // Foto loading
        (async () => {
            let res = await axios.post("/spa/game/photos");

            // Set questions
            let questionsArray = Questions().map((el, index) => {
                return {
                    id: index,
                    text: el,
                    best: false,
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
            let botPhotosArray = photosArray.map((p) => ({ ...p }));
            setPhotos(photosArray);
            setBotPhotos(botPhotosArray);

            // AI MODEL CODE
            (async () => {
                let aiModel = FacialAttributesClassifier.getInstance();
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
                botPhotosArray = photosArray.map((p) => ({ ...p }));
                setPhotos(photosArray);
                setBotPhotos(botPhotosArray);
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
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        if (gameState == 1 || gameState == 5) {
            setGameState(8);
        } else if (gameState == 2) {
            setGameState(gameState + 2);
        } else {
            setGameState(gameState + 1);
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

    function waitFor(condition, interval = 100) {
        return new Promise((resolve) => {
            const check = () => {
                if (condition()) resolve();
                else setTimeout(check, interval);
            };
            check();
        });
    }

    // Game function FSM
    async function game() {
        if (gameState == 0) {
            //awit loading
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GRAY,
                    content: "Loading...",
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
            await waitFor(() => aiLoadingRef.current === false);
            setLoadingDialogState(false);
            setGameState(1);
        } else if (gameState == 1) {
            // Choosing character
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

            // BOT
            setBotPhotoSelected(botChooseCharacter(botPhotos));
        } else if (gameState == 2) {
            // Command selection phase
            restartTimer();
            setEnableForward(true);

            setEnableGuess(true);

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
        } else if (gameState == 3) {
            // Await question response
            restartTimer();
            setEnableForward(false);

            setContentAskQuestionDialog(currentQuestion?.text);
            setAwaitResponse(true);
            setAskQuestionDialogState(true);

            (async () => {
                // BOT
                let res = await botQuestionResponse(
                    botPhotoSelected,
                    currentQuestion
                );
                setResponse(res);

                setMessages((prev) => [
                    ...prev,
                    {
                        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                        color: TextColor.RED,
                        content: 'Response: "' + res + '"',
                        user: {
                            id: -1,
                            username: "BOT",
                            avatar: null,
                        },
                        time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    },
                ]);

                setAwaitResponse(false);
            })();
        } else if (gameState == 4) {
            // Close phase
            setEnableGuess(false);
            restartTimer();
            setEnableForward(true);

            setCommandBlockVisibility(false);
            setAskQuestionDialogState(false);
            aiCloseSuggestions();
        } else if (gameState == 5) {
            setPhotos(
                photos.map((el) => {
                    return {
                        ...el,
                        help: false,
                    };
                })
            );
            // BOT turn
            restartTimer();
            setEnableForward(false);

            setCurrentQuestion(null);
            setResponse(null);

            setContentResponseQuestionDialog(
                "Waiting for a question from the other player..."
            );
            setAwaitResponse(true);
            setResponseQuestionDialogState(true);

            (async () => {
                // BOT
                let choice = await botChooseIfGuess(botPhotos, difficulty);
                if (choice) {
                    let guess = await botGuess(botPhotos, difficulty);
                    setBotPhotoTargetSelected(guess);
                    setGameState(8);
                    return;
                }

                let res = await botAskQuestion(
                    botPhotos,
                    difficulty,
                    questions
                );
                setCurrentQuestion(res);
                setContentResponseQuestionDialog(res?.text);

                setMessages((prev) => [
                    ...prev,
                    {
                        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                        color: TextColor.RED,
                        content: 'Asking: "' + res?.text + '"',
                        user: {
                            id: -1,
                            username: "BOT",
                            avatar: null,
                        },
                        time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    },
                ]);

                setAwaitResponse(false);
            })();
        } else if (gameState == 6) {
            // Response phase
            restartTimer();
            setEnableForward(false);

            // Codice per gestire risposta del giocatore
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

            (async () => {
                let res = await botRegisterResponse(
                    botPhotos,
                    currentQuestion,
                    response
                );
                setBotPhotos(res);
            })();

            setResponseQuestionDialogState(false);
            setCurrentQuestion(null);
            setResponse(null);
            setGameState(2);
        } else if (gameState == 7) {
            // Choosing targhet phase
            restartTimer();
            setEnableForward(false);

            setContentDialogState("Guess the chosen character!");
            setDialogState(true);
            setMode(1);
        } else if (gameState == 8) {
            // End phase
            setResponseQuestionDialogState(false);
            setEndGame(true);
            const botGuessedCorrectly =
                botPhotoTargetSelected?.id === photoSelected?.id;
            const userGuessedCorrectly =
                botPhotoSelected?.id === photoTargetSelected?.id;
            if (botGuessedCorrectly) {
                setContentDialogState("Bot guess the character!");
            } else if (
                userGuessedCorrectly ||
                (photoTargetSelected === null && !botGuessedCorrectly)
            ) {
                setContentDialogState("You Win!");
            } else {
                setContentDialogState("You Lose!");
            }

            setDialogState(true);
        }
    }

    async function aiQuestionSuggestions() {
        if (gameState == 2) {
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

    async function aiCloseSuggestions() {
        let photosArray = photos.map((el) => {
            if (
                !el.state &&
                response != undefined &&
                currentQuestion != undefined &&
                el?.questions.find((q) => q.id == currentQuestion?.id)
                    ?.response != response
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

    useEffect(() => {
        game();
        aiQuestionSuggestions();
    }, [gameState]);

    // Command block click handle
    function commandInputClickHandler() {
        setCommandVisibility(true);
    }

    function commandClickHandle(id) {
        let chosenQuestion = questions.find((el) => el.id == id);
        setCurrentQuestion(chosenQuestion);

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

        setGameState(3);
    }

    // Photo click handle
    function characterClick(event) {
        if (mode == 0) {
            setPhotoSelected(
                photos.find((el) => el.id == event.currentTarget.dataset.id)
            );
            setGameState(2);
            setMode(2);
        } else if (mode == 1) {
            setPhotoTargetSelected(
                photos.find((el) => el.id == event.currentTarget.dataset.id)
            );
            setGameState(8);
        } else {
            let photosMap = photos.map((el) => {
                if (el.id == event.currentTarget.dataset.id) {
                    return { ...el, state: !el.state };
                }
                return el;
            });
            setPhotos(photosMap);
        }
    }

    function guessClickHandle() {
        setGameState(7);
    }

    function dialogClickHandle() {
        if (endGame) {
            navigate("/");
        }

        setDialogState(false);
    }

    return (
        <div>
            <div className="flex flex-row h-[calc(100svh-100px)] pt-4">
                {/* Left Sidebar */}
                <div className="w-1/6 h-full">
                    <SideChat messages={messages} setMessages={setMessages} />
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
                                    "absolute w-full max-h-40 bg-slate-50 dark:bg-gray-900 rounded-t-xl z-20 bottom-full " +
                                    (!commandVisibility ? "hidden" : "")
                                }
                            >
                                <ScrollArea className="max-h-40">
                                    <CommandEmpty>
                                        No question found!
                                    </CommandEmpty>
                                    {questions.map((el) => (
                                        <CommandItem
                                            className="cursor-pointer justify-between pr-2"
                                            onSelect={() =>
                                                commandClickHandle(el.id)
                                            }
                                            data-id={el.id}
                                            key={el.id}
                                        >
                                            <p>{el.text}</p>
                                            {aiHelp && el.best ? (
                                                <FaStar />
                                            ) : null}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
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
                                    <FieldLabel>Difficulty</FieldLabel>
                                    <Select
                                        value={difficulty}
                                        onValueChange={setDifficulty}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a value..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    Difficulty
                                                </SelectLabel>
                                                <SelectItem value={0}>
                                                    Easy
                                                </SelectItem>
                                                <SelectItem value={1}>
                                                    Medium
                                                </SelectItem>
                                                <SelectItem value={2}>
                                                    Difficult
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field orientation="horizontal">
                                    <FieldLabel>AI Help</FieldLabel>
                                    <Select
                                        value={aiHelp}
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
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a value..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    AIHelp
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
                                name={photoSelected?.name || ""}
                                className="h-full"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-y-4 items-center justify-center overflow-hidden">
                            <p className="font-bold text-center">
                                Bot Characters
                            </p>
                            <IoPerson className="size-28" />
                            <p className="font-bold text-xl">
                                {botPhotos.filter((el) => !el?.state).length} /{" "}
                                {botPhotos.length}
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
                <Dialog open={dialogState}>
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
                <Dialog open={loadingDialogState}>
                    <VisuallyHidden>
                        <DialogTitle>Loading</DialogTitle>
                        <DialogDescription></DialogDescription>
                    </VisuallyHidden>
                    <DialogContent showCloseButton={false}>
                        <div className="flex flex-col items-center gap-y-4 justify-center py-4">
                            <Spinner className="size-20" />
                            <p className="font-extrabold text-4xl">
                                Loading...
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={askQuestionDialogState}>
                    <VisuallyHidden>
                        <DialogTitle></DialogTitle>
                        <DialogDescription></DialogDescription>
                    </VisuallyHidden>
                    <DialogContent showCloseButton={false}>
                        <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                            <p className="text-4xl font-semibold py-4 text-center">
                                {contentAskQuestionDialog}
                            </p>
                            {awaitResponse ? (
                                <Spinner className="size-20" />
                            ) : (
                                <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                                    <Card
                                        className="p-2 w-full h-full cursor-pointer"
                                        onClick={() => {
                                            setGameState(4);
                                        }}
                                    >
                                        {response ? (
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
                <Dialog open={responseQuestionDialogState}>
                    <VisuallyHidden>
                        <DialogTitle></DialogTitle>
                        <DialogDescription></DialogDescription>
                    </VisuallyHidden>
                    <DialogContent showCloseButton={false}>
                        <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                            <p className="text-4xl font-semibold py-4 text-center">
                                {contentResponseQuestionDialog}
                            </p>
                            {awaitResponse ? (
                                <Spinner className="size-20" />
                            ) : (
                                <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                                    <Card
                                        className="p-2 w-full h-full cursor-pointer"
                                        onClick={() => {
                                            setResponse(false);
                                            setGameState(6);
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
                                            setResponse(true);
                                            setGameState(6);
                                        }}
                                    >
                                        <ImCheckmark
                                            className="w-full h-full"
                                            color="green"
                                        />
                                    </Card>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
