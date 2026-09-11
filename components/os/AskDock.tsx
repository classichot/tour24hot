"use client";

import { Sparkle } from "@/components/icons";
import { FLAGSHIP_BRIEF } from "@/lib/os/agi/engine";
import { useOs } from "@/lib/os/store";

export default function AskDock() {
  const { o, a, ask, setAsk, runAsk, assignObjective, agi } = useOs();

  return (
    <div className={`border-b-2 border-text px-4 py-3.5 ${agi.on ? "bg-accent" : "bg-accent-200"}`}>
      <form
        className="flex flex-col gap-2"
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
          className="input min-h-[88px] bg-bg text-[15px]"
          value={ask}
          placeholder={agi.on ? a.askAgiPh : o.askPh}
          onChange={(e) => setAsk(e.target.value)}
        />
        <p className="text-[12px] text-accent-900">{agi.on ? a.askAgiHint : o.askHint}</p>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">
            {agi.on ? a.assign : o.ask}
          </button>
          {agi.on && (
            <button
              type="button"
              className="btn btn-secondary bg-bg"
              onClick={() => {
                setAsk(FLAGSHIP_BRIEF);
                assignObjective(FLAGSHIP_BRIEF);
              }}
            >
              {a.flagship}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
