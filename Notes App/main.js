// Data Layer
function loadNotes() {
    return JSON.parse(localStorage.getItem("ariyan-notes") || "[]");
}

function saveNotes(notes) {
    localStorage.setItem("ariyan-notes", JSON.stringify(notes));
}

function createNote(title = "Untitled note", body = "", category = "personal") {
    const notes = loadNotes();
    const note = {
        id: Date.now().toString(),
        title,
        body,
        category,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: body.split(/\s+/).filter(Boolean).length,
    };
    saveNotes([note, ...notes]);
    return note;
}

function updateNote(id, updates) {
    const notes = loadNotes().map(n =>
        n.id === id
            ? {
                  ...n,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                  wordCount: (updates.body ?? n.body)
                      .split(/\s+/)
                      .filter(Boolean).length,
              }
            : n
    );
    saveNotes(notes);
}

function deleteNote(id) {
    saveNotes(loadNotes().filter(n => n.id !== id));
}

function togglePin(id) {
    const notes = loadNotes().map(n =>
        n.id === id ? { ...n, pinned: !n.pinned } : n
    );
    saveNotes(notes);
}

// UI Layer
let currentFilter = "all";
let searchQuery = "";

function getFilteredNotes() {
    return loadNotes()
        .filter(n => currentFilter === "all" || n.category === currentFilter)
        .filter(n => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                n.title.toLowerCase().includes(q) ||
                n.body.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned - a.pinned;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function renderNotes() {
    const notes = getFilteredNotes();
    const all = loadNotes();

    const grid = document.querySelector("#notesGrid");
    const empty = document.querySelector("#emptyState");
    const statsEl = document.querySelector("#stats");

    statsEl.textContent = `${all.length} notes · ${
        all.filter(n => n.pinned).length
    } pinned`;

    empty.style.display = notes.length === 0 ? "block" : "none";
    grid.innerHTML = "";

    notes.forEach(note => {
        const card = document.createElement("div");
        card.className = `note-card${note.pinned ? " is-pinned" : ""}`;
        card.dataset.id = note.id;

        card.innerHTML = `
          <div class='note-header'>
            <textarea class='note-title' rows='1'>${note.title}</textarea>
            <span class='pin-icon'>📌</span>
          </div>

          <textarea class='note-body'>${note.body}</textarea>

          <div class='note-footer'>
            <span class='note-meta'>
              ${note.wordCount} words · ${formatDate(note.updatedAt)}
            </span>

            <div style='display:flex;align-items:center;gap:8px'>
              <select class='note-cat'>
                <option value='work' ${note.category === "work" ? "selected" : ""}>Work</option>
                <option value='personal' ${note.category === "personal" ? "selected" : ""}>Personal</option>
                <option value='ideas' ${note.category === "ideas" ? "selected" : ""}>Ideas</option>
              </select>

              <div class='note-actions'>
                <button class='note-action pin'>📌</button>
                <button class='note-action delete'>🗑️</button>
              </div>
            </div>
          </div>
        `;

        grid.appendChild(card);

        // Auto resize
        card.querySelectorAll("textarea").forEach(ta => {
            ta.style.height = "auto";
            ta.style.height = ta.scrollHeight + "px";

            ta.addEventListener("input", () => {
                ta.style.height = "auto";
                ta.style.height = ta.scrollHeight + "px";
            });
        });
    });
}

// Events
document.querySelector("#notesGrid").addEventListener("change", e => {
    const card = e.target.closest(".note-card");
    if (!card) return;

    if (e.target.classList.contains("note-cat")) {
        updateNote(card.dataset.id, { category: e.target.value });
        renderNotes();
    }
});

document.querySelector("#notesGrid").addEventListener("click", e => {
    const card = e.target.closest(".note-card");
    if (!card) return;

    const id = card.dataset.id;

    if (e.target.classList.contains("delete")) {
        if (confirm("Delete this note?")) {
            deleteNote(id);
            renderNotes();
        }
    }

    if (e.target.classList.contains("pin")) {
        togglePin(id);
        renderNotes();
    }
});

// Save on blur
document.querySelector("#notesGrid").addEventListener("focusout", e => {
    const card = e.target.closest(".note-card");
    if (!card) return;

    const title = card.querySelector(".note-title").value;
    const body = card.querySelector(".note-body").value;

    updateNote(card.dataset.id, { title, body });
    renderNotes();
});

// New note
document.querySelector("#newNoteBtn").addEventListener("click", () => {
    createNote();
    renderNotes();
    document.querySelector(".note-title")?.focus();
});

// Search
document.querySelector("#searchInput").addEventListener("input", e => {
    searchQuery = e.target.value;
    renderNotes();
});

// Filters
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b =>
            b.classList.remove("is-active")
        );

        btn.classList.add("is-active");
        currentFilter = btn.dataset.cat;
        renderNotes();
    });
});

// Initial setup
if (loadNotes().length === 0) {
    createNote(
        "Welcome to notes",
        "Click the + button to create your first note. All notes are saved automatically.",
        "personal"
    );
}

renderNotes();