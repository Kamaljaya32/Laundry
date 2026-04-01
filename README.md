# 🧺 Laundry POS App

Sebuah aplikasi seluler *Point of Sale* (POS) yang dirancang khusus untuk mempermudah operasional dan manajemen bisnis laundry. Aplikasi ini memungkinkan pencatatan transaksi yang efisien, manajemen layanan pelanggan, dan pemantauan data secara real-time.

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## ✨ Fitur Utama

* **Pencatatan Transaksi:** Mencatat pesanan masuk (kiloan, satuan, atau layanan khusus) dengan kalkulasi harga otomatis.
* **Manajemen Data Real-time:** Sinkronisasi data pesanan dan pelanggan secara instan menggunakan infrastruktur *cloud*.
* **Pelacakan Status Pesanan:** Memantau alur kerja laundry dari pesanan diterima, diproses, hingga selesai dan diambil.
* **Sistem Autentikasi:** Keamanan akses pengguna dan pengelola operasional.
* **Antarmuka Intuitif:** Desain UI/UX *mobile-first* yang mudah digunakan oleh kasir atau pengelola laundry.

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan tumpukan teknologi modern untuk memastikan performa yang cepat dan pengembangan yang skalabel:

* **Frontend:** React Native dengan [Expo](https://expo.dev/)
* **Bahasa Pemrograman:** TypeScript & JavaScript
* **Backend & Database:** Firebase (Authentication, Firestore/Realtime Database)
* **Navigasi:** Expo Router (File-based routing)

## 🚀 Panduan Instalasi (Getting Started)

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di mesin lokal Anda:

### Prasyarat
* Node.js telah terinstal
* Akun Expo (opsional, untuk pengujian di perangkat fisik)
* Proyek Firebase yang sudah dikonfigurasi

### Langkah Instalasi

1.  **Kloning Repositori**
    ```bash
    git clone [https://github.com/Kamaljaya32/Laundry.git](https://github.com/Kamaljaya32/Laundry.git)
    cd Laundry
    ```

2.  **Instalasi Dependensi**
    ```bash
    npm install
    ```

3.  **Konfigurasi Firebase**
    * Buka file `firebaseConfig.js` (atau buat jika belum ada).
    * Masukkan kredensial konfigurasi Firebase Anda (API Key, Auth Domain, Project ID, dll).

4.  **Jalankan Aplikasi**
    ```bash
    npx expo start
    ```

5.  **Uji Coba**
    * Tekan `a` untuk membuka di Android Emulator.
    * Tekan `i` untuk membuka di iOS Simulator.
    * Pindai kode QR menggunakan aplikasi **Expo Go** (Android/iOS) untuk mencoba di perangkat fisik Anda.

## 📂 Struktur Proyek

```text
Laundry/
├── app/                  # File-based routing untuk halaman (UI)
├── assets/               # Gambar, ikon, dan font
├── config/               # Konfigurasi aplikasi (seperti tema)
├── constants/            # Variabel konstan yang digunakan di seluruh aplikasi
├── hooks/                # Custom React Hooks
├── firebaseConfig.js     # Konfigurasi koneksi ke Firebase
└── package.json          # Dependensi dan skrip proyek
