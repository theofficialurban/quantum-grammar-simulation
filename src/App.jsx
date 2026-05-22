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
      // If the current group already has a Qubit (7) or an Error/Verb, close it and start a new one
      if (currentGroup.some((x) => [7, 1, 2, 3, 4, 8, 9].includes(x.code))) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(w);
    } else if (w.code === 7) {
      currentGroup.push(w);
      groups.push(currentGroup); // Close the stable loop!
      currentGroup = [];
    } else {
      // Errors or Motions break the loop
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

export default function App() {
  const [text, setText] = useState(
    "For the bridge is over the river.\n\nI ran fast.",
  );
  const canvasRef = useRef(null);

  // --- Process Data ---
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

  // --- Canvas Rendering Loop ---
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

      // Handle high-DPI displays and dynamic height
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

      // Clear Background (The Vacuum)
      ctx.clearRect(0, 0, rect.width, expectedHeight);
      ctx.fillStyle = "#1c1917"; // Stone 900
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

        // Draw Base Cell (Dashed Grid)
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

        // 1. Draw Stabilizers (Blue)
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

        // 2. Draw Qubits (Green)
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

          // Qubit Node
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Fill Plaquette if loop is closed (Stabilizer Active)
        if ((has5 || has6) && has7) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // 4. Draw Motion (Yellow Transition)
        if (isMotion) {
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - size / 2, y);
          ctx.lineTo(x + size / 2, y);
          ctx.stroke();
          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(x + size / 4, y - 6);
          ctx.lineTo(x + size / 2, y);
          ctx.lineTo(x + size / 4, y + 6);
          ctx.stroke();
        }

        // 5. Draw Errors / Decoherence (Flashing Red)
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

        // 6. Draw Connective Path to next Cell
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

        // 7. Labels
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
          <div className="flex-row gap-4 font-bold">
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Input & Diagnostics */}
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
                    setText("I ran fast. They will go to the store.")
                  }
                  className="w-full py-2 bg-rose-100 text-rose-800 font-medium rounded hover:bg-rose-200 transition-colors"
                >
                  Load Decoherent Void
                </button>
              </div>
            </div>

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

            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 text-sm text-stone-600">
              <h3 className="font-semibold text-stone-800 mb-2">Legend</h3>
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
                    creating protective boundary.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-300"></div>
                  <span>
                    <strong>Closed Plaquette:</strong> Geometric sequence of
                    5-6-7.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-rose-500 font-bold text-xl leading-none">
                    ×
                  </div>
                  <span>
                    <strong>Decoherence (1,3,4,8,9):</strong> Fiction triggering
                    an error syndrome.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: The Interactive Toric Code Canvas */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="w-full bg-[#1c1917] rounded-lg shadow-inner overflow-hidden border border-stone-800 relative">
              <div className="absolute top-4 left-4 text-stone-500 font-mono text-xs z-10 pointer-events-none">
                TOPOLOGICAL MAPPING ACTIVE...
              </div>
              <canvas ref={canvasRef} className="block w-full"></canvas>
            </div>
            <p className="text-sm text-stone-500 mt-3 text-center">
              The Goal: Edit the contract until the entire grid is a stable,
              closed-loop network of 5-6-7 geometries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
