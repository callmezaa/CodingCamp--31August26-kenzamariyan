# To-Do List Life Dashboard

Minimal life dashboard untuk daily productivity — greeting, focus timer, to-do list, dan quick links. Dibuat untuk **CodingCamp RevoU** dengan stack 100% Vanilla (tanpa framework, tanpa backend).

> Live Demo: *aktif setelah enable GitHub Pages* → `https://<username>.github.io/<repo>/todo-life-dashboard/`

---

## ✨ Features

### Required Features (MVP)

| Fitur | Detail Implementasi |
|-------|---------------------|
| **Greeting** | Menampilkan waktu `HH:MM:SS AM/PM`, tanggal `Monday, January 15, 2026`, dan sapaan berbasis jam (Morning 05-11, Afternoon 12-16, Evening 17-20, Night 21-04). Update tiap 1000ms. |
| **Focus Timer** | Countdown default **25:00**, format `MM:SS`, kontrol **Start / Pause(Resume) / Reset**, notifikasi visual `Session Complete` + audible alert 2 detik (Web Audio API). |
| **To-Do List** | CRUD lengkap: **Add** (Enter/click), **Edit** inline (klik teks), **Toggle** complete (checkbox), **Delete**. Validasi 1-100 char, persist otomatis ke Local Storage. |
| **Quick Links** | **Add** name + URL, validasi `new URL()`, cegah URL duplikat, tampil favicon via Google S2 + fallback letter avatar, **Edit** inline, **Delete**, klik buka tab baru. |

### Challenges — 3 Dipilih (Simple & Clean)

> Panitia memberi 5 pilihan, dipilih 3 yang paling minimal & tidak menambah clutter UI.

1.  **Custom Name in Greeting** — Klik `✎` di greeting → input nama (1-30 char) → Save/Cancel (Enter/Escape). Tampil sebagai `Good Morning, Kenza!`. Persist di `todoLifeDashboardUserName`, hapus dengan mengosongkan input. Validasi + error merah.
2.  **Change Pomodoro Time** — Dropdown `Duration` di timer: `5 / 10 / 15 / 25 / 30 / 45 / 60 min`. Default 25 min, persist di `todoLifeDashboardTimerDuration`. Disable saat timer running/paused, reset otomatis saat ganti durasi.
3.  **Prevent Duplicate Tasks** — Task duplikat ditolak case-insensitive & trim-insensitive. Contoh `belajar` == ` Belajar `. Pesan `Task already exists` + border merah, berlaku untuk Add maupun Edit inline.

Tidak dipilih: `Light/Dark mode` dan `Sort tasks` (butuh refactor CSS besar & UI sorting yang menambah kompleksitas — sengaja dilewati agar tetap clean).

---

## 🧱 Technical Constraints — Compliance

| Constraint | Status | Catatan |
|------------|--------|---------|
| **TC-1: Stack** | ✅ | `HTML` struktur `todo-life-dashboard/index.html:1`, `CSS` `css/style.css:1`, `Vanilla JS` `js/app.js:1` — tanpa React/Vue/build tools |
| **TC-2: Storage** | ✅ | Hanya `localStorage` — `todoLifeDashboardTasks`, `todoLifeDashboardQuickLinks`, `todoLifeDashboardUserName`, `todoLifeDashboardTimerDuration`. No backend. |
| **TC-3: Browser** | ✅ | Chrome/Firefox/Edge/Safari modern. Standalone web app, siap jadi browser extension (no API khusus). |
| **NFR-1: Simplicity** | ✅ | UI card minimal, no setup, no test setup, no npm install |
| **NFR-2: Performance** | ✅ | Single JS+CSS, load <2s, update DOM minimal, debounce tidak perlu, no lag |
| **NFR-3: Visual** | ✅ | Palette `#f8f9fa` bg, `#74b9ff` accent, `#00b894` success, `#ff7675` error, system font stack, hierarchy jelas |

**Folder Rules** — dipatuhi:

```
todo-life-dashboard/
├── index.html          # entry
├── css/
│   └── style.css       # 1 file only (867 lines)
└── js/
    └── app.js          # 1 file only (906 lines) — Storage + Utils + Greeting + Timer + Tasks + Links + App init
```

> Spec asli `js/{app,greeting,timer,tasks,links,utils}.js` digabung menjadi `app.js` untuk memenuhi aturan **Only 1 JS file** tanpa mengorbankan modularitas (fungsi dipisah via section comment).

---

## 🚀 Cara Menjalankan

```bash
# 1. Clone
git clone https://github.com/<username>/CodingCamp--31August26-kenzamariyan.git
cd CodingCamp--31August26-kenzamariyan

# 2. Buka langsung (no build)
# opsi A: double-click todo-life-dashboard/index.html
# opsi B: serve via VS Code Live Server / python
python -m http.server 8000
# buka http://localhost:8000/todo-life-dashboard/
```

Tidak perlu `npm install`, tidak perlu env.

---

## 💾 Data Storage

Semua data client-side via `localStorage` (`js/app.js:11`):

| Key | Isi | Contoh |
|-----|-----|--------|
| `todoLifeDashboardTasks` | `{version:1, tasks:[{id, description, completed, createdAt, updatedAt}], lastModified}` | task `{"id":"uuid","description":"Belajar JS","completed":false,...}` |
| `todoLifeDashboardQuickLinks` | `{version:1, links:[{id, name, url, faviconUrl, createdAt, updatedAt}], lastModified}` | link `{"name":"GitHub","url":"https://github.com",...}` |
| `todoLifeDashboardUserName` | `string` (1-30 char) | `"Kenza"` |
| `todoLifeDashboardTimerDuration` | `number` (detik, allowed 300-3600) | `900` (15 min) |

Fallback: jika `localStorage` penuh → pesan `Could not save...`, jika corrupt → `try/catch` dan mulai kosong.

---

## ✅ Validasi

- **Task**: `trim().length` 1-100, duplikat `toLowerCase().trim()` ditolak
- **User Name**: 1-30 char
- **Link Name**: 1-100 char
- **URL**: `new URL()` + `http:/https:` + panjang ≤2048, unik case-insensitive
- **Timer**: hanya allowed durations, ignore saat running
- **Sanitasi**: `sanitizeInput()` escape `& < > " '` untuk cegah XSS

---

## 🎨 Desain

- **Layout**: CSS Grid, 1 kolom mobile, 2 kolom tablet `≥768px`, max-width `1200px`, centered
- **Cards**: `background:#fff`, `border-radius:12px`, `shadow 0 2px 8px rgba(0,0,0,0.08)`
- **Typography**: `-apple-system, BlinkMacSystemFont, Segoe UI...`, greeting `32px`, time `24px`, body `14-16px`
- **Aksesibilitas**: `aria-label`, `aria-live` pada error, contrast lolos WCAG AA

---

## 🌐 GitHub & Deployment

1. Push via GitHub Desktop / `git push origin main`
2. Aktifkan **GitHub Pages**: Repository → Settings → Pages → Source: `main` / `/(root)` atau `/todo-life-dashboard` → Save
3. Tunggu ±1 menit, akses URL Pages

> Basic Git saja, tidak perlu workflow CI.

---

## 📌 Catatan Implementasi

- Semua komponen `initGreeting()`, `initTimer()`, `initTasks()`, `initLinks()` dipanggil dari `DOMContentLoaded` (`js/app.js:873`) dengan `try/catch` per komponen agar 1 gagal tidak mematikan lainnya.
- Timer pakai `setInterval(1000)` + `AudioContext` oscillator 880Hz 2 detik.
- Favicon: `https://www.google.com/s2/favicons?domain={hostname}&sz=32` dengan `onerror` fallback ke huruf pertama.

---

## 👩‍💻 Author

**Kenza Mariyan** — CodingCamp RevoU 31 Aug 2026  
Mini project To-Do List Life Dashboard — simple, clean, readable.

