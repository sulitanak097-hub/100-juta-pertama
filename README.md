# 100 Juta Pertama

Aplikasi tracker tabungan + AI Coach (pakai Gemini API) + data UMR seluruh Indonesia.

## 🔥 Setup Firebase (Login Google + Database member)

1. Buka https://console.firebase.google.com → **Add project** → ikuti sampai selesai.
2. Di dashboard → klik ikon **`</>`** (Add app → Web) → register → copy config yang muncul.
3. **Authentication**: Build → Authentication → Get started → Sign-in method → **Google** → Enable.
4. **Firestore**: Build → Firestore Database → Create database → mode **production** → pilih region terdekat (mis. `asia-southeast2`).
5. **Firestore Rules** — buka tab Rules di Firestore, ganti dengan ini supaya tiap user cuma bisa baca/tulis datanya sendiri, sementara leaderboard bisa dibaca semua orang tapi cuma ditulis oleh pemiliknya:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /leaderboard/{docId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
   Klik **Publish**.
6. Isi 6 variabel `VITE_FIREBASE_*` di `.env` (lokal) / Environment variables Netlify (lihat `.env.example`).
7. **PENTING setelah deploy ke Netlify**: buka Firebase Console → Authentication → Settings → **Authorized domains** → **Add domain** → masukkan domain Netlify kamu (mis. `nama-acak.netlify.app`). Kalau ini dilewat, tombol "Masuk dengan Google" akan error `auth/unauthorized-domain`.

---

## ⚠️ WAJIB DULU: revoke API key lama

Kalau kamu pernah share API key (Gemini/Anthropic/apapun) di chat, dokumen, atau
tempat lain yang tidak privat, anggap key itu **bocor**:
1. Buka https://aistudio.google.com/app/apikey
2. Hapus/revoke key lama
3. Buat key baru — dan JANGAN taruh langsung di kode. Ikuti langkah env variable di bawah.

---

## Cara deploy dari HP (GitHub → Netlify, tanpa install apapun di HP)

### Langkah 1 — Upload project ke GitHub
1. Ekstrak file zip ini di HP (pakai app File Manager / ZArchiver / app bawaan).
2. Buka app **GitHub** (atau github.com di browser HP), login.
3. Tap **+** → **New repository** → beri nama, misal `100-juta-pertama` → Create.
4. Di repo baru, tap **Add file → Upload files**.
5. Upload SEMUA file & folder hasil ekstrak (App.jsx ada di dalam folder `src/`,
   pastikan struktur foldernya tetap sama — `src/App.jsx`, `src/main.jsx`, dst).
6. Commit changes.

> Tips: kalau app GitHub mobile kamu susah upload folder bertingkat, pakai
> browser HP → github.com → buka repo → "Add file" → "Create new file" →
> ketik nama lengkap dengan folder, misal `src/App.jsx`, lalu paste isinya.
> Ulangi untuk tiap file.

### Langkah 2 — Simpan API key Gemini di Netlify (BUKAN di kode)
Jangan taruh key di file manapun yang di-upload ke GitHub (public = siapa saja bisa lihat).

### Langkah 3 — Deploy ke Netlify
1. Buka https://app.netlify.com di browser HP, login pakai akun GitHub.
2. **Add new site → Import an existing project → GitHub** → pilih repo `100-juta-pertama`.
3. Build settings (biasanya otomatis kedeteksi dari `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Sebelum klik Deploy**, buka bagian **"Add environment variables"** dan tambahkan SEMUA ini (lihat `.env.example` untuk daftarnya):
   - `VITE_GEMINI_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Klik **Deploy site**. Tunggu 1–2 menit, Netlify akan build otomatis di server mereka.
6. Selesai — kamu dapat URL seperti `nama-acak.netlify.app`.
7. **Jangan lupa** tambahkan URL itu ke **Authorized domains** di Firebase Authentication (lihat bagian Setup Firebase di atas), kalau tidak login Google akan gagal.

### Update environment variable belakangan (kalau lupa/mau ganti key)
Site settings → **Environment variables** → tambah/edit `VITE_GEMINI_API_KEY` →
lalu **Trigger deploy** (di tab Deploys) supaya key baru terpakai.

---

## Kalau mau coba di komputer dulu (opsional)
```bash
npm install
cp .env.example .env
# edit .env, isi VITE_GEMINI_API_KEY=key_kamu
npm run dev
```

## Catatan teknis
- Login wajib pakai akun Google (Firebase Authentication) sebelum masuk aplikasi.
- Data profil, expenses, dan riwayat tabungan disimpan di **Firestore**, per akun
  (`users/{uid}/data/...`) — otomatis sinkron kalau login di device lain.
- Leaderboard disimpan di koleksi publik `leaderboard` (bisa dibaca semua orang,
  ditulis hanya oleh pemiliknya sendiri — diatur lewat Firestore Rules).
- AI Coach memanggil **Gemini 2.0 Flash** (`gemini-2.0-flash`) via
  `generativelanguage.googleapis.com`, key diambil dari `import.meta.env.VITE_GEMINI_API_KEY`.
- Data UMR di `UMR_DATA` (dalam `App.jsx`) adalah estimasi UMP 2026 38 provinsi +
  beberapa UMK kota industri. Selalu cek ke Disnaker setempat untuk angka resmi.
