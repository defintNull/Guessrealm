import { Button } from "@/components/ui/button";
import { Accordion,
        AccordionItem,
        AccordionTrigger,
        AccordionContent,
        } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { useState } from "react";


export default function Home() {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative flex flex-col w-full grow justify-center items-center gap-y-12">
            <div
                className="absolute top-4 left-4 h-12 w-12 z-50 cursor-pointer"
                onClick={() => setVisible(!visible)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="-0.5 -0.5 28 28"
                    width="100%"
                    height="100%"
                >
                    <defs>
                        <linearGradient id="A" x1="2.039" y1="3.474" x2="23.454" y2="25.309" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#00ceac" />
                            <stop offset="1" stopColor="#07838f" />
                        </linearGradient>
                    </defs>

                    <circle cx="13.5" cy="13.5" r="13" fill="url(#A)" />

                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        fontFamily="Arial"
                        fill="white"
                        fontWeight="bold"
                    >
                        I
                    </text>
                </svg>
            </div>

            {/* OVERLAY + ACCORDION */}
            {visible && (
                <div
                    className="
                        fixed inset-0 z-40
                        bg-black/50 backdrop-blur-sm
                        flex items-center justify-center
                    "
                    onClick={() => setVisible(false)}
                >
                    <div
                        className="bg-white rounded-xl p-8 max-w-2xl w-[80%] shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Regole del gioco</AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        Timer a turni:
                                        Ogni turno ha un limite di tempo.
                                        Se il tempo scade, il turno passa automaticamente all’avversario.

                                        Giocatore inattivo:
                                        Se un giocatore non risponde per troppo tempo, viene dichiarato sconfitto per abbandono.

                                        Classifiche e punteggi:
                                        Vincere le partite online può far salire in classifica o sbloccare badge estetici (non influisce sul gameplay).

                                        Sistema anti-cheat:
                                        I nomi dei personaggi non possono essere copiati/incollati automaticamente o visionati dall’esterno.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger> MODALITÀ AGGIUNTIVE</AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        L’AI utilizza una strategia logica simile a un giocatore umano.

                                        Le domande dell’AI sono ottimizzate per ridurre rapidamente i possibili personaggi.

                                        L’AI non “vede” il tuo personaggio: basa ogni decisione solo sulle tue risposte.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger>CONDIZIONI DI VITTORIA </AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        Vince chi indovina correttamente il personaggio misterioso dell’avversario.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <button
                            className="mt-6 px-4 py-2 bg-black text-white rounded"
                            onClick={() => setVisible(false)}
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}






            <Button asChild variant="default" className="h-30 w-80 text-3xl">
                <Link to="/singleplayer">Singleplayer</Link>
            </Button>

            <Button asChild variant="secondary" className="h-30 w-80 text-3xl">
                <Link to="/Multiplayer">Multiplayer</Link>
            </Button>
        </div>
    );

}
