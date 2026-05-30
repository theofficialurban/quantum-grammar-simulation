import { useState, useEffect, useRef, useMemo } from "react";

// --- Core Logic: Quantum Grammar Lexicon Analyzer ---
function analyzeWord(word) {
  const cleanWord = word.replace(/[.,!?]/g, "").toLowerCase();
  let code = 7; // Default to Fact/Noun
  let type = "Fact/Noun";

  if (/^(and|or)$/.test(cleanWord)) {
    code = 0;
    type = "Conjunction";
  } else if (/^(is|are)$/.test(cleanWord)) {
    code = 2;
    type = "Verb";
  } else if (/^(good|bad|red|blue|true|false|any|all|every)$/.test(cleanWord)) {
    code = 3;
    type = "Adjective";
  } else if (/^(i|you|he|she|it|we|they|me|him|her|us|them)$/.test(cleanWord)) {
    code = 4;
    type = "Pronoun";
  } else if (/^(for|by|with|of|in|on|at|over|under|through)$/.test(cleanWord)) {
    code = 5;
    type = "Position";
  } else if (/^(the|a|an|this|these|that|those)$/.test(cleanWord)) {
    code = 6;
    type = "Lodio";
  } else if (/ed$/.test(cleanWord) || cleanWord === "from") {
    code = 8;
    type = "Past-Tense";
  } else if (/^(to|shall|will|pre.*|pro.*)$/.test(cleanWord)) {
    code = 9;
    type = "Future-Tense";
  } else if (
    /ly$/.test(cleanWord) ||
    cleanWord === "fast" ||
    cleanWord === "very"
  ) {
    code = 1;
    type = "Adverb";
  }

  return { original: word, code, type, cleanWord };
}

// --- Grouping Logic: Assemble Plaquettes ---
function getGroups(words) {
  const groups = [];
  let currentGroup = [];

  for (let w of words) {
    if ([5, 6].includes(w.code)) {
      if (currentGroup.some((x) => [7, 1, 2, 3, 4, 8, 9].includes(x.code))) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(w);
    } else if (w.code === 7) {
      currentGroup.push(w);
      groups.push(currentGroup);
      currentGroup = [];
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      groups.push([w]);
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

// --- CONCEPT 2: Toric Canvas Component ---
const ToricCanvas = ({ groups }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const spacingX = 120;
    const spacingY = 120;

    const render = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const cols = Math.max(1, Math.floor((rect.width - 40) / spacingX));
      const expectedHeight = Math.max(
        400,
        Math.ceil(groups.length / cols) * spacingY + 100,
      );

      if (
        canvas.width !== rect.width * window.devicePixelRatio ||
        canvas.height !== expectedHeight * window.devicePixelRatio
      ) {
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${expectedHeight}px`;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = expectedHeight * window.devicePixelRatio;
      }

      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      ctx.clearRect(0, 0, rect.width, expectedHeight);
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, rect.width, expectedHeight);

      let x = 80;
      let y = 80;
      const size = 60;
      const time = Date.now();

      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      groups.forEach((group, index) => {
        if (x + spacingX > rect.width - 20) {
          x = 80;
          y += spacingY;
        }

        ctx.strokeStyle = "#44403c";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        ctx.setLineDash([]);

        const codes = group.map((w) => w.code);
        const has5 = codes.includes(5);
        const has6 = codes.includes(6);
        const has7 = codes.includes(7);
        const isError = codes.some((c) => [1, 3, 4, 8, 9].includes(c));
        const isMotion = codes.includes(2);

        ctx.lineCap = "round";
        if (has5) {
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y - size / 2);
          ctx.lineTo(x + size / 2, y - size / 2);
          ctx.stroke();
        }
        if (has6) {
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y - size / 2);
          ctx.lineTo(x - size / 2, y + size / 2);
          ctx.stroke();
        }

        if (has7) {
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y + size / 2);
          ctx.lineTo(x + size / 2, y + size / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + size / 2, y - size / 2);
          ctx.lineTo(x + size / 2, y + size / 2);
          ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        if ((has5 || has6) && has7) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        if (isMotion) {
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y);
          ctx.lineTo(x + size / 2, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + size / 4, y - 6);
          ctx.lineTo(x + size / 2, y);
          ctx.lineTo(x + size / 4, y + 6);
          ctx.stroke();
        }

        if (isError) {
          const pulse = (Math.sin(time / 150) + 1) / 2;
          ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + pulse * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, size / 2 + pulse * 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - size / 3, y - size / 3);
          ctx.lineTo(x + size / 3, y + size / 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + size / 3, y - size / 3);
          ctx.lineTo(x - size / 3, y + size / 3);
          ctx.stroke();
        }

        if (index < groups.length - 1) {
          ctx.strokeStyle = "#57534e";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (x + spacingX > rect.width - 20) {
            ctx.moveTo(x, y + size / 2 + 25);
            ctx.lineTo(80, y + spacingY - size / 2 - 15);
          } else {
            ctx.moveTo(x + size / 2 + 5, y);
            ctx.lineTo(x + spacingX - size / 2 - 5, y);
          }
          ctx.stroke();
        }

        ctx.fillStyle = "#d6d3d1";
        const label = group.map((w) => w.original).join(" ");
        const shortLabel =
          label.length > 15 ? label.substring(0, 13) + ".." : label;
        ctx.fillText(shortLabel, x, y + size / 2 + 18);

        const codeLabel = group.map((w) => w.code).join("-");
        ctx.fillStyle = "#78716c";
        ctx.fillText(`[${codeLabel}]`, x, y + size / 2 + 32);

        x += spacingX;
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [groups]);

  return (
    <div className="w-full bg-[#1c1917] rounded-lg shadow-inner overflow-hidden border border-stone-800 relative h-full flex-grow min-h-[500px]">
      <div className="absolute top-4 left-4 text-stone-500 font-mono text-xs z-10 pointer-events-none">
        TOPOLOGICAL MAPPING ACTIVE...
      </div>
      <canvas ref={canvasRef} className="block w-full h-full"></canvas>
    </div>
  );
};

// --- CONCEPT 4: Cybernetic Homeostat Component ---
const CyberneticDashboard = ({ words, text }) => {
  // 1. Legal Decoherence Gauge Calculations
  const factCount = words.filter((w) => [5, 6, 7].includes(w.code)).length;
  const fictionCount = words.filter((w) =>
    [1, 3, 4, 8, 9].includes(w.code),
  ).length;
  const total = factCount + fictionCount;
  const factPercentage =
    total === 0 ? 50 : Math.round((factCount / total) * 100);

  // 2. Feedback Loop: 1-2 (Adverb-Verb) Trap Detection
  const traps = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].code === 1 && words[i + 1].code === 2) {
      traps.push(`"${words[i].original} ${words[i + 1].original}"`);
    }
  }

  // 3. Jurisdictional Flag Validation
  const hasYellowFringe = text.toLowerCase().includes("yellow fringe");
  const hasPastTense = words.some((w) => w.code === 8);
  const isAdmiralty = hasYellowFringe || hasPastTense;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-stone-200 p-6 flex flex-col gap-8 h-full">
      {/* Decoherence Gauge */}
      <div>
        <h3 className="text-lg font-bold text-stone-800 uppercase tracking-wide mb-2">
          Legal Decoherence Gauge
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Ratio of stable facts to fictional modifiers. Homeostasis requires{" "}
          {">"}90% facts.
        </p>
        <div className="relative w-full h-8 bg-rose-100 rounded-full overflow-hidden border border-stone-300">
          <div
            className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-in-out flex items-center justify-end px-2"
            style={{ width: `${factPercentage}%` }}
          >
            {factPercentage > 10 && (
              <span className="text-white text-xs font-bold">
                {factPercentage}%
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs font-bold text-stone-500 mt-2 uppercase">
          <span className="text-rose-600">Vassal / Fiction</span>
          <span className="text-emerald-600">Sovereign / Fact</span>
        </div>
      </div>

      {/* 1-2 Trap Feedback Loop */}
      <div className="p-5 rounded-lg border border-stone-200 bg-stone-50">
        <h3 className="text-lg font-bold text-stone-800 uppercase tracking-wide mb-2">
          Toric Syndrome Measurement
        </h3>
        {traps.length > 0 ? (
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 text-3xl text-amber-500 mt-1">⚠️</div>
            <div>
              <p className="text-amber-800 font-bold mb-1">
                Adverb-Verb (1-2) Trap Detected!
              </p>
              <p className="text-stone-700 text-sm mb-3">
                The biocomputer has detected a "motion modifying a motion" at:{" "}
                <strong>{traps.join(", ")}</strong>. This generates a void
                vacuum.
              </p>
              <div className="bg-white border border-amber-200 p-3 rounded text-sm text-amber-900 font-mono">
                <span className="block font-bold mb-1">
                  {">"} INITIATE CORRECTION PROTOCOL:
                </span>
                Rewrite into a 5-6-7 (Preposition-Article-Noun) closed geometric
                loop.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 text-3xl text-emerald-500">✓</div>
            <p className="text-emerald-800 font-bold">
              No 1-2 Traps detected. Information space is currently stable.
            </p>
          </div>
        )}
      </div>

      {/* Jurisdictional Flag Validation */}
      <div className="p-5 rounded-lg border border-stone-200 bg-stone-50 flex-grow">
        <h3 className="text-lg font-bold text-stone-800 uppercase tracking-wide mb-2">
          Jurisdictional Flag Validation
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Verifying "Law of the Flag" status (Title 4 U.S.C. 1-2-3 dimensions).
        </p>

        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${hasYellowFringe ? "bg-rose-500" : "bg-emerald-500"}`}
            >
              {hasYellowFringe ? "×" : "✓"}
            </div>
            <span className="text-stone-700">
              No "Yellow Fringe" or foreign modifications detected.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${hasPastTense ? "bg-rose-500" : "bg-emerald-500"}`}
            >
              {hasPastTense ? "×" : "✓"}
            </div>
            <span className="text-stone-700">
              No Past-Tense (~8) temporal fictions dragging document out of
              Now-Time.
            </span>
          </li>
        </ul>

        {isAdmiralty ? (
          <div className="bg-rose-100 border border-rose-300 p-4 rounded-lg text-center">
            <h4 className="text-rose-800 font-bold uppercase tracking-wider mb-1">
              Warning: Admiralty / Maritime Void
            </h4>
            <p className="text-rose-700 text-sm">
              The document's jurisdiction has collapsed. You are operating on a
              dead vessel.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-100 border border-emerald-300 p-4 rounded-lg text-center">
            <h4 className="text-emerald-800 font-bold uppercase tracking-wider mb-1">
              Stable: Unity States Drydock Courtroom
            </h4>
            <p className="text-emerald-700 text-sm">
              Jurisdictional plane is secure. Four-cornering of the document is
              intact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [text, setText] = useState(
    "For the bridge is over the river.\n\nI ran fast.",
  );
  const [activeTab, setActiveTab] = useState("mapper"); // 'mapper' | 'dashboard'

  // --- Shared Processed Data ---
  const { words, groups, errorCount } = useMemo(() => {
    if (!text.trim()) return { words: [], groups: [], errorCount: 0 };
    const rawWords = text.trim().split(/\s+/);
    const analyzedWords = rawWords.map(analyzeWord);
    const groups = getGroups(analyzedWords);
    const errorCount = analyzedWords.filter((w) =>
      [1, 3, 4, 8, 9].includes(w.code),
    ).length;

    return { words: analyzedWords, groups, errorCount };
  }, [text]);

  return (
    <div className="bg-stone-100 text-stone-800 font-sans min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">
            Toric Code Lattice Mapper
          </h1>
          <p className="text-lg text-stone-600">
            Visualizing the quantum coherence and topological geometry of your
            syntax.
          </p>
          <div className=" inline-flex gap-4 font-bold">
            <a
              href="https://www.youtube.com/watch?v=RfqxHH5Srxk"
              target="_blank"
            >
              Video by David Wynn Miller
            </a>
            <a
              href="https://docs.urbanodyssey.xyz/quantum/quantum-grammar.html"
              target="_blank"
            >
              Extended Notes
            </a>
            <a href="https://direct.me/officialurban" target="_blank">
              Created by Urban Odyssey /w Help from Gemini
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex border-b border-stone-300">
            <button
              onClick={() => setActiveTab("mapper")}
              className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === "mapper" ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}
            >
              Toric Code Mapper
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === "dashboard" ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}
            >
              Cybernetic Homeostat
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Shared Input */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
              <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase tracking-wide">
                Contract Input
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-4 border border-stone-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none bg-stone-50 font-mono text-base resize-none h-48"
                placeholder="Type your contract..."
              />

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() =>
                    setText(
                      "For the bridge is over the river. For the river is under the bridge.",
                    )
                  }
                  className="w-full py-2 bg-emerald-100 text-emerald-800 font-medium rounded hover:bg-emerald-200 transition-colors"
                >
                  Load Coherent State
                </button>
                <button
                  onClick={() =>
                    setText("I ran fast. They walked past the yellow fringe.")
                  }
                  className="w-full py-2 bg-rose-100 text-rose-800 font-medium rounded hover:bg-rose-200 transition-colors"
                >
                  Load Decoherent Void
                </button>
              </div>
            </div>

            {/* Status Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
              <h3 className="text-sm font-semibold text-stone-700 mb-4 uppercase tracking-wide border-b border-stone-100 pb-2">
                System Status
              </h3>
              {words.length === 0 ? (
                <div className="text-stone-500">Awaiting input...</div>
              ) : errorCount === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-700 font-bold text-lg">
                    Stable Coherence
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-rose-700 font-bold text-lg">
                    Syndrome Detected ({errorCount} Errors)
                  </span>
                </div>
              )}
            </div>

            {/* Contextual Legend (Changes based on tab) */}
            {activeTab === "mapper" && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 text-sm text-stone-600">
                <h3 className="font-semibold text-stone-800 mb-2">
                  Mapper Legend
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-500 bg-emerald-100/50 relative">
                      <div className="absolute bottom-[-3px] right-[-3px] w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span>
                      <strong>Qubit (7):</strong> Stable Noun/Fact edge.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                    <span>
                      <strong>Stabilizer (5,6):</strong> Preposition/Article
                      creating boundary.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Panel: Dynamic Views */}
          <div className="lg:col-span-8 flex flex-col min-h-[500px]">
            {activeTab === "mapper" ? (
              <ToricCanvas groups={groups} />
            ) : (
              <CyberneticDashboard text={text} words={words} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
