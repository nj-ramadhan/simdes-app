# SIMDES

Sistem Informasi Masyarakat Desa untuk pengelolaan warga, wilayah, lingkungan, infrastruktur, aset, dan transparansi keuangan.

Struktur wilayah:

```text
Desa
  RW 1
    RT 1
    RT 2
  RW 2
    RT 1
    RT 2
```

`id_rw` dan `id_rt` adalah nomor integer biasa. Hubungan RT ke RW disimpan pada `rt.id_rw`, sedangkan data sensus menyimpan `id_rw` dan `id_rt`.

## Stack

- React, Vite, React Router, Recharts
- Vercel Serverless Functions
- Neon PostgreSQL melalui `pg`
- JWT dan bcrypt untuk autentikasi

Frontend tidak mengakses Neon langsung. Semua query berjalan melalui folder `api/`.

## Menjalankan Lokal

Prasyarat: Node.js 20+ dan npm.

```bash
source "$HOME/.nvm/nvm.sh"
npm install
```

Buat `.env.local`:

```env
POSTGRES_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=string-acak-minimal-32-karakter
```

Jalankan schema baru pada database kosong:

```bash
psql "$POSTGRES_URL" -f scripts/schema.sql
```

Untuk database lama yang sebelumnya memakai UUID/text wilayah, jalankan migrasi sekali:

```bash
psql "$POSTGRES_URL" -f scripts/migrate-numeric-wilayah.sql
psql "$POSTGRES_URL" -f scripts/migrate-simdes-wilayah.sql
```

Buat akun awal bila diperlukan:

```bash
node scripts/seed-admin.js
node scripts/seed-users.js
```

Tambahkan admin baru tanpa menulis password ke source code:

```bash
export ADMIN_NAME="Nama Admin"
export ADMIN_EMAIL="admin@desa.com"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
export ADMIN_ROLE=rw_admin
export ADMIN_RW=5
unset ADMIN_RT
node scripts/add-admin.js
unset ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD ADMIN_ROLE ADMIN_RW ADMIN_RT
```

Untuk admin RT, gunakan `ADMIN_ROLE=rt_admin` dan isi `ADMIN_RT`. Nomor RT tersebut harus sudah terdaftar pada RW yang dipilih.

Untuk menjalankan frontend dan API database secara stabil pada dua port, gunakan dua terminal:

```bash
# Terminal 1: API Vercel/Neon
npx vercel dev --listen 5174
```

```bash
# Terminal 2: frontend Vite
npm run dev -- --host 127.0.0.1 --port 5173
```

Buka `http://localhost:5173`. Vite meneruskan request `/api/*` ke `http://localhost:5174` melalui proxy.

Alternatif satu proses tetap tersedia dengan `npx vercel dev --listen 5173`, tetapi dua terminal lebih stabil untuk HMR browser.

## Perintah

```bash
npm run dev      # frontend Vite saja
npm run lint     # ESLint
npm run build    # build production
npm run preview  # preview hasil build
```

## API Aktif

- `POST /api/auth/login`
- `GET|POST /api/warga`
- `PUT|DELETE /api/warga/:id`
- `GET|POST /api/lingkungan`
- `GET|POST /api/infrastruktur`
- `GET|POST /api/aset`
- `GET|POST /api/keuangan/:jenis`
- `GET /api/keuangan/:jenis/summary`
- `GET|POST /api/kegiatan`
- `GET /api/public/kegiatan`

Jenis keuangan: `global`, `sampah`, `keamanan`, `dana-sosial`, `dana-kematian`, `kompensasi`.

Laporan kegiatan dapat dibuat oleh `rt_admin` atau `rw_admin` melalui menu Laporan Kegiatan. Foto dikompres di browser dan disimpan sebagai JSONB pada tabel `kegiatan` (maksimal 6 foto per laporan). Warga dapat membaca laporan dan dokumentasinya melalui dashboard warga, sedangkan endpoint publik tersedia melalui `/api/public/kegiatan`.

## Scope Akses

- `rw_admin`: melihat data seluruh RT dalam RW miliknya.
- `rt_admin`: melihat data pada nomor RT miliknya.
- `warga`: membaca data yang diizinkan dan laporan keuangan.

Saat membuat data sensus, isi `Nomor RW` dan `Nomor RT`. Kedua nilai disimpan sebagai angka pada database.

Data Lingkungan, Infrastruktur, Aset, dan seluruh transaksi keuangan juga menyimpan `id_rw` dan `id_rt`. `Nomor RT` boleh dikosongkan untuk transaksi tingkat RW, tetapi `Nomor RW` tetap wajib diisi.

Laporan `Kas Global` adalah agregasi seluruh tabel ledger: global, sampah, keamanan, dana sosial, dana kematian, dan kompensasi. Setiap transaksi tetap disimpan di tabel kategorinya agar dapat ditelusuri berdasarkan kategori, RW, dan RT.

## Migrasi ke Vercel

Pastikan environment tersedia pada Vercel:

```bash
vercel env ls
vercel deploy --prod
```

Environment wajib:

- `POSTGRES_URL`
- `JWT_SECRET`

Deploy production:

```bash
source "$HOME/.nvm/nvm.sh"
vercel deploy --prod
```

## Troubleshooting

- Login `401`: pastikan email dan password ada di tabel `users`.
- Error JWT: pastikan `JWT_SECRET` ada di `.env.local` dan environment Vercel.
- Data sensus kosong: cek `id_rw` dan `id_rt` pada user serta baris `sensus`; keduanya harus integer yang sesuai.
- API tidak ditemukan saat `npm run dev`: gunakan `npx vercel dev --listen 5173`.
- Batas Hobby Vercel: project menggunakan maksimal 12 Serverless Functions.


Script menambahkan admin

Script baru:
scripts/add-admin.js

Contoh admin RW:
source "$HOME/.nvm/nvm.sh"

export ADMIN_NAME="Nama Admin RW"
export ADMIN_EMAIL="admin@desa.com"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
export ADMIN_ROLE=rw_admin
export ADMIN_RW=5
unset ADMIN_RT

node scripts/add-admin.js

unset ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD ADMIN_ROLE ADMIN_RW ADMIN_RT




Contoh admin RT:
export ADMIN_NAME="Nama Admin RT"
export ADMIN_EMAIL="rt1@desa.com"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
export ADMIN_ROLE=rt_admin
export ADMIN_RW=5
export ADMIN_RT=7

node scripts/add-admin.js

unset ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD ADMIN_ROLE ADMIN_RW ADMIN_RT

Validasi script:

Password minimal 8 karakter.
Email harus unik.
RW harus sudah tersedia.
RT harus sudah terdaftar pada RW yang dipilih.
Password tidak disimpan di source code.


Gunakan dua terminal untuk localhost:

Terminal 1: API dan Neon
source "$HOME/.nvm/nvm.sh"
npx vercel dev --listen 5174

Terminal 2: Frontend
source "$HOME/.nvm/nvm.sh"
npm run dev -- --host 127.0.0.1 --port 5173

Buka:
http://127.0.0.1:5173