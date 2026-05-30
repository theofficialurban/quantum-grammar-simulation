import { useState, useEffect, useRef, useMemo } from "react";

// --- Core Logic: Quantum Grammar Lexicon Analyzer ---
function analyzeWord(word, index) {
  const cleanWord = word.replace(/[.,!?]/g, "").toLowerCase();
  let code = 7; // Default to Fact/Noun
  let type = "Fact/Noun";
  let colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";

  if (/^(and|or)$/.test(cleanWord)) {
    code = 0;
    type = "Conjunction";
    colorClass = "text-stone-500 bg-stone-100 border-stone-300";
  } else if (/^(is|are)$/.test(cleanWord)) {
    code = 2;
    type = "Verb";
    colorClass = "text-sky-700 bg-sky-50 border-sky-300";
  } else if (/^(good|bad|red|blue|true|false|any|all|every)$/.test(cleanWord)) {
    code = 3;
    type = "Adjective";
    colorClass = "text-amber-700 bg-amber-50 border-amber-300";
  } else if (/^(i|you|he|she|it|we|they|me|him|her|us|them)$/.test(cleanWord)) {
    code = 4;
    type = "Pronoun";
    colorClass = "text-rose-700 bg-rose-50 border-rose-300";
  } else if (/^(for|by|with|of|in|on|at|over|under|through)$/.test(cleanWord)) {
    code = 5;
    type = "Position";
    colorClass = "text-indigo-700 bg-indigo-50 border-indigo-300";
  } else if (/^(the|a|an|this|these|that|those)$/.test(cleanWord)) {
    code = 6;
    type = "Lodio";
    colorClass = "text-indigo-700 bg-indigo-50 border-indigo-300";
  } else if (/ed$/.test(cleanWord) || cleanWord === "from") {
    code = 8;
    type = "Past-Tense";
    colorClass = "text-rose-700 bg-rose-50 border-rose-300";
  } else if (/^(to|shall|will|pre.*|pro.*)$/.test(cleanWord)) {
    code = 9;
    type = "Future-Tense";
    colorClass = "text-rose-700 bg-rose-50 border-rose-300";
  } else if (
    /ly$/.test(cleanWord) ||
    cleanWord === "fast" ||
    cleanWord === "very"
  ) {
    code = 1;
    type = "Adverb";
    colorClass = "text-rose-700 bg-rose-50 border-rose-300";
  }

  return {
    original: word,
    code,
    type,
    cleanWord,
    colorClass,
    absoluteIndex: index,
  };
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

// --- FEATURE 2: Bi-Directional Interactive Canvas Component ---
const ToricCanvas = ({ groups, hoveredGroupIndex, setHoveredGroupIndex }) => {
  const canvasRef = useRef(null);
  const boundsRef = useRef([]); // Stores geometric bounds for hover detection

  // Hover detection logic
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundIndex = null;
    for (const bound of boundsRef.current) {
      // Check if mouse is within the bounding box of the group
      if (
        mouseX >= bound.x - bound.size / 2 - 20 &&
        mouseX <= bound.x + bound.size / 2 + 20 &&
        mouseY >= bound.y - bound.size / 2 - 20 &&
        mouseY <= bound.y + bound.size / 2 + 40
      ) {
        foundIndex = bound.index;
        break;
      }
    }

    if (foundIndex !== hoveredGroupIndex) {
      setHoveredGroupIndex(foundIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoveredGroupIndex(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const spacingX = 140;
    const spacingY = 130;

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

      const newBounds = [];

      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      groups.forEach((group, index) => {
        if (x + spacingX > rect.width - 20) {
          x = 80;
          y += spacingY;
        }

        // Store bounds for mouse picking
        newBounds.push({ x, y, size, index });

        // Highlight Aura if Hovered
        if (hoveredGroupIndex === index) {
          ctx.fillStyle = "rgba(250, 204, 21, 0.15)";
          ctx.beginPath();
          ctx.roundRect(
            x - size / 2 - 15,
            y - size / 2 - 15,
            size + 30,
            size + 55,
            10,
          );
          ctx.fill();
          ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
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
          ctx.strokeStyle = "#6366f1"; // Indigo
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y - size / 2);
          ctx.lineTo(x + size / 2, y - size / 2);
          ctx.stroke();
        }
        if (has6) {
          ctx.strokeStyle = "#6366f1"; // Indigo
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y - size / 2);
          ctx.lineTo(x - size / 2, y + size / 2);
          ctx.stroke();
        }

        if (has7) {
          ctx.strokeStyle = "#10b981"; // Emerald
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
          ctx.strokeStyle = "#0ea5e9"; // Sky blue
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
          ctx.fillStyle = `rgba(244, 63, 94, ${0.1 + pulse * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, size / 2 + pulse * 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#f43f5e"; // Rose
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

      boundsRef.current = newBounds;
      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [groups, hoveredGroupIndex]);

  return (
    <div className="w-full bg-[#1c1917] rounded-lg shadow-inner overflow-hidden border border-stone-800 relative h-full flex-grow min-h-[500px]">
      <div className="absolute top-4 left-4 text-stone-500 font-mono text-xs z-10 pointer-events-none">
        TOPOLOGICAL MAPPING ACTIVE...
      </div>

      {/* Tooltip Overlay */}
      {hoveredGroupIndex !== null && groups[hoveredGroupIndex] && (
        <div className="absolute bottom-4 left-4 right-4 bg-stone-900/90 text-stone-200 p-3 rounded border border-amber-500/50 text-sm font-mono backdrop-blur shadow-lg pointer-events-none transition-opacity">
          <span className="text-amber-400 font-bold uppercase block mb-1">
            Quantum Inspector:
          </span>
          Group Syntax:{" "}
          {groups[hoveredGroupIndex]
            .map((w) => `[${w.code}] ${w.original}`)
            .join(" + ")}
          <br />
          Status:{" "}
          {groups[hoveredGroupIndex].some((w) =>
            [1, 3, 4, 8, 9].includes(w.code),
          ) ? (
            <span className="text-rose-400">
              Decoherence Syndrome Detected. Breaks geometric loop.
            </span>
          ) : (
            <span className="text-emerald-400">
              Stable Plaquette. Quantum loop closed.
            </span>
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block w-full h-full cursor-crosshair"
      ></canvas>
    </div>
  );
};

// --- CONCEPT 4 & 5: Cybernetic Homeostat Component ---
const CyberneticDashboard = ({ words, text, handleAutoFix }) => {
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
      traps.push({
        index: i,
        str: `${words[i].original} ${words[i + 1].original}`,
      });
    } else if (words[i].code === 2 && words[i + 1].code === 1) {
      // Also catch Verb-Adverb
      traps.push({
        index: i,
        str: `${words[i].original} ${words[i + 1].original}`,
      });
    }
  }

  // 3. Jurisdictional Flag Validation
  const hasYellowFringe = text.toLowerCase().includes("yellow fringe");
  const hasPastTense = words.some((w) => w.code === 8);
  const isAdmiralty = hasYellowFringe || hasPastTense;

  // 4. Time-Reversal Symmetry Math
  const codes = words.map((w) => w.code);
  const reversedCodes = [...codes].reverse();

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-stone-200 p-6 flex flex-col gap-8 h-full overflow-y-auto max-h-[800px]">
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

      {/* FEATURE 5: Time-Reversal Symmetry (Palindrome) Visualizer */}
      <div className="p-5 rounded-lg border border-stone-200 bg-stone-50">
        <h3 className="text-lg font-bold text-stone-800 uppercase tracking-wide mb-2">
          Time-Reversal Symmetry Check
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          A valid quantum contract must read the same mathematically forwards
          and backwards.
        </p>

        {codes.length === 0 ? (
          <div className="text-stone-400 italic">Waiting for input...</div>
        ) : (
          <div className="flex overflow-x-auto pb-4 gap-1 hide-scrollbar">
            {codes.map((code, i) => {
              const isMatch = code === reversedCodes[i];
              return (
                <div
                  key={i}
                  className="flex flex-col items-center min-w-[30px]"
                >
                  {/* Forward Code */}
                  <div className="w-8 h-8 flex items-center justify-center bg-white border border-stone-300 rounded shadow-sm text-sm font-bold text-stone-700">
                    {code}
                  </div>

                  {/* Connector Line */}
                  <div className="h-6 flex items-center justify-center">
                    {isMatch ? (
                      <div className="w-1 h-full bg-emerald-400"></div>
                    ) : (
                      <div className="text-rose-500 font-bold leading-none text-xs">
                        ×
                      </div>
                    )}
                  </div>

                  {/* Reversed Code */}
                  <div className="w-8 h-8 flex items-center justify-center bg-white border border-stone-300 rounded shadow-sm text-sm font-bold text-stone-700">
                    {reversedCodes[i]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <>
          {codes.length > 0 && codes.join("") === reversedCodes.join("") ? (
            <p className="text-emerald-700 font-bold text-sm mt-2 flex items-center gap-2">
              <span>✓</span> Equation is perfectly balanced.
            </p>
          ) : codes.length > 0 ? (
            <p className="text-rose-700 font-bold text-sm mt-2 flex items-center gap-2">
              <span>×</span> Asymmetry detected. Contract decoheres in time
              reversal.
            </p>
          ) : (
            <p className="text-rose-700 font-bold text-sm mt-2 flex items-center gap-2">
              <span>×</span> Asymmetry detected. Contract decoheres in time
              reversal.
            </p>
          )}
        </>
      </div>

      {/* FEATURE 4: Actionable Correction Protocol (1-2 Traps) */}
      <div className="p-5 rounded-lg border border-stone-200 bg-stone-50">
        <h3 className="text-lg font-bold text-stone-800 uppercase tracking-wide mb-2">
          Toric Syndrome Measurement
        </h3>
        {traps.length > 0 ? (
          <div className="flex flex-col gap-4">
            {traps.map((trap, idx) => (
              <div
                key={idx}
                className="flex gap-4 items-start border-l-4 border-amber-500 pl-4 py-2 bg-white shadow-sm rounded-r"
              >
                <div className="flex-shrink-0 text-2xl text-amber-500 mt-1">
                  ⚠️
                </div>
                <div className="flex-grow">
                  <p className="text-amber-800 font-bold mb-1">
                    Adverb/Verb Trap Detected!
                  </p>
                  <p className="text-stone-700 text-sm mb-3">
                    Motion modifying a motion at:{" "}
                    <strong className="bg-amber-100 px-1">{trap.str}</strong>.
                    Generates a void vacuum.
                  </p>
                  <button
                    onClick={() => handleAutoFix(trap.str, "for the motion")}
                    className="text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded shadow-sm transition-colors"
                  >
                    Initiate 5-6-7 Correction Protocol
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 items-center bg-white p-4 rounded shadow-sm">
            <div className="flex-shrink-0 text-2xl text-emerald-500">✓</div>
            <p className="text-emerald-800 font-bold text-sm">
              No 1-2 Traps detected. Information space is stable.
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
            <span className="text-stone-700 text-sm font-medium">
              No "Yellow Fringe" or foreign modifications detected.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${hasPastTense ? "bg-rose-500" : "bg-emerald-500"}`}
            >
              {hasPastTense ? "×" : "✓"}
            </div>
            <span className="text-stone-700 text-sm font-medium">
              No Past-Tense (~8) temporal fictions.
            </span>
          </li>
        </ul>

        {isAdmiralty ? (
          <div className="bg-rose-100 border border-rose-300 p-4 rounded-lg text-center shadow-sm">
            <h4 className="text-rose-800 font-bold uppercase tracking-wider mb-1">
              Warning: Admiralty / Maritime Void
            </h4>
            <p className="text-rose-700 text-sm">
              The document's jurisdiction has collapsed. You are operating on a
              dead vessel.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-100 border border-emerald-300 p-4 rounded-lg text-center shadow-sm">
            <h4 className="text-emerald-800 font-bold uppercase tracking-wider mb-1">
              Stable: Unity States Drydock Courtroom
            </h4>
            <p className="text-emerald-700 text-sm">
              Jurisdictional plane is secure. Four-cornering intact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [text, setText] = useState(
    "For the bridge is over the river.\n\nI ran fast.",
  );
  const [activeTab, setActiveTab] = useState("mapper"); // 'mapper' | 'dashboard'
  const [hoveredGroupIndex, setHoveredGroupIndex] = useState(null);

  // --- Shared Processed Data ---
  const { words, groups, errorCount } = useMemo(() => {
    if (!text.trim()) return { words: [], groups: [], errorCount: 0 };
    const rawWords = text.trim().split(/\s+/);
    const analyzedWords = rawWords.map((w, i) => analyzeWord(w, i));
    const groups = getGroups(analyzedWords);
    const errorCount = analyzedWords.filter((w) =>
      [1, 3, 4, 8, 9].includes(w.code),
    ).length;

    return { words: analyzedWords, groups, errorCount };
  }, [text]);

  // FEATURE 4: Auto-fix handler passed to Dashboard
  const handleAutoFix = (badString, replacement) => {
    // Basic string replacement for demo purposes.
    // Replaces the first exact occurrence of the offending 1-2 trap.
    setText((prev) => prev.replace(badString, replacement));
  };

  return (
    <div className="bg-stone-200 text-stone-800 font-sans min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">
            Quantum Grammar Operating System
          </h1>
          <p className="text-lg text-stone-600">
            Visualizing and auditing the cybernetic coherence of your syntax.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 font-bold text-sm">
            <a
              href="https://www.youtube.com/watch?v=RfqxHH5Srxk"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Video by David Wynn Miller
            </a>
            <span className="text-stone-400">|</span>
            <a
              href="https://docs.urbanodyssey.xyz/quantum/quantum-grammar.html"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Extended Notes
            </a>
            <span className="text-stone-400">|</span>
            <a
              href="https://direct.me/officialurban"
              className="text-blue-600 hover:text-blue-800 transition"
              target="_blank"
            >
              Created by Urban Odyssey /w Help from Gemini
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex border-b border-stone-300">
            <button
              onClick={() => setActiveTab("mapper")}
              className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === "mapper" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}
            >
              Toric Code Mapper
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === "dashboard" ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}
            >
              Cybernetic Homeostat
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Input & Real-Time Equation Bridge */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
              <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase tracking-wide">
                Contract Input
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-4 border border-stone-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none bg-stone-50 font-mono text-base resize-none h-32 shadow-inner"
                placeholder="Type your contract..."
              />

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() =>
                    setText(
                      "For the bridge is over the river. For the river is under the bridge.",
                    )
                  }
                  className="w-full py-2 bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider rounded hover:bg-emerald-200 transition-colors"
                >
                  Load Coherent State
                </button>
                <button
                  onClick={() =>
                    setText("I ran fast. They walked past the yellow fringe.")
                  }
                  className="w-full py-2 bg-rose-100 text-rose-800 font-bold text-xs uppercase tracking-wider rounded hover:bg-rose-200 transition-colors"
                >
                  Load Decoherent Void
                </button>
              </div>
            </div>

            {/* FEATURE 1 & 3: The Equation Strip (Visual Bridge) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 flex-grow flex flex-col">
              <h3 className="text-sm font-semibold text-stone-700 mb-2 uppercase tracking-wide border-b border-stone-100 pb-2">
                Live Syntax Equation
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Hover over terms below to inspect topological groups on the
                canvas.
              </p>

              <div className="flex flex-wrap gap-y-3 gap-x-1 font-mono text-sm leading-relaxed overflow-y-auto max-h-[300px]">
                {groups.length === 0 ? (
                  <span className="text-stone-400 italic">
                    Equation empty...
                  </span>
                ) : (
                  groups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className={`flex flex-wrap gap-1 items-center p-1 rounded transition-colors cursor-pointer border ${hoveredGroupIndex === gIdx ? "bg-amber-100 border-amber-400 shadow-sm" : "border-transparent hover:bg-stone-100"}`}
                      onMouseEnter={() => setHoveredGroupIndex(gIdx)}
                      onMouseLeave={() => setHoveredGroupIndex(null)}
                    >
                      {group.map((w, wIdx) => (
                        <div
                          key={wIdx}
                          className="flex items-center gap-1 group relative"
                        >
                          {/* Add Plus/Equals operator between words for Equation feel */}
                          {wIdx > 0 && (
                            <span className="text-stone-400 font-bold text-xs">
                              {w.code === 2 ? "=" : "+"}
                            </span>
                          )}

                          <span
                            className={`px-2 py-1 rounded border shadow-sm ${w.colorClass} flex items-center gap-1`}
                          >
                            <span className="font-bold opacity-60">
                              [{w.code}]
                            </span>
                            <span>{w.original}</span>
                          </span>

                          {/* Interactive Tooltip Overlay on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs bg-stone-900 text-stone-100 text-xs p-2 rounded shadow-xl z-50 pointer-events-none">
                            <strong>
                              ~{w.code}: {w.type}
                            </strong>
                            <br />
                            {[1, 3, 4, 8, 9].includes(w.code)
                              ? "⚠️ Fictional modifier. Breaks Now-Time."
                              : "✓ Stable mathematical placement."}
                          </div>
                        </div>
                      ))}
                      {/* Operator between Groups */}
                      {gIdx < groups.length - 1 && (
                        <span className="text-stone-400 font-bold mx-1">➜</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Contextual Legend */}
            {activeTab === "mapper" && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 text-sm text-stone-600">
                <h3 className="font-semibold text-stone-800 mb-2">
                  Topology Legend
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
                    <div className="w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
                    <span>
                      <strong>Stabilizer (5,6):</strong> Protection boundary.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="text-rose-500 font-bold text-xl leading-none">
                      ×
                    </div>
                    <span>
                      <strong>Decoherence:</strong> Fiction causing syndrome.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Panel: Dynamic Views */}
          <div className="lg:col-span-8 flex flex-col min-h-[500px]">
            {activeTab === "mapper" ? (
              <ToricCanvas
                groups={groups}
                hoveredGroupIndex={hoveredGroupIndex}
                setHoveredGroupIndex={setHoveredGroupIndex}
              />
            ) : (
              <CyberneticDashboard
                text={text}
                words={words}
                handleAutoFix={handleAutoFix}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
