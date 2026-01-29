import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-gray-900 text-[#bdbdbd] flex flex-col items-center justify-center overflow-hidden px-4">

      {/* 404 Header */}
      <h1 className="font-['Bevan'] text-[130px] tracking-[5px] text-[#f8f8f2] drop-shadow-[2px_2px_3px_rgba(255,255,255,0.15)]">
        HTTP: <span className="text-[1.2em]">404</span>
      </h1>

      {/* Typing Lines */}
      <div className="mt-8 space-y-4 text-center font-mono text-[16px] leading-relaxed">
        <TypingLine
          delay={0}
          tokens={[
            t("this_page", "kw"),
            t(".", ""),
            t("not_found", "fn"),
            t(" = ", ""),
            t("true", "var"),
            t(";", ""),
          ]}
        />

        <TypingLine
          delay={600}
          tokens={[
            t("if", "kw"),
            t(" (", ""),
            t("you_spelt_it_wrong", "var"),
            t(") { ", ""),
            t("try_again", "fn"),
            t("(); }", ""),
          ]}
        />

        <TypingLine
          delay={1300}
          tokens={[
            t("else if", "kw"),
            t(" (", ""),
            t("we_screwed_up", "var"),
            t(") {\n  ", ""),
            t("alert", "fn"),
            t("(\"", ""),
            t("We're really sorry about that.", "str"),
            t("\");\n  ", ""),
            t("window", "fn"),
            t(".location = ", ""),
            t("home", "var"),
            t(";\n}", ""),
          ]}
        />
      </div>

      {/* Home Link */}
      <Link
        to="/"
        className="mt-10 font-mono text-[20px] text-[#8abeb7] underline z-10"
      >
        HOME
      </Link>

      {/* Tailwind utilities */}
      <style>
        {`
        @layer utilities {
          .kw { color: #f0c674; }
          .fn { color: #b294bb; }
          .var { color: #81a2be; }
          .str { color: #b5bd68; }
        }
        `}
      </style>
    </div>
  );
}

/* ---------- Helpers ---------- */
function t(text, className) {
  return { text, className };
}

function TypingLine({ tokens, delay }) {
  const [count, setCount] = useState(0);
  const chars = tokens.flatMap(t =>
    t.text.split("").map(c => ({ c, className: t.className }))
  );

  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Carica l'audio e setup del volume
  useEffect(() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioCtx;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.06; // Volume del tic
    gainNode.connect(audioCtx.destination);
    gainNodeRef.current = gainNode;

    fetch("/storage/sounds/typing_sound1.wav")
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(decodedBuffer => {
        audioBufferRef.current = decodedBuffer;
      })
      .catch(console.error);
  }, []);

  // Effetto typing con suono
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i >= chars.length) {
          clearInterval(interval);
          return;
        }

        setCount(prev => prev + 1);

        // Suono tic
        if (audioContextRef.current && audioBufferRef.current && gainNodeRef.current) {
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBufferRef.current;
          source.connect(gainNodeRef.current);
          source.start(0);
        }

        i++;
      }, 30); // Velocità typing
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <code className="block whitespace-pre">
      {chars.slice(0, count).map((ch, i) => (
        <span key={i} className={ch.className}>
          {ch.c}
        </span>
      ))}
      <span className="animate-pulse">|</span>
    </code>
  );
}
