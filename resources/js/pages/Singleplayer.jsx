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

export default function Singleplayer() {
    const [ photos, setPhotos ] = useState([]);
    const [ difficuty, setDifficulty ] = useState("medium");
    const [ aiHelp, setAiHelp ] = useState("on");
    const commandRef = useRef(null);
    const [ commandVisibility, setCommandVisibility ] = useState(false);

    useEffect(() => {
        // Foto loading
        (async () => {
            let res = await axios.post("/spa/game/photos");
            setPhotos(res.data?.photos.map(el => ({id:el?.id, path:"/spa/game/photo/show/" + el?.id})));
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

    function commandInputClickHandler() {
        setCommandVisibility(true);
    }

    return <div>
        <div className="flex flex-row h-[calc(100svh-100px)] pt-4">
            <div className="w-1/6 h-full">
                <SideChat />
            </div>
            <div className="flex flex-col items-center justify-center h-full w-2/3">
                <div className="flex flex-col flex-1 items-center justify-center overflow-hidden">
                    <div className="grid grid-rows-4 grid-cols-6 h-full overflow-hidden">
                        {photos.map(el => {
                            return <Photo key={el.id} src={el.path} />
                        })}
                    </div>
                </div>
                <Command ref={commandRef} className="grow-0 w-full h-13 overflow-visible relative px-4 py-2">
                    <CommandList className={"absolute w-full max-h-40 bg-slate-50 rounded-t-xl z-20 bottom-13 " + (!commandVisibility ? "hidden": "")}>
                        <CommandEmpty>No question found!</CommandEmpty>
                        <CommandItem>Prova</CommandItem>
                        <CommandItem>Prova1</CommandItem>
                        <CommandItem>Prova2</CommandItem>
                        <CommandItem>Prova3</CommandItem>
                        <CommandItem>Prova</CommandItem>
                        <CommandItem>Prova1</CommandItem>
                        <CommandItem>Prova2</CommandItem>
                        <CommandItem>Prova3</CommandItem>
                        <CommandItem>Prova</CommandItem>
                        <CommandItem>Prova1</CommandItem>
                        <CommandItem>Prova2</CommandItem>
                        <CommandItem>Prova3</CommandItem>
                    </CommandList>
                    <CommandInput onClick={commandInputClickHandler} placeholder="Search for a question" />
                </Command>
            </div>
            <div className="flex flex-col grow items-end">
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
                <div className="w-full h-1/3 pl-6 pt-4">
                    <Photo className="mb-4" />
                    <Photo />
                </div>
            </div>
        </div>
    </div>
}
