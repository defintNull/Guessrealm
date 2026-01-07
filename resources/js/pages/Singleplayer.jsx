import Photo from '@/components/Photo';
import SideChat from '@/components/SideChat';
import { Card } from '@/components/ui/card';
import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
import { IoIosSettings } from "react-icons/io";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Questions from '@/services/Questions';
import { Button } from '@/components/ui/button';
import { Spinner } from "@/components/ui/spinner"
import { TextColor } from '@/components/ColoredText';
import { ImCross } from 'react-icons/im';
import { ImCheckmark } from "react-icons/im";
import { useNavigate } from 'react-router-dom';

export default function Singleplayer() {
    const navigate = useNavigate();
    // Game states
    const [ gameState, setGameState ] = useState(0);
    const [ photos, setPhotos ] = useState([]);
    const [ endGame, setEndGame ] = useState(false);

    const [ photoSelected, setPhotoSelected ] = useState([]);
    const [ photoTargetSelected, setPhotoTargetSelected ] = useState([]);
    const [ botPhotoSelected, setBotPhotoSelected ] = useState([]);
    const [ botPhotoTargetSelected, setBotPhotoTargetSelected ] = useState([]);

    const [ messages, setMessages ] = useState([]);

    const [ questions, setQuestions ] = useState([]);
    const [ currentQuestion, setCurrentQuestion ] = useState(null);
    const [ awaitResponse, setAwaitResponse ] = useState(false);
    const [ response, setResponse ] = useState(false);

    // Settings
    const [ difficuty, setDifficulty ] = useState("medium");
    const [ aiHelp, setAiHelp ] = useState("on");

    // Dialog state
    const [ dialogState, setDialogState ] = useState(false);
    const [ contentDialogState, setContentDialogState ] = useState("");

    // Loading dialog state
    const [ loadingDialogState, setLoadingDialogState ] = useState(true);

    // Question Dialog state
    const [ askQuestionDialogState, setAskQuestionDialogState ] = useState(false);
    const [ contentAskQuestionDialog, setContentAskQuestionDialog ] = useState("");

    // Question Dialog state
    const [ responseQuestionDialogState, setResponseQuestionDialogState ] = useState(false);
    const [ contentResponseQuestionDialog, setContentResponseQuestionDialog ] = useState("");

    // Command selector
    const commandRef = useRef(null);
    const [ commandVisibility, setCommandVisibility ] = useState(false);
    const [ commandBlockVisibility, setCommandBlockVisibility ] = useState(false);

    // Click photo mode
    const [ mode, setMode ] = useState(0);

    useEffect(() => {
        // Foto loading
        (async () => {
            let res = await axios.post("/spa/game/photos");
            setPhotos(res.data?.photos.map(el => {
                    return {
                        id:el?.id,
                        path:"/spa/game/photo/show/" + el?.id,
                        state: false,
                    }
                }
            ));
        })();

        // Set questions
        let questionsArray = Questions().map((el, index) => {
            return {
                id: index,
                text: el
            }
        });
        setQuestions(questionsArray);

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

    // Command block click handle
    function commandInputClickHandler() {
        setCommandVisibility(true);
    }

    function commandClickHandle(id) {
        let chosenQuestion = questions.find(el => el.id == id)
        setCurrentQuestion(chosenQuestion);
        setMessages((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                color: TextColor.GREEN,
                text: "[Player]: Asking \"" + chosenQuestion.text + "\"",
            },
        ]);
        setGameState(3);
    }

    async function game() {
        if(gameState == 0) {
            // Await loading
            setMessages((prev) => [
                    ...prev,
                    {
                      id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                      color: TextColor.GRAY,
                      text: "[System]: Loading...",
                    },
                ]);
            await new Promise(res => setTimeout(res, 3000));
            setLoadingDialogState(false);
            setGameState(1);
        } else if(gameState == 1) {
            // Choosing character
            setContentDialogState("Select your character")
            setDialogState(true);
            setMessages((prev) => [
                    ...prev,
                    {
                      id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                      color: TextColor.GRAY,
                      text: "[System]: Player choosing character...",
                    },
                ]);
        } else if(gameState == 2) {
            // Command selection phase
            setMessages((prev) => [
                    ...prev,
                    {
                      id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                      color: TextColor.GRAY,
                      text: "[System]: Player choosing question...",
                    },
                ]);
            setCommandBlockVisibility(true);
        } else if(gameState == 3) {
            // Await question response
            setContentAskQuestionDialog(currentQuestion?.text);
            setAwaitResponse(true);
            setAskQuestionDialogState(true);

            (() => {
                // CODICE PER FAR RISPONDERE IL BOT
                setAwaitResponse(false);
            })();
        } else if(gameState == 4) {
            // BOT turn
            setCommandBlockVisibility(false);
            setAskQuestionDialogState(false);

            setContentResponseQuestionDialog("Waiting for a question from the other player...");
            setAwaitResponse(true);
            setResponseQuestionDialogState(true);

            (() => {
                // CODICE PER FAR RISPONDERE IL BOT
                setAwaitResponse(false);
            })();
        } else if(gameState == 5) {
            // Response phase

            // Codice per gestire risposta del giocatore
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                    color: TextColor.GREEN,
                    text: "[Player]: Response: " + response,
                },
            ]);
            setResponseQuestionDialogState(false);
            setGameState(2);
        } else if(gameState == 6) {
            // Choosing targhet phase
            setContentDialogState("Guess the chosen character!")
            setDialogState(true);
            setMode(1)

        } else if(gameState == 7) {
            // End phase
            setEndGame(true);
            if(botPhotoSelected.id == photoTargetSelected.id) {
                setContentDialogState("You Win!");
            } else {
                setContentDialogState("You Lose!");
            }
            setDialogState(true);
        }
    }

    useEffect(() => {game()}, [gameState]);

    // Photo click handle
    function characterClick(event) {
        if(mode == 0) {
            setPhotoSelected(photos.find(el => el.id == event.currentTarget.dataset.id));
            setGameState(2);
            setMode(2);
        } else if(mode == 1) {
            setPhotoTargetSelected(photos.find(el => el.id == event.currentTarget.dataset.id));
            setGameState(7);
        } else {
            let photosMap = photos.map(el => {
                if(el.id == event.currentTarget.dataset.id) {
                    return {...el, state: !el.state}
                }
                return el;
            });
            setPhotos(photosMap);
        }
    }

    function guessClickHandle() {
        setGameState(6);
    }

    function dialogClickHandle() {
        if(endGame) {
            navigate("/");
        }

        setDialogState(false);
    }

    return <div>
        <div className="flex flex-row h-[calc(100svh-100px)] pt-4">
            {/* Left Sidebar */}
            <div className="w-1/6 h-full">
                <SideChat messages={messages} setMessages={setMessages}/>
            </div>
            {/* Main body */}
            <div className="flex flex-col items-center justify-center h-full w-2/3">
                <div className="flex flex-col flex-1 items-center justify-center overflow-hidden">
                    <div className="grid grid-rows-4 grid-cols-6 h-full overflow-hidden">
                        {photos.map(el => {
                            return <Photo className="cursor-pointer" data-id={el.id} key={el.id} state={el.state} src={el.path} onClick={characterClick}/>
                        })}
                    </div>
                </div>
                <Command ref={commandRef} className={"grow-0 w-full h-13 overflow-visible relative px-4 py-2 " + (!commandBlockVisibility ? "hidden" : "")}>
                    <CommandList className={"absolute w-full max-h-40 bg-slate-50 rounded-t-xl z-20 bottom-13 " + (!commandVisibility ? "hidden": "")}>
                        <CommandEmpty>No question found!</CommandEmpty>
                        {questions.map(el => <CommandItem className="cursor-pointer" onSelect={() => commandClickHandle(el.id)} data-id={el.id} key={el.id}>{el.text}</CommandItem>)}
                    </CommandList>
                    <CommandInput onClick={commandInputClickHandler} placeholder="Search for a question" />
                </Command>
            </div>
            {/* Right Sidebar */}
            <div className="flex flex-col grow gap-y-5 items-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <IoIosSettings className="text-6xl mr-4 mt-8 rounded-4xl hover:bg-slate-100 hover:cursor-pointer" />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>Game settings</DialogDescription>
                        <FieldGroup>
                            <Field orientation="horizontal">
                                <FieldLabel>Difficulty</FieldLabel>
                                <Select value={difficuty} onValueChange={setDifficulty}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a value..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Difficulty</SelectLabel>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="difficult">Difficult</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field orientation="horizontal">
                                <FieldLabel>AI Help</FieldLabel>
                                <Select value={aiHelp} onValueChange={setAiHelp}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a value..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>AIHelp</SelectLabel>
                                            <SelectItem value="on">On</SelectItem>
                                            <SelectItem value="off">Off</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </FieldGroup>
                    </DialogContent>
                </Dialog>
                <div className="w-full h-2/3 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <Photo src={photoSelected?.path} className="h-full" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Photo src={photoTargetSelected?.path} className="h-full" />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center w-full">
                    <Button className="h-12 w-26 text-xl cursor-pointer" onClick={guessClickHandle}>Guess</Button>
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
                        <p className="text-4xl font-semibold py-4 text-center">{contentDialogState}</p>
                        <Button size="lg" className="w-1/2 mt-6 cursor-pointer" onClick={dialogClickHandle}>Confirm</Button>
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
                        <p className="font-extrabold text-4xl">Loading...</p>
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
                        <p className="text-4xl font-semibold py-4 text-center">{contentAskQuestionDialog}</p>
                        { awaitResponse ? (
                            <Spinner className="size-20" />
                        ) : (
                            <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                                <Card className="p-2 w-full h-full cursor-pointer" onClick={() => {
                                    setGameState(4);
                                }}>
                                    { response ? (
                                        <ImCheckmark className="w-full h-full" color="green"/>
                                    ) : (
                                        <ImCross className="w-full h-full" color="red" />
                                    ) }
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
                        <p className="text-4xl font-semibold py-4 text-center">{contentResponseQuestionDialog}</p>
                        { awaitResponse ? (
                            <Spinner className="size-20" />
                        ) : (
                            <div className="flex flex-row min-h-20 items-center justify-center gap-x-12">
                                <Card className="p-2 w-full h-full cursor-pointer" onClick={() => {
                                    setResponse(false);
                                    setGameState(5);
                                }}>
                                    <ImCross className="w-full h-full" color="red" />
                                </Card>
                                <Card className="p-2 w-full h-full cursor-pointer" onClick={() => {
                                    setResponse(true);
                                    setGameState(5);
                                }}>
                                    <ImCheckmark className="w-full h-full" color="green"/>
                                </Card>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>
}
