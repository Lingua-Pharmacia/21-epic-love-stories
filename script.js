const splash = document.getElementById('splash-screen'), instr = document.getElementById('instructions-screen'),
      app = document.getElementById('main-app'), grid = document.getElementById('stations-grid'),
      playerZone = document.getElementById('player-zone'), audio = document.getElementById('audio-player'),
      transcript = document.getElementById('transcript-box'), popup = document.getElementById('translation-popup'),
      gameZone = document.getElementById('game-zone'), gameBoard = document.getElementById('game-board'),
      feedbackArea = document.getElementById('quiz-feedback-area'), ptsVal = document.getElementById('points-val');

// PERSISTENCE
let lifetimeScore = parseInt(localStorage.getItem('loveStoryScore')) || 0;
let completedLessons = JSON.parse(localStorage.getItem('completedLoveStories')) || [];
if(ptsVal) ptsVal.innerText = lifetimeScore;

let wordBucket = []; let currentQ = 0; let attempts = 0; let totalScore = 0; let firstCard = null;

// STATIONS
const stations = [
    {file:"01_Justinian.mp3", title:"Justinian & Theodora"}, {file:"02_Tiberius.mp3", title:"Tiberius & Marcus"},
    {file:"03_Dracula.mp3", title:"Dracula & Mina"}, {file:"04_Tristan.mp3", title:"Tristan & Isolde"},
    {file:"05_Salim.mp3", title:"Prince Salim & Anarkali"}, {file:"06_Genghis.mp3", title:"Genghis Khan & Börte"},
    {file:"07_Spartacus.mp3", title:"Spartacus & Shura"}, {file:"08_Alexander.mp3", title:"Alexander & Hephaestion"},
    {file:"09_Zenobia.mp3", title:"Zenobia & Odaenathus"}, {file:"10_Antony.mp3", title:"Cleopatra & Mark Antony"},
    {file:"11_Pericles.mp3", title:"Pericles & Aspasia"}, {file:"12_Hatshepsut.mp3", title:"Hatshepsut & Senenmut"},
    {file:"13_WuZetian.mp3", title:"Wu Zetian & Gaozong"}, {file:"14_Bolivar.mp3", title:"Bolívar & Manuela"},
    {file:"15_Cyrus.mp3", title:"Cyrus & Cassandane"}, {file:"16_Richard.mp3", title:"Richard & Berengaria"},
    {file:"17_Kerem.mp3", title:"Kerem & Aslı"}, {file:"18_HenryVIII.mp3", title:"Henry VIII & Anne Boleyn"},
    {file:"19_ShahJahan.mp3", title:"Shah Jahan & Mumtaz"}, {file:"20_Napoleon.mp3", title:"Napoleon & Joséphine"},
    {file:"21_Antar.mp3", title:"Antar & Abla"}
];

stations.forEach((s, i) => {
    const btn = document.createElement('div'); btn.className = 'station-tile';
    if(completedLessons.includes(s.file)) btn.classList.add('completed');
    btn.innerHTML = `<b>${i + 1}</b> ${s.title}`;
    btn.onclick = () => { grid.classList.add('hidden'); playerZone.classList.remove('hidden'); document.getElementById('now-playing-title').innerText = s.title; audio.src = s.file; wordBucket = []; };
    grid.appendChild(btn);
});

// NAVIGATION
document.getElementById('btn-start').onclick = () => { splash.classList.add('hidden'); instr.classList.remove('hidden'); };
document.getElementById('btn-enter').onclick = () => { instr.classList.add('hidden'); app.classList.remove('hidden'); };
document.getElementById('btn-back').onclick = () => { location.reload(); };

// BOWLING QUIZ LOGIC
document.getElementById('btn-bowling').onclick = () => {
    const fn = audio.src.split('/').pop(); const lesson = lessonData[fn][0];
    transcript.classList.add('hidden'); gameZone.classList.remove('hidden'); gameBoard.style.display = "none";
    currentQ = 0; totalScore = 0; attempts = 0;
    runQuiz(lesson);
};

function runQuiz(lesson) {
    if (currentQ >= 7) { finishQuiz(); return; }
    const qData = lesson.questions[currentQ];
    
    feedbackArea.innerHTML = `
        <div id="quiz-container">
            <div class="score-badge">SCORE: ${totalScore} | Q: ${currentQ+1}/7</div>
            <button id="btn-hear-q" class="mode-btn neon-green">👂 LISTEN TO QUESTION</button>
            <div id="mic-box" class="hidden" style="margin-top:20px;">
                <button id="btn-speak" class="mic-btn">🎤</button>
                <p id="mic-status" style="color:#666;">Ready...</p>
            </div>
            <div id="res-area"></div>
        </div>
    `;

    document.getElementById('btn-hear-q').onclick = () => {
        const utter = new SpeechSynthesisUtterance(qData.q);
        utter.onend = () => { document.getElementById('mic-box').classList.remove('hidden'); };
        window.speechSynthesis.speak(utter);
    };

    document.getElementById('btn-speak').onclick = function() {
        const btn = this;
        const status = document.getElementById('mic-status');
        btn.classList.add('active');
        status.innerText = "Listening...";
        
        // FRESH ENGINE EVERY TIME
        const rec = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
        rec.lang = 'en-US';
        rec.interimResults = false;

        rec.onresult = (e) => {
            document.getElementById('mic-box').classList.add('hidden'); // KILL MIC IMMEDIATELY
            const res = e.results[0][0].transcript.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
            const ans = qData.a_en.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
            
            if (res === ans) {
                let pts = (attempts === 0) ? 20 : 15;
                totalScore += pts;
                showResult(true, pts === 20 ? "STRIKE! (+20)" : "SPARE! (+15)", qData, lesson);
            } else {
                attempts++;
                if (attempts === 1) {
                    showResult(false, "MISS! TRY AGAIN", qData, lesson, true);
                } else {
                    showResult(false, "MISS! (0 pts)", qData, lesson, false);
                }
            }
        };

        rec.onerror = () => {
            btn.classList.remove('active');
            status.innerText = "Error. Try again.";
        };
        
        rec.start();
    };
}

function showResult(isCorrect, msg, qData, lesson, canRetry = false) {
    const area = document.getElementById('res-area');
    area.innerHTML = `<h1 style="color:${isCorrect?'#39ff14':'#f44'}; font-size: 50px; margin-bottom:10px;">${msg}</h1>`;
    
    if (isCorrect || !canRetry) {
        area.innerHTML += `
            <p class="quiz-q-text">Q: ${qData.q}</p>
            <p class="quiz-a-text">EN: ${qData.a_en}</p>
            <p style="color:#888; font-size:30px; font-weight: bold;">TR: ${qData.a_tr}</p>
            <button id="btn-nxt" class="action-btn-large" style="margin-top:30px;">NEXT QUESTION ⮕</button>
        `;
        document.getElementById('btn-nxt').onclick = () => { currentQ++; attempts = 0; runQuiz(lesson); };
    } else {
        area.innerHTML += `<button id="btn-retry" class="action-btn-large" style="margin-top:30px;">RETRY FOR SPARE</button>`;
        document.getElementById('btn-retry').onclick = () => {
            area.innerHTML = "";
            document.getElementById('mic-box').classList.remove('hidden'); // Mic is fresh and ready
            document.getElementById('btn-speak').classList.remove('active');
            document.getElementById('mic-status').innerText = "Ready for Spare...";
        };
    }
}

function finishQuiz() {
    lifetimeScore += totalScore;
    localStorage.setItem('loveStoryScore', lifetimeScore);
    const fn = audio.src.split('/').pop();
    if(!completedLessons.includes(fn)) {
        completedLessons.push(fn);
        localStorage.setItem('completedLoveStories', JSON.stringify(completedLessons));
    }
    feedbackArea.innerHTML = `
        <h1 style="color:#ccff00; font-size: 60px;">FINISHED!</h1>
        <h2 style="font-size: 40px;">QUIZ SCORE: ${totalScore}</h2>
        <button onclick="location.reload()" class="action-btn-large">SAVE & RETURN</button>
    `;
}

// OTHER UTILITIES
document.getElementById('ctrl-play').onclick = () => audio.play();
document.getElementById('ctrl-pause').onclick = () => audio.pause();
document.getElementById('ctrl-stop').onclick = () => { audio.pause(); audio.currentTime = 0; };
document.getElementById('btn-blind').onclick = () => { transcript.classList.add('hidden'); gameZone.classList.add('hidden'); audio.play(); };

document.getElementById('btn-read').onclick = () => {
    const fn = audio.src.split('/').pop(); const data = lessonData[fn][0];
    transcript.classList.remove('hidden'); gameZone.classList.add('hidden'); transcript.innerHTML = "";
    data.text.split(" ").forEach(w => {
        const span = document.createElement('span'); 
        const clean = w.toLowerCase().replace(/[^a-z0-9ğüşöçı]/gi, "");
        span.innerText = w + " "; span.className = "clickable-word";
        span.onclick = (e) => {
            const tr = data.dict[clean];
            if(tr) {
                if (!wordBucket.some(p => p.en === clean)) wordBucket.push({en: clean, tr: tr});
                popup.innerText = tr; popup.style.left = `${e.clientX}px`; popup.style.top = `${e.clientY - 50}px`;
                popup.classList.remove('hidden'); setTimeout(() => popup.classList.add('hidden'), 2000);
            }
        };
        transcript.appendChild(span);
    });
    audio.play();
};

document.getElementById('btn-game').onclick = () => {
    const fn = audio.src.split('/').pop(); const lesson = lessonData[fn][0];
    transcript.classList.add('hidden'); gameZone.classList.remove('hidden'); feedbackArea.innerHTML = "";
    gameBoard.innerHTML = ""; firstCard = null; gameBoard.style.display = "grid";
    let set = [...wordBucket];
    for (let k in lesson.dict) { if (set.length >= 8) break; if (!set.some(p => p.en === k)) set.push({en: k, tr: lesson.dict[k]}); }
    let deck = [];
    set.forEach(p => { deck.push({text: p.en, match: p.tr}); deck.push({text: p.tr, match: p.en}); });
    deck.sort(() => Math.random() - 0.5);
    deck.forEach(card => {
        const div = document.createElement('div'); div.className = 'game-card'; div.innerText = card.text;
        div.onclick = () => {
            if (div.classList.contains('correct') || div.classList.contains('selected')) return;
            if (firstCard) {
                if (firstCard.innerText === card.match) {
                    div.classList.add('correct'); firstCard.classList.add('correct'); firstCard = null;
                } else {
                    div.classList.add('wrong'); setTimeout(() => { div.classList.remove('wrong'); firstCard.classList.remove('selected'); firstCard = null; }, 500);
                }
            } else { firstCard = div; div.classList.add('selected'); }
        };
        gameBoard.appendChild(div);
    });
};
