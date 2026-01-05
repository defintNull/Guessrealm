import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function InfoOverlay() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* TRIGGER */}
      <div
        className="absolute top-4 left-4 h-12 w-12 z-50 cursor-pointer"
        onClick={() => setVisible(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-0.5 -0.5 28 28"
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient
              id="A"
              x1="2.039"
              y1="3.474"
              x2="23.454"
              y2="25.309"
              gradientUnits="userSpaceOnUse"
            >
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
            i
          </text>
        </svg>
      </div>

      {/* OVERLAY */}
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

            {/* 1. Contenuto e Preparazione */}
            <AccordionItem value="item-1">
                <AccordionTrigger>Contenuto e Preparazione</AccordionTrigger>
                <AccordionContent>
                <p>
                    - 2 modalità di gioco<br />
                    - 24 personaggi misteriosi<br />
                    <br />
                    Ogni giocatore sceglie un personaggio tra i 24 disponibili.<br />

                </p>
                </AccordionContent>
            </AccordionItem>

            {/* 2. Impostazione della Partita */}
            <AccordionItem value="item-2">
                <AccordionTrigger>Impostazione della Partita</AccordionTrigger>
                <AccordionContent>
                <p>
                    Ogni giocatore parte con tutti i personaggi visibili.<br />
                    Il primo giocatore è determinato da un lancio di moneta digitale.
                </p>
                </AccordionContent>
            </AccordionItem>

            {/* 3. Svolgimento del Turno */}
            <AccordionItem value="item-3">
                <AccordionTrigger>Svolgimento del Turno</AccordionTrigger>
                <AccordionContent>
                <p>
                    Ogni turno è composto da 3 fasi:<br />
                    <br />
                    <strong>1. Fare una domanda (Sì/No)</strong><br />
                    Le domande devono prevedere solo risposta Sì o No.<br />
                    Esempi: “Porta gli occhiali?”, “Ha i capelli biondi?”<br />
                    <br />
                    <strong>2. Eliminare i personaggi</strong><br />
                    Chiudi tutte le card incompatibili in base alla risposta.<br />
                    <br />
                    <strong>3. Turno dell’avversario</strong><br />
                    Dopo aver aggiornato il tuo piano, l’altro giocatore fa la sua domanda.
                </p>
                </AccordionContent>
            </AccordionItem>

            {/* 4. Indovinare e Condizioni di Vittoria */}
            <AccordionItem value="item-4">
                <AccordionTrigger>Indovinare e Vittoria</AccordionTrigger>
                <AccordionContent>
                <p>
                    Puoi tentare di indovinare il personaggio dell’avversario in qualsiasi momento.<br />
                    ⚠️ Se sbagli, perdi automaticamente la partita.<br />
                    <br />
                    Vince chi indovina correttamente il personaggio misterioso dell’avversario.
                </p>
                </AccordionContent>
            </AccordionItem>

            {/* 5. Modalità 1v1 contro l’AI */}
            <AccordionItem value="item-5">
                <AccordionTrigger>Modalità 1v1 contro l’AI</AccordionTrigger>
                <AccordionContent>
                <p>
                    L’AI usa una strategia logica simile a un giocatore umano.<br />
                    Le sue domande riducono rapidamente i possibili personaggi.<br />
                    L’AI non vede il tuo personaggio: decide solo in base alle tue risposte.<br />
                    <br />
                    <strong>Difficoltà:</strong><br />
                    - Facile: domande casuali<br />
                    - Normale: domande ragionate<br />
                    - Difficile: massima ottimizzazione<br />
                    <br />
                    È disponibile l’opzione “Suggerimento” per aiutarti nelle domande.
                </p>
                </AccordionContent>
            </AccordionItem>

            {/* 6. Modalità Online */}
            <AccordionItem value="item-6">
                <AccordionTrigger>Modalità Online</AccordionTrigger>
                <AccordionContent>
                <p>
                    Sfida un giocatore reale tramite internet.<br />
                    Ogni giocatore vede solo il proprio lato del piano di gioco.<br />
                    Comunicazione tramite chat testuale.<br />
                    <br />
                    <strong>Timer a turni:</strong> 30–45 secondi, poi passa all’avversario.<br />
                    <strong>Giocatore inattivo:</strong> chi non risponde perde per abbandono.<br />
                    <strong>Classifiche e badge:</strong> vincere permette di salire di livello.<br />
                    <strong>Anti-cheat:</strong> i nomi dei personaggi non possono essere copiati/incollati.
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
    </>
  );
}
