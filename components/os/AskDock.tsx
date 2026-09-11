"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Sparkle } from "@/components/icons";
import { LocText, Pill } from "@/components/os/ui";
import { FLAGSHIP_BRIEF } from "@/lib/os/agi/engine";
import { INGEST_ACCEPT } from "@/lib/os/agi/features";
import { useOs } from "@/lib/os/store";
import { useApp } from "@/lib/store";
import type { Lang } from "@/lib/i18n";

type SpeechCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function speechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function speechLang(lang: Lang) {
  if (lang === "th") return "th-TH";
  if (lang === "zh") return "zh-CN";
  if (lang === "ru") return "ru-RU";
  return "en-US";
}

export default function AskDock({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { lang } = useApp();
  const { o, a, ask, setAsk, runAsk, assignObjective, ingestFile, ingestVoice, agi } = useOs();
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<InstanceType<SpeechCtor> | null>(null);
  const wantListen = useRef(false);
  const spoken = useRef("");
  const [listening, setListening] = useState(false);
  const [voiceErr, setVoiceErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const latest = agi.ingests[0];
  const shown = open || listening;

  function finishTranscript() {
    const text = spoken.current.trim();
    spoken.current = "";
    if (text) ingestVoice(text);
  }

  function stopVoice() {
    wantListen.current = false;
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    finishTranscript();
  }

  function startVoice() {
    const Ctor = speechCtor();
    if (!Ctor) {
      setVoiceErr(o.voiceUnsupported);
      onOpen();
      return;
    }
    setVoiceErr("");
    recRef.current?.abort();
    spoken.current = "";
    const rec = new Ctor();
    rec.lang = speechLang(lang);
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let finalText = "";
      let live = "";
      for (let i = 0; i < ev.results.length; i++) {
        const row = ev.results[i];
        if (row.isFinal) finalText += `${row[0].transcript} `;
        else live += row[0].transcript;
      }
      const next = (finalText || live).trim();
      if (finalText.trim()) spoken.current = finalText.trim();
      else if (next) spoken.current = next;
      setAsk(next);
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") setVoiceErr(o.voiceUnsupported);
      wantListen.current = false;
      setListening(false);
    };
    rec.onend = () => {
      recRef.current = null;
      if (wantListen.current) startVoice();
      else {
        setListening(false);
        finishTranscript();
      }
    };
    recRef.current = rec;
    wantListen.current = true;
    setListening(true);
    onOpen();
    try {
      rec.start();
    } catch {
      setVoiceErr(o.voiceUnsupported);
      wantListen.current = false;
      setListening(false);
    }
  }

  useEffect(() => {
    if (!wantListen.current) return;
    startVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    function onMock(e: Event) {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text?.trim();
      if (text) ingestVoice(text);
    }
    window.addEventListener("t24-os-voice", onMock);
    return () => window.removeEventListener("t24-os-voice", onMock);
  }, [ingestVoice]);

  useEffect(() => () => stopVoice(), []);

  useEffect(() => {
    if (shown) inputRef.current?.focus();
  }, [shown]);

  function takeFile(file?: File | null) {
    if (file) void ingestFile(file);
  }

  function submit() {
    if (agi.on) assignObjective(ask);
    else runAsk();
  }

  if (!shown) {
    return (
      <button
        type="button"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 border border-text bg-white px-3 py-2 shadow-none"
        onClick={onOpen}
        aria-label={o.askAi}
      >
        <span className="h-2 w-2 bg-[#f2b01e]" aria-hidden />
        <Sparkle width={14} height={14} />
        <span className="text-[12px] font-extrabold">{o.askAi}</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-24px))] border border-text bg-white ${listening ? "outline outline-1 outline-[#f2b01e]" : ""} ${dragOver ? "outline outline-1 outline-text" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        takeFile(e.dataTransfer.files?.[0]);
      }}
    >
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-divider">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 shrink-0 bg-[#f2b01e]" aria-hidden />
            <Sparkle width={14} height={14} />
            <span className="text-[12px] font-extrabold truncate">{agi.on ? a.askAgi : o.askAi}</span>
          </div>
          <button type="button" className="os-topbtn text-neutral-700" onClick={onClose} aria-label={o.hidePlaybook}>
            −
          </button>
        </div>
        <div className="flex items-center gap-1 px-2 py-2">
          <input
            ref={inputRef}
            className="input min-h-[36px] border-0 bg-transparent text-[13px]"
            value={ask}
            placeholder={agi.on ? a.askAgiPh : o.askPh}
            onChange={(e) => setAsk(e.target.value)}
          />
          <button type="submit" className="btn btn-primary text-[11px] px-2.5 py-1.5 shrink-0">
            {agi.on ? a.assign : o.ask}
          </button>
        </div>
        <div className="flex items-center gap-0 px-2 pb-2">
          <button type="button" className="os-topbtn" onClick={() => fileRef.current?.click()} title={o.attach}>
            <Paperclip />
          </button>
          <button
            type="button"
            className={`os-topbtn ${listening ? "is-on" : ""}`}
            onClick={() => (listening ? stopVoice() : startVoice())}
            title={listening ? o.listening : o.voice}
          >
            <Mic />
          </button>
          {agi.on && (
            <button
              type="button"
              className="os-topbtn text-[11px]"
              onClick={() => {
                setAsk(FLAGSHIP_BRIEF);
                assignObjective(FLAGSHIP_BRIEF);
              }}
            >
              {a.flagship}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={INGEST_ACCEPT}
            onChange={(e) => {
              takeFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {listening && <p className="px-3 pb-2 text-[11px] font-extrabold">{o.listening}</p>}
        {voiceErr && <p className="px-3 pb-2 text-[11px] font-extrabold">{voiceErr}</p>}
        {latest && (
          <div className="px-3 pb-3 border-t border-divider pt-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Pill tone="warn">{latest.kind}</Pill>
              <span className="font-extrabold text-[11px] truncate">
                {o.attached}: {latest.name}
              </span>
            </div>
            <p className="text-[11px] mt-1 text-neutral-700">
              <LocText v={latest.note} />
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
