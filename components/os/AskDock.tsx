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

export default function AskDock() {
  const { lang } = useApp();
  const { o, a, ask, setAsk, runAsk, assignObjective, ingestFile, ingestVoice, agi } = useOs();
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<InstanceType<SpeechCtor> | null>(null);
  const wantListen = useRef(false);
  const spoken = useRef("");
  const [listening, setListening] = useState(false);
  const [voiceErr, setVoiceErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const latest = agi.ingests[0];

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
    // Restart recognition when OS language changes.
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

  function takeFile(file?: File | null) {
    if (file) void ingestFile(file);
  }

  return (
    <div
      className={`border-b-2 border-text px-4 py-3.5 ${listening ? "bg-[#f2b01e]" : agi.on ? "bg-accent" : "bg-accent-200"}`}
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
        className={`flex flex-col gap-2 ${dragOver ? "outline outline-2 outline-text" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (agi.on) assignObjective(ask);
          else runAsk();
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkle width={18} height={18} />
          <div className="microlabel text-accent-900">{agi.on ? a.askAgi : o.askAi}</div>
        </div>
        <textarea
          className="input min-h-[88px] bg-bg text-[15px] rounded-none"
          value={ask}
          placeholder={agi.on ? a.askAgiPh : o.askPh}
          onChange={(e) => setAsk(e.target.value)}
        />
        <p className="text-[12px] text-accent-900">{agi.on ? a.askAgiIngestHint : o.askIngestHint}</p>
        <p className="text-[12px] text-accent-900">{o.askVoiceHint}</p>
        {listening && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-text bg-[#f2b01e] px-3 py-2">
            <span className="font-extrabold text-[13px]">{o.listening}</span>
            <button type="button" className="btn btn-secondary bg-bg rounded-none" onClick={stopVoice}>
              {o.voiceStop}
            </button>
          </div>
        )}
        {voiceErr && <p className="text-[12px] font-extrabold">{voiceErr}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary rounded-none">
            {agi.on ? a.assign : o.ask}
          </button>
          <button type="button" className="btn btn-secondary bg-bg rounded-none" onClick={() => fileRef.current?.click()}>
            <Paperclip />
            {o.attach}
          </button>
          <button
            type="button"
            className={`btn rounded-none ${listening ? "border-2 border-text bg-[#f2b01e] text-text" : "btn-secondary bg-bg"}`}
            onClick={() => (listening ? stopVoice() : startVoice())}
          >
            <Mic />
            {listening ? o.listening : o.voice}
          </button>
          {agi.on && (
            <button
              type="button"
              className="btn btn-secondary bg-bg rounded-none"
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
        {latest && (
          <div className="border-2 border-text bg-bg p-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Pill tone="warn">{latest.kind}</Pill>
              <span className="font-extrabold text-[13px]">
                {o.attached}: {latest.name}
              </span>
            </div>
            <p className="text-[12px] mt-1">
              <LocText v={latest.note} />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {(["confirmed", "estimate", "missing"] as const).map((k) => (
                <div key={k}>
                  <div className="microlabel mb-1">{k === "confirmed" ? a.confirmed : k === "estimate" ? a.estimate : a.missing}</div>
                  {latest.facts
                    .filter((f) => f.klass === k)
                    .map((f) => (
                      <p key={f.id} className="text-[12px]">
                        <LocText v={f.label} /> — <LocText v={f.value} />
                      </p>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
