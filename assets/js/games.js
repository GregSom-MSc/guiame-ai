/* ============================================================
   games.js — Guíame.ai · Quiz + tile-swap puzzle
   Two independent mini-games behind one picker. No frameworks,
   no drag-and-drop (click-to-select / click-to-swap instead —
   works identically on mouse and touch).
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  /* ── Shared: game picker ── */
  const gamesHero = document.querySelector(".games-hero");
  const quizPanel = document.getElementById("quizPanel");
  const puzzlePanel = document.getElementById("puzzlePanel");

  function showPicker() {
    gamesHero.style.display = "";
    quizPanel.classList.remove("active");
    puzzlePanel.classList.remove("active");
  }

  function showPanel(panel) {
    gamesHero.style.display = "none";
    quizPanel.classList.remove("active");
    puzzlePanel.classList.remove("active");
    panel.classList.add("active");
  }

  document.getElementById("pickQuiz").addEventListener("click", () => {
    showPanel(quizPanel);
    resetQuiz();
  });
  document.getElementById("pickPuzzle").addEventListener("click", () => {
    showPanel(puzzlePanel);
    resetPuzzleToImageStep();
  });
  document.getElementById("quizBack").addEventListener("click", showPicker);
  document.getElementById("puzzleBack").addEventListener("click", showPicker);

  function showStep(panel, stepId) {
    panel.querySelectorAll(".game-step").forEach((el) => {
      el.classList.toggle("active", el.id === stepId);
    });
  }

  /* ════════════════════ QUIZ ════════════════════
     Full question bank per level (from TA Scotland trivia content).
     Each playthrough: the guide question, always first, plus 10
     questions chosen at random from that level's 17 — both which 10
     and their order reshuffle every time, so replaying doesn't repeat
     the same quiz. */
  const GUIDE_QUESTION = {
    q: "¿Cuál es el nombre de tu guía?",
    options: ["Roberto", "MacAlpin", "William", "Samuel"],
    correct: 3,
  };

  const QUIZ_DATA = {
    facil: [
      {
        q: "¿Cómo se llama la vaca escocesa de pelo largo y cuernos grandes, muy fotografiada por los turistas?",
        options: ["Highland Cow", "Vaca Holstein", "Vaca Jersey", "Vaca Charolesa"],
        correct: 0,
      },
      {
        q: "¿Cuál es el animal nacional de Escocia?",
        options: ["El unicornio", "El león", "El águila", "El ciervo"],
        correct: 0,
      },
      {
        q: 'En scots, ¿qué significa la palabra "bairn"?',
        options: ["Niño", "Perro", "Casa", "Comida"],
        correct: 0,
      },
      {
        q: "¿Cómo se llama el famoso monstruo que, según la leyenda, vive en el Lago Ness?",
        options: ["Nessie", "Morag", "Kelpie", "Selkie"],
        correct: 0,
      },
      {
        q: "¿Cómo se llaman las gigantescas esculturas de caballos de acero cerca de Falkirk?",
        options: ["The Kelpies", "The Angels", "The Kings", "The Kilts"],
        correct: 0,
      },
      {
        q: "¿Cuál es el lago más grande de Gran Bretaña por superficie?",
        options: ["Loch Lomond", "Loch Ness", "Loch Katrine", "Loch Awe"],
        correct: 0,
      },
      {
        q: 'En scots, ¿qué significa la palabra "lassie"?',
        options: ["Chica", "Perro", "Montaña", "Río"],
        correct: 0,
      },
      {
        q: 'En scots, ¿qué significa la palabra "wee"?',
        options: ["Pequeño", "Grande", "Rápido", "Frío"],
        correct: 0,
      },
      {
        q: "En los Juegos de las Tierras Altas (Highland Games), ¿qué objeto de madera lanzan los atletas?",
        options: ["El caber (tronco)", "Una piedra", "Un martillo", "Una lanza"],
        correct: 0,
      },
      {
        q: '¿Por qué a la vaca Belted Galloway le dicen "vaca Oreo"?',
        options: [
          "Por su franja blanca en medio del cuerpo negro",
          "Por su color café",
          "Por sus cuernos curvos",
          "Por su pelo rizado",
        ],
        correct: 0,
      },
      {
        q: "¿Qué come principalmente la oveja North Ronaldsay en invierno?",
        options: ["Algas marinas", "Pasto de montaña", "Heno", "Maíz"],
        correct: 0,
      },
      {
        q: '¿Qué escritor escocés escribió el poema "La dama del lago" (The Lady of the Lake)?',
        options: ["Walter Scott", "Robert Burns", "Robert Louis Stevenson", "Arthur Conan Doyle"],
        correct: 0,
      },
      {
        q: "¿Cómo se llama la bandera de Escocia, con una cruz blanca en diagonal sobre fondo azul?",
        options: ["El Saltire", "El Union Jack", "El Tricolor", "La Cruz Roja"],
        correct: 0,
      },
      {
        q: "¿Cuál es el lago más profundo del Reino Unido?",
        options: ["Loch Morar", "Loch Ness", "Loch Lomond", "Loch Tay"],
        correct: 0,
      },
      {
        q: '¿Qué es una "kirk" en Escocia?',
        options: ["Una iglesia", "Una taberna", "Una granja", "Una montaña"],
        correct: 0,
      },
      {
        q: "¿Cuáles son los animales favoritos de Escocia?",
        options: [
          "Hadas, vacas peludas, Haggis, Bru el capybara",
          "Haggis, Unicornio, Nessie, Kelpies",
          "Vacas Peludas, Gatos Salvaje, Unicornio, Ciervo blanco",
          "Ciervo Blanco, Vacas Peludas, Nessie, Nutria",
        ],
        correct: 1,
      },
      {
        q: "¿Qué rey murió al caer de su caballo?",
        options: ["Kenneth MacAlpin", "El rey Kentigern", "David I", "Alejandro III"],
        correct: 3,
      },
    ],
    intermedio: [
      {
        q: "¿Qué rey unificó a pictos y escotos bajo el reino de Alba en el siglo IX?",
        options: ["Kenneth MacAlpin", "Macbeth", "Malcolm III", "Alexander III"],
        correct: 0,
      },
      {
        q: "¿Para qué se usaba tradicionalmente la Piedra del Destino (Stone of Destiny)?",
        options: [
          "Para coronar a los reyes escoceses",
          "Para sellar tratados",
          "Para enterrar a los nobles",
          "Para celebrar bodas reales",
        ],
        correct: 0,
      },
      {
        q: "¿Quién diseñó el Canal Caledonio, que conecta el Lago Ness con el mar?",
        options: ["Thomas Telford", "Robert Adam", "William Chambers", "Andy Scott"],
        correct: 0,
      },
      {
        q: "¿En qué año fue derrotado y muerto el rey Duncan I a manos de Macbeth?",
        options: ["1040", "1057", "1093", "1286"],
        correct: 0,
      },
      {
        q: "La tradición sitúa la boda de Malcolm III y Margarita de Escocia en Dunfermline. ¿En qué año?",
        options: ["1068", "1040", "1124", "1286"],
        correct: 0,
      },
      {
        q: "¿De qué país llegó el gaélico escocés hace más de mil años?",
        options: ["Irlanda", "Gales", "Noruega", "Francia"],
        correct: 0,
      },
      {
        q: "¿Qué idioma germánico, hermano del inglés (no un dialecto), se habla en las Lowlands escocesas?",
        options: ["Scots", "Gaélico", "Galés", "Córnico"],
        correct: 0,
      },
      {
        q: "Según la leyenda de la Casa de los Binns, ¿con quién jugó a las cartas Tam Dalyell?",
        options: ["Con el diablo", "Con un fantasma", "Con un rey", "Con un vecino"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿qué porcentaje de las reservas de petróleo crudo del Reino Unido se encuentra en aguas escocesas?",
        options: ["94%", "50%", "25%", "75%"],
        correct: 0,
      },
      {
        q: "¿Cuál de estos muros romanos marcaba aproximadamente la frontera entre las actuales Lowlands y Highlands?",
        options: ["El Muro Antonino", "El Muro de Adriano", "La Muralla China", "El Muro de Berlín"],
        correct: 0,
      },
      {
        q: "¿Cuál es la región escocesa conocida como la cuna del whisky de malta, con más de la mitad de las destilerías del país?",
        options: ["Speyside", "Islay", "Campbeltown", "Lowlands"],
        correct: 0,
      },
      {
        q: "¿Qué rey escocés derrotó la influencia noruega en la Batalla de Largs?",
        options: ["Alexander III", "Kenneth MacAlpin", "Malcolm III", "David I"],
        correct: 0,
      },
      {
        q: "Además del monstruo del Lago Ness, ¿cómo se llama el monstruo menos famoso del Loch Morar?",
        options: ["Morag", "Nessie", "Kelpie", "Selkie"],
        correct: 0,
      },
      {
        q: "¿Cuál es la montaña más alta del Reino Unido?",
        options: ["Ben Nevis", "Ben Lomond", "Ben Venue", "Ben A'an"],
        correct: 0,
      },
      {
        q: "¿Qué rey trajo reformas feudales de raíz anglonormanda y expandió el reino tras la muerte de su padre Malcolm III?",
        options: ["David I", "William el León", "Alexander II", "Malcolm IV"],
        correct: 0,
      },
      {
        q: "¿Cuáles son los animales favoritos de Escocia?",
        options: [
          "Hadas, vacas peludas, Haggis, Bru el capybara",
          "Haggis, Unicornio, Nessie, Kelpies",
          "Vacas Peludas, Gatos Salvaje, Unicornio, Ciervo blanco",
          "Ciervo Blanco, Vacas Peludas, Nessie, Nutria",
        ],
        correct: 1,
      },
      {
        q: "¿Qué rey murió al caer de su caballo?",
        options: ["Kenneth MacAlpin", "El rey Kentigern", "David I", "Alejandro III"],
        correct: 3,
      },
    ],
    avanzado: [
      {
        q: "¿En qué año fue derrotado y muerto Duncan I en la Batalla de Pitgaveny?",
        options: ["1040", "1057", "1093", "1249"],
        correct: 0,
      },
      {
        q: "¿En qué año derrotó Malcolm III a Macbeth en la Batalla de Lumphanan?",
        options: ["1057", "1040", "1093", "1124"],
        correct: 0,
      },
      {
        q: "¿En qué año murió el rey Alexander III tras caer de su caballo cerca de Kinghorn?",
        options: ["1286", "1263", "1214", "1153"],
        correct: 0,
      },
      {
        q: "¿En qué año se libró la Batalla de Largs, que llevó al control escocés de las Hébridas?",
        options: ["1263", "1286", "1057", "1124"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿cuántas vacas Highland reproductoras registradas existen hoy en el Reino Unido?",
        options: ["Entre 3,000 y 6,000", "Entre 50,000 y 60,000", "Más de 500,000", "Menos de 500"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿qué proporción de los terneros de carne nacidos en Gran Bretaña son hijos de un toro Aberdeen Angus?",
        options: ["1 de cada 5", "1 de cada 2", "1 de cada 20", "1 de cada 100"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿cuántas centrales hidroeléctricas operan en las Highlands escocesas?",
        options: ["Más de 80", "Menos de 10", "Alrededor de 500", "Exactamente 25"],
        correct: 0,
      },
      {
        q: "¿Qué porcentaje del territorio de Escocia se dedica a la agricultura?",
        options: ["65%", "30%", "90%", "45%"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿cuántas toneladas de cebada produce Escocia al año?",
        options: ["Cerca de 2 millones", "Cerca de 200,000", "Cerca de 20 millones", "Cerca de 500,000"],
        correct: 0,
      },
      {
        q: "¿Qué porcentaje del área de siembra de patata de semilla de Gran Bretaña está en Escocia?",
        options: ["75%", "25%", "50%", "10%"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿cuánto valen las exportaciones anuales de whisky escocés?",
        options: [
          "Más de 5,400 millones de libras",
          "Cerca de 500 millones de libras",
          "Más de 50,000 millones de libras",
          "Cerca de 1,000 millones de libras",
        ],
        correct: 0,
      },
      {
        q: "¿En qué año ordenó Felipe II de España trasladar los restos de Malcolm III y Margarita a El Escorial?",
        options: ["1580", "1093", "1286", "1707"],
        correct: 0,
      },
      {
        q: "Según el censo de 2022, ¿cuántas personas en Escocia reportaron tener alguna habilidad en gaélico?",
        options: ["Cerca de 130,000", "Cerca de 13,000", "Cerca de 1.3 millones", "Cerca de 500,000"],
        correct: 0,
      },
      {
        q: "Aproximadamente, ¿cuántas ovejas hay en Escocia?",
        options: ["Cerca de 7 millones", "Cerca de 700,000", "Cerca de 70 millones", "Cerca de 17 millones"],
        correct: 0,
      },
      {
        q: '¿En qué año se registra por primera vez el uso del nombre "Scottis" (scots) para el idioma, reemplazando a "Inglis"?',
        options: ["1494", "1124", "1707", "1286"],
        correct: 0,
      },
      {
        q: "¿Cuáles son los animales favoritos de Escocia?",
        options: [
          "Hadas, vacas peludas, Haggis, Bru el capybara",
          "Haggis, Unicornio, Nessie, Kelpies",
          "Vacas Peludas, Gatos Salvaje, Unicornio, Ciervo blanco",
          "Ciervo Blanco, Vacas Peludas, Nessie, Nutria",
        ],
        correct: 1,
      },
      {
        q: "¿Qué rey murió al caer de su caballo?",
        options: ["Kenneth MacAlpin", "El rey Kentigern", "David I", "Alejandro III"],
        correct: 3,
      },
    ],
  };
  const LETTERS = ["A", "B", "C", "D"];
  const QUESTIONS_PER_PLAY = 10;

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Shuffle a question's own answer options (and recompute which
     shuffled position is now correct) — otherwise the correct answer
     would always land in the same spot every time that question shows
     up, across any playthrough. */
  function shuffleOptions(item) {
    const pairs = item.options.map((text, i) => ({
      text,
      isCorrect: i === item.correct,
    }));
    const shuffled = shuffleArray(pairs);
    return {
      q: item.q,
      options: shuffled.map((p) => p.text),
      correct: shuffled.findIndex((p) => p.isCorrect),
    };
  }

  let quizLevel = null;
  let quizSession = []; // this playthrough's questions: [guide question, ...10 random]
  let quizIndex = 0;
  let quizScore = 0;

  const quizProgress = document.getElementById("quizProgress");
  const quizQuestionText = document.getElementById("quizQuestionText");
  const quizOptions = document.getElementById("quizOptions");
  const quizNext = document.getElementById("quizNext");

  function resetQuiz() {
    quizLevel = null;
    showStep(quizPanel, "quizStepDifficulty");
  }

  quizPanel.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      quizLevel = btn.dataset.level;
      const randomTen = shuffleArray(QUIZ_DATA[quizLevel]).slice(
        0,
        QUESTIONS_PER_PLAY,
      );
      quizSession = [GUIDE_QUESTION, ...randomTen];
      quizIndex = 0;
      quizScore = 0;
      showStep(quizPanel, "quizStepQuestion");
      renderQuestion();
    });
  });

  function renderQuestion() {
    const item = shuffleOptions(quizSession[quizIndex]);

    quizProgress.textContent = `Pregunta ${quizIndex + 1} de ${quizSession.length}`;
    quizQuestionText.textContent = item.q;
    quizOptions.innerHTML = "";
    quizNext.classList.remove("active");

    item.options.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.innerHTML = `<span class="quiz-option-letter">${LETTERS[i]}</span><span>${text}</span><span class="quiz-option-icon"></span>`;
      btn.addEventListener("click", () => selectAnswer(i, item.correct, btn));
      quizOptions.appendChild(btn);
    });
  }

  const CHECK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  const X_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function selectAnswer(chosenIndex, correctIndex, chosenBtn) {
    const buttons = Array.from(quizOptions.children);
    buttons.forEach((b) => (b.disabled = true));

    const correctBtn = buttons[correctIndex];
    correctBtn.classList.add("correct");
    correctBtn.querySelector(".quiz-option-icon").innerHTML = CHECK_ICON;

    if (chosenIndex !== correctIndex) {
      chosenBtn.classList.add("incorrect");
      chosenBtn.querySelector(".quiz-option-icon").innerHTML = X_ICON;
    } else {
      quizScore++;
    }

    if (window.clarity) {
      clarity("event", "quiz_answer", {
        level: quizLevel,
        correct: chosenIndex === correctIndex,
      });
    }

    quizNext.classList.add("active");
  }

  quizNext.addEventListener("click", () => {
    quizIndex++;
    if (quizIndex < quizSession.length) {
      renderQuestion();
    } else {
      showScore();
    }
  });

  function showScore() {
    const total = quizSession.length;
    document.getElementById("quizScoreNumber").textContent =
      `${quizScore} / ${total}`;
    document.getElementById("quizScoreLabel").textContent =
      "respuestas correctas";

    const moodGif = document.getElementById("quizMoodGif");
    if (quizScore <= 6) {
      moodGif.src = "assets/img/sad.gif";
      moodGif.alt = "Sigue practicando";
    } else {
      moodGif.src = "assets/img/happy.gif";
      moodGif.alt = "¡Bien hecho!";
    }

    showStep(quizPanel, "quizStepScore");
  }

  document
    .getElementById("quizPlayAgain")
    .addEventListener("click", resetQuiz);

  /* ════════════════════ PUZZLE ════════════════════ */
  const PUZZLE_IMAGES = [
    {
      src: "assets/img/caltonhill.jpg",
      title: "Calton Hill",
      caption:
        "Uno de los mejores miradores de Edinburgh, coronado por monumentos que parecen sacados de Atenas.",
    },
    {
      src: "assets/img/L1-06.jpeg",
      title: "Tower Bridge, Londres",
      caption:
        "Si tu viaje sigue hasta Londres, este puente es parada obligada junto al Támesis.",
    },
    {
      src: "assets/img/meadowsCherries.jpg",
      title: "The Meadows",
      caption:
        "Cerezos en flor en uno de los parques más queridos por los locales.",
    },
    {
      src: "assets/img/newtown2.jpg",
      title: "New Town",
      caption:
        "Las calles georgianas más elegantes de Edinburgh, ideales para pasear sin prisa.",
    },
    {
      src: "assets/img/CastleView.jpg",
      title: "Edinburgh Castle",
      caption:
        "La postal más icónica de la ciudad, vigilando desde lo alto de Castle Rock.",
    },
    {
      src: "assets/img/coo.jpg",
      title: "Highland Coo",
      caption:
        "La vaca peluda más fotografiada de Escocia — imposible no sonreírle.",
    },
  ];

  let puzzleImage = null;
  let puzzleSize = 3; // grid is puzzleSize × puzzleSize
  let puzzlePieces = []; // puzzlePieces[slotIndex] = homeIndex currently sitting there
  let puzzleSelectedSlot = null;
  let puzzleMoves = 0;

  const puzzleImageGrid = document.getElementById("puzzleImageGrid");
  const puzzleBoard = document.getElementById("puzzleBoard");
  const puzzleWin = document.getElementById("puzzleWin");
  const puzzleMoveCount = document.getElementById("puzzleMoveCount");

  function resetPuzzleToImageStep() {
    renderImageGrid();
    showStep(puzzlePanel, "puzzleStepImage");
  }

  function renderImageGrid() {
    puzzleImageGrid.innerHTML = "";
    PUZZLE_IMAGES.forEach((img) => {
      const div = document.createElement("div");
      div.className = "puzzle-image-choice";
      div.innerHTML = `<img src="${img.src}" alt="${img.title}" loading="lazy" />`;
      div.addEventListener("click", () => {
        puzzleImage = img;
        showStep(puzzlePanel, "puzzleStepSize");
      });
      puzzleImageGrid.appendChild(div);
    });
  }

  puzzlePanel.querySelectorAll("[data-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      puzzleSize = parseInt(btn.dataset.size, 10);
      showStep(puzzlePanel, "puzzleStepPlay");
      buildPuzzle();
    });
  });

  function shuffledSolvable(n) {
    const arr = Array.from({ length: n * n }, (_, i) => i);
    let isSolved = true;
    while (isSolved) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      isSolved = arr.every((v, i) => v === i);
    }
    return arr;
  }

  function buildPuzzle() {
    puzzlePieces = shuffledSolvable(puzzleSize);
    puzzleSelectedSlot = null;
    puzzleMoves = 0;
    puzzleMoveCount.textContent = "0 movimientos";

    puzzleWin.classList.remove("active", "revealed");
    puzzleBoard.style.display = "grid";
    puzzleBoard.style.gridTemplateColumns = `repeat(${puzzleSize}, 1fr)`;
    puzzleBoard.innerHTML = "";

    for (let slot = 0; slot < puzzleSize * puzzleSize; slot++) {
      const piece = document.createElement("button");
      piece.className = "puzzle-piece";
      piece.setAttribute("aria-label", `Pieza en posición ${slot + 1}`);
      applyPieceStyle(piece, slot);
      piece.addEventListener("click", () => onPieceClick(slot));
      puzzleBoard.appendChild(piece);
    }
  }

  function applyPieceStyle(piece, slot) {
    const home = puzzlePieces[slot];
    const col = home % puzzleSize;
    const row = Math.floor(home / puzzleSize);
    const denom = puzzleSize - 1 || 1;

    piece.style.backgroundImage = `url("${puzzleImage.src}")`;
    piece.style.backgroundSize = `${puzzleSize * 100}% ${puzzleSize * 100}%`;
    piece.style.backgroundPosition = `${(col / denom) * 100}% ${(row / denom) * 100}%`;
  }

  function onPieceClick(slot) {
    const pieces = Array.from(puzzleBoard.children);

    if (puzzleSelectedSlot === null) {
      puzzleSelectedSlot = slot;
      pieces[slot].classList.add("selected");
      return;
    }

    if (puzzleSelectedSlot === slot) {
      pieces[slot].classList.remove("selected");
      puzzleSelectedSlot = null;
      return;
    }

    // Swap the two pieces — brief "pop" animation (.swapping, 150ms,
    // matches the CSS transition) before the background-position swap
    // actually happens, so it reads as a small flip rather than a snap.
    const a = puzzleSelectedSlot;
    const b = slot;
    const aEl = pieces[a];
    const bEl = pieces[b];

    aEl.classList.remove("selected");
    puzzleSelectedSlot = null;
    aEl.classList.add("swapping");
    bEl.classList.add("swapping");

    setTimeout(() => {
      [puzzlePieces[a], puzzlePieces[b]] = [puzzlePieces[b], puzzlePieces[a]];
      applyPieceStyle(aEl, a);
      applyPieceStyle(bEl, b);
      aEl.classList.remove("swapping");
      bEl.classList.remove("swapping");

      puzzleMoves++;
      puzzleMoveCount.textContent =
        puzzleMoves === 1 ? "1 movimiento" : `${puzzleMoves} movimientos`;

      if (puzzlePieces.every((home, i) => home === i)) {
        onPuzzleSolved();
      }
    }, 150);
  }

  /* Personal best, per image + piece count (a 9-piece record and a
     36-piece record aren't comparable, so each combo gets its own key). */
  function puzzleRecordKey() {
    const fileName = puzzleImage.src.split("/").pop();
    return `guiame_puzzle_record_${puzzleSize}_${fileName}`;
  }

  function onPuzzleSolved() {
    if (window.clarity) {
      clarity("event", "puzzle_solved", {
        image: puzzleImage.title,
        size: puzzleSize * puzzleSize,
        moves: puzzleMoves,
      });
    }

    let record = null;
    try {
      const stored = localStorage.getItem(puzzleRecordKey());
      record = stored ? parseInt(stored, 10) : null;
    } catch (_) {
      /* private browsing / storage blocked — just skip the record */
    }

    let recordText;
    if (record === null || puzzleMoves < record) {
      try {
        localStorage.setItem(puzzleRecordKey(), String(puzzleMoves));
      } catch (_) {}
      recordText =
        record === null
          ? `¡Nuevo récord! ${puzzleMoves} movimientos.`
          : `¡Nuevo récord! ${puzzleMoves} movimientos (antes: ${record}).`;
    } else {
      recordText = `${puzzleMoves} movimientos. Tu récord: ${record}.`;
    }

    document.getElementById("puzzleWinImg").src = puzzleImage.src;
    document.getElementById("puzzleWinImg").alt = puzzleImage.title;
    document.querySelector(".puzzle-win-text h3").textContent =
      puzzleImage.title;
    document.getElementById("puzzleWinMoves").textContent =
      `${puzzleImage.caption} · ${recordText}`;

    puzzleBoard.style.display = "none";
    puzzleWin.classList.add("active");
    setTimeout(() => puzzleWin.classList.add("revealed"), 200);
  }

  document
    .getElementById("puzzlePlayAgain")
    .addEventListener("click", resetPuzzleToImageStep);
});
