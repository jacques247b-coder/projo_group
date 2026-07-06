// PROJO GROUP — Reading Hub
// Free public domain books (Project Gutenberg API)
// Affiliate book store (Amazon/Takealot links)
// Built-in reader with dark/light mode, bookmarks, progress
import React, { useState, useEffect, useRef } from "react";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.15)";

// ── FREE BOOKS (Project Gutenberg — public domain) ──────────
// Using Gutenberg API: gutendex.com
const BOOK_CATEGORIES = ["All", "Business", "Motivation", "Fiction", "Children", "SA Authors", "Science", "History", "Philosophy"];

// Affiliate book store — curated list with Amazon/Takealot links
const AFFILIATE_BOOKS = [
  { id: "ab1", title: "Atomic Habits", author: "James Clear", category: "Business", rating: 5, price: "R249", desc: "Tiny changes, remarkable results. The proven way to build good habits.", cover: "https://covers.openlibrary.org/b/id/10110415-M.jpg", buyUrl: "https://www.takealot.com/search?q=atomic+habits", audioUrl: "https://www.audible.com/pd/Atomic-Habits" },
  { id: "ab2", title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: "Finance", rating: 5, price: "R199", desc: "What the rich teach their kids about money — that the poor and middle class do not.", cover: "https://covers.openlibrary.org/b/id/8739161-M.jpg", buyUrl: "https://www.takealot.com/search?q=rich+dad+poor+dad" },
  { id: "ab3", title: "Think and Grow Rich", author: "Napoleon Hill", category: "Motivation", rating: 5, price: "R149", desc: "The landmark bestseller on the secrets to personal achievement.", cover: "https://covers.openlibrary.org/b/id/7222246-M.jpg", buyUrl: "https://www.takealot.com/search?q=think+and+grow+rich" },
  { id: "ab4", title: "The 48 Laws of Power", author: "Robert Greene", category: "Business", rating: 4, price: "R299", desc: "Amoral, cunning, ruthless — a candid guide to power.", cover: "https://covers.openlibrary.org/b/id/8228691-M.jpg", buyUrl: "https://www.takealot.com/search?q=48+laws+of+power" },
  { id: "ab5", title: "Long Walk to Freedom", author: "Nelson Mandela", category: "SA Authors", rating: 5, price: "R279", desc: "The autobiography of the world's greatest freedom fighter.", cover: "https://covers.openlibrary.org/b/id/8226380-M.jpg", buyUrl: "https://www.takealot.com/search?q=long+walk+to+freedom" },
  { id: "ab6", title: "Start With Why", author: "Simon Sinek", category: "Business", rating: 5, price: "R229", desc: "How great leaders inspire everyone to take action.", cover: "https://covers.openlibrary.org/b/id/8228228-M.jpg", buyUrl: "https://www.takealot.com/search?q=start+with+why" },
  { id: "ab7", title: "The Psychology of Money", author: "Morgan Housel", category: "Finance", rating: 5, price: "R199", desc: "Timeless lessons on wealth, greed, and happiness.", cover: "https://covers.openlibrary.org/b/id/12640428-M.jpg", buyUrl: "https://www.takealot.com/search?q=psychology+of+money" },
  { id: "ab8", title: "Ikigai", author: "Héctor García", category: "Motivation", rating: 4, price: "R179", desc: "The Japanese secret to a long and happy life.", cover: "https://covers.openlibrary.org/b/id/10494444-M.jpg", buyUrl: "https://www.takealot.com/search?q=ikigai+book" },
  { id: "ab9", title: "Ubuntu: I Am Because We Are", author: "Mungi Ngomane", category: "SA Authors", rating: 4, price: "R199", desc: "Lessons for living better together — SA wisdom for modern life.", cover: "https://covers.openlibrary.org/b/id/10896857-M.jpg", buyUrl: "https://www.takealot.com/search?q=ubuntu+ngomane" },
  { id: "ab10",title: "Zero to One", author: "Peter Thiel", category: "Business", rating: 5, price: "R219", desc: "Notes on startups, or how to build the future.", cover: "https://covers.openlibrary.org/b/id/8228140-M.jpg", buyUrl: "https://www.takealot.com/search?q=zero+to+one+thiel" },
];

// ── BUILT-IN READER ──────────────────────────────────────────
function BookReader({ book, onClose }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const readerRef = useRef(null);

  useEffect(() => {
    // Fetch book text from Project Gutenberg
    // Try multiple Gutenberg URL formats
    const urls = [
      `https://www.gutenberg.org/cache/epub/${book.gutenbergId}/pg${book.gutenbergId}.txt`,
      `https://gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}-0.txt`,
      `https://gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}.txt`,
    ];

    function tryFetch(urlList) {
      if (!urlList.length) {
        setText("Could not load this book. Try another one.");
        setLoading(false);
        return;
      }
      fetch(urlList[0])
        .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(data => {
          const start = data.indexOf("*** START OF");
          const end = data.indexOf("*** END OF");
          const cleaned = start > -1 ? data.slice(start + 50, end > -1 ? end : data.length) : data;
          setText(cleaned.slice(0, 80000));
          setLoading(false);
        })
        .catch(() => tryFetch(urlList.slice(1)));
    }
    tryFetch(urls);

    // Load saved progress
    const saved = localStorage.getItem(`projo_book_${book.gutenbergId}`);
    if (saved) setProgress(parseInt(saved));
  }, [book]);

  function handleScroll() {
    if (!readerRef.current) return;
    const el = readerRef.current;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setProgress(pct);
    localStorage.setItem(`projo_book_${book.gutenbergId}`, pct);
  }

  const bg = darkMode ? "#0a0a0a" : "#faf8f4";
  const textColor = darkMode ? "#d4c9b8" : "#2a1a0a";

  return (
    <div style={{ position: "fixed", inset: 0, background: bg, zIndex: 2000, display: "flex", flexDirection: "column" }}>
      {/* Reader toolbar */}
      <div style={{ background: darkMode ? BG2 : "#fff", borderBottom: `1px solid ${BORDER}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: G, fontSize: "20px", cursor: "pointer" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: textColor }}>{book.title}</div>
          <div style={{ fontSize: "10px", color: "#6b6760" }}>{progress}% read</div>
        </div>
        <button onClick={() => setFontSize(s => Math.max(12, s-2))} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "6px", color: textColor, padding: "4px 8px", cursor: "pointer", fontSize: "12px" }}>A-</button>
        <button onClick={() => setFontSize(s => Math.min(24, s+2))} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "6px", color: textColor, padding: "4px 8px", cursor: "pointer", fontSize: "14px" }}>A+</button>
        <button onClick={() => setDarkMode(d => !d)} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "6px", color: textColor, padding: "4px 8px", cursor: "pointer", fontSize: "14px" }}>{darkMode ? "☀️" : "🌙"}</button>
        <button onClick={() => setBookmarked(b => !b)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>{bookmarked ? "🔖" : "📄"}</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: BG3 }}>
        <div style={{ height: "100%", background: G, width: `${progress}%`, transition: "width 0.3s" }} />
      </div>

      {/* Book content */}
      <div ref={readerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.25rem", maxWidth: "680px", margin: "0 auto", width: "100%" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b6760" }}>📖 Loading book...</div>
        ) : (
          <pre style={{ fontFamily: "Georgia, serif", fontSize: `${fontSize}px`, lineHeight: 1.8, color: textColor, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {text}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── MAIN READING HUB ─────────────────────────────────────────
export default function ReadingHub() {
  const [subTab, setSubTab] = useState("free");
  const [bookFilter, setBookFilter] = useState("All");
  const [freeBooks, setFreeBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [readingBook, setReadingBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [readingProgress, setReadingProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem("projo_reading_progress") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    if (subTab !== "free") return;
    setLoadingBooks(true);
    // Fetch from Project Gutenberg API (gutendex)
    const query = searchQuery ? `search=${encodeURIComponent(searchQuery)}` : "topic=fiction";
    fetch(`https://gutendex.com/books/?${query}&languages=en`)
      .then(r => r.json())
      .then(data => {
        setFreeBooks(data.results || []);
        setLoadingBooks(false);
      })
      .catch(() => setLoadingBooks(false));
  }, [subTab, searchQuery]);

  const affiliateFiltered = bookFilter === "All"
    ? AFFILIATE_BOOKS
    : AFFILIATE_BOOKS.filter(b => b.category === bookFilter);

  const affCategories = ["All", "Business", "Finance", "Motivation", "SA Authors"];

  if (readingBook) return <BookReader book={readingBook} onClose={() => setReadingBook(null)} />;

  return (
    <div>
      {/* Sub tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        {[{ key: "store", label: "🛒 Book Store" }, { key: "free", label: "📖 Free Library" }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            flex: 1, background: subTab === t.key ? "rgba(232,184,75,0.15)" : BG2,
            border: `1px solid ${subTab === t.key ? G : BORDER}`,
            borderRadius: "10px", padding: "10px", color: subTab === t.key ? G : "#6b6760",
            fontSize: "13px", fontWeight: "700", cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── BOOK STORE ── */}
      {subTab === "store" && (
        <div>
          <div style={{ background: "rgba(232,184,75,0.05)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "10px 14px", marginBottom: "1rem", fontSize: "11px", color: "#6b6760" }}>
            📌 Books open on Takealot.com — SA's biggest book retailer. PROJO earns a referral when you purchase.
          </div>
          {/* Category filter */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "1rem", paddingBottom: "4px" }}>
            {affCategories.map(cat => (
              <button key={cat} onClick={() => setBookFilter(cat)} style={{
                background: bookFilter === cat ? "rgba(232,184,75,0.15)" : BG2,
                border: `1px solid ${bookFilter === cat ? G : BORDER}`,
                borderRadius: "20px", padding: "5px 12px", color: bookFilter === cat ? G : "#6b6760",
                fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}>{cat}</button>
            ))}
          </div>
          {/* Book grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {affiliateFiltered.map(book => (
              <div key={book.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
                <img src={book.cover} alt={book.title} style={{ width: "100%", height: "140px", objectFit: "cover" }} onError={e => { e.target.style.background="#1a1a1a"; e.target.style.display="none"; }} />
                <div style={{ padding: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#f0ede8", lineHeight: 1.3, marginBottom: "2px" }}>{book.title}</div>
                  <div style={{ fontSize: "10px", color: "#6b6760", marginBottom: "4px" }}>{book.author}</div>
                  <div style={{ display: "flex", gap: "1px", marginBottom: "6px" }}>{"★".repeat(book.rating).split("").map((s,i) => <span key={i} style={{ fontSize: "10px", color: G }}>★</span>)}</div>
                  {book.price && <div style={{ fontSize: "12px", fontWeight: "800", color: G, marginBottom: "8px" }}>{book.price}</div>}
                  <a href={book.buyUrl} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", background: G, color: "#0a0a0a", textDecoration: "none", borderRadius: "8px", padding: "8px", fontWeight: "800", fontSize: "12px" }}>
                    📚 Buy eBook
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FREE LIBRARY ── */}
      {subTab === "free" && (
        <div>
          <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "12px", padding: "10px 14px", marginBottom: "1rem" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#4ade80", marginBottom: "4px" }}>📖 100% Free — Public Domain Books</div>
            <div style={{ fontSize: "11px", color: "#6b6760" }}>Classics whose copyright has expired. Legally free to read via Project Gutenberg.</div>
          </div>

          {/* Continue Reading */}
          {Object.keys(readingProgress).length > 0 && (
            <div style={{ background: BG2, border: `1px solid ${G}`, borderRadius: "14px", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: "800", color: G, marginBottom: "8px" }}>📖 Continue Reading</div>
              {Object.entries(readingProgress).slice(0,2).map(([id, pct]) => {
                const book = freeBooks.find(b => b.id === parseInt(id));
                if (!book) return null;
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: "12px", color: "#f0ede8" }}>{book.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#6b6760" }}>{pct}%</div>
                      <button onClick={() => setReadingBook({ gutenbergId: id, title: book.title })} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Resume</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search */}
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search books — Shakespeare, Doyle, Austen..."
            style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: "10px", color: "#f0ede8", padding: "12px 16px", fontSize: "13px", outline: "none", boxSizing: "border-box", marginBottom: "1rem", fontFamily: "'DM Sans',sans-serif" }}
          />

          {loadingBooks ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b6760" }}>Loading books...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {freeBooks.slice(0, 20).map(book => {
                const cover = book.formats?.["image/jpeg"] || "";
                const pct = localStorage.getItem(`projo_book_${book.id}`);
                return (
                  <div key={book.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden", cursor: "pointer" }}
                    onClick={() => setReadingBook({ gutenbergId: book.id, title: book.title })}>
                    {cover && <img src={cover} alt={book.title} style={{ width: "100%", height: "140px", objectFit: "cover" }} onError={e => e.target.style.display="none"} />}
                    {!cover && <div style={{ height: "80px", background: BG3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>📖</div>}
                    <div style={{ padding: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#f0ede8", lineHeight: 1.3, marginBottom: "2px" }}>{book.title}</div>
                      <div style={{ fontSize: "10px", color: "#6b6760", marginBottom: "6px" }}>{book.authors?.[0]?.name || "Unknown"}</div>
                      {pct && (
                        <div style={{ background: BG3, borderRadius: "4px", height: "4px", marginBottom: "6px" }}>
                          <div style={{ height: "100%", background: G, width: `${pct}%`, borderRadius: "4px" }} />
                        </div>
                      )}
                      <div style={{ display: "inline-block", background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: "10px", fontWeight: "700", borderRadius: "4px", padding: "2px 6px" }}>FREE</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: "10px", color: "#4a3030", textAlign: "center", marginTop: "12px" }}>
            Books from Project Gutenberg · Public domain · Free forever
          </div>
        </div>
      )}
    </div>
  );
}
