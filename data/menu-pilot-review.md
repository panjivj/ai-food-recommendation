# Review Manual — 14 Menu Pilot Approved

Dokumen ini mencatat hasil kurasi dataset. Seluruh nilai gizi dihitung otomatis
dari komponen TKPI 2017 berdasarkan berat yang dicantumkan. Status `approved`
berarti menu lolos gerbang data pilot, bukan sertifikasi klinis atau pengganti
penilaian ahli gizi.

## Ringkasan

| Hasil review | Jumlah |
| --- | ---: |
| Approved | 14 |
| Changes requested | 0 |
| Pending | 0 |

Aturan internal kurasi versi 1:

- Energi: sarapan 250–500 kkal, makan utama 350–650 kkal, dan camilan
  100–300 kkal.
- Natrium seluruh komponen harus tersedia. Batas internal adalah 600 mg untuk
  sarapan, 800 mg untuk makan utama, dan 400 mg untuk camilan.
- Makan utama harus memiliki makanan pokok, protein, sayur, dan buah.
- Sarapan yang disetujui harus memiliki makanan pokok, buah, serta sumber
  protein atau produk susu.
- Sumber dengan perbedaan energi terhadap estimasi makronutrien di atas 40%
  ditahan untuk pemeriksaan sumber.

Batas natrium per waktu makan adalah pembagian konservatif internal dari batas
harian WHO 2.000 mg, bukan angka resmi per waktu makan.

## Daftar pilot

| ID | Jenis | Menu | Porsi | Energi | Status review |
| --- | --- | --- | ---: | ---: | --- |
| pilot-003 | Sarapan | Ubi Kuning, Yoghurt, dan Apel | 400 g | 285,0 kkal | Approved |
| pilot-004 | Sarapan | Ubi Cilembu, Kacang Merah, dan Melon | 300 g | 386,6 kkal | Approved |
| pilot-005 | Sarapan | Jagung, Tahu, dan Jeruk | 300 g | 321,8 kkal | Approved |
| pilot-009 | Makan siang | Nasi, Ayam Kalasan, Bayam, dan Melon | 500 g | 533,0 kkal | Approved |
| pilot-010 | Makan siang | Nasi Merah, Ikan Baung, Buncis, dan Apel | 510 g | 425,4 kkal | Approved |
| pilot-012 | Makan siang | Nasi Merah, Pepes Mujahir, Wortel, dan Jeruk | 510 g | 388,7 kkal | Approved |
| pilot-015 | Makan siang | Nasi, Ayam Taliwang, Daun Singkong, dan Nanas | 500 g | 547,2 kkal | Approved |
| pilot-017 | Makan siang | Nasi, Ikan Patin, Kangkung, dan Nanas | 510 g | 447,6 kkal | Approved |
| pilot-018 | Makan malam | Nasi Merah, Ikan Papuyu, Wortel, dan Melon | 510 g | 408,6 kkal | Approved |
| pilot-019 | Makan malam | Nasi, Cumi, Bayam, dan Jeruk | 500 g | 533,0 kkal | Approved |
| pilot-021 | Makan malam | Nasi Merah, Tahu, Buncis, dan Jambu Biji | 500 g | 379,8 kkal | Approved |
| pilot-022 | Makan malam | Nasi, Tempe, Bayam, dan Melon | 490 g | 548,2 kkal | Approved |
| pilot-024 | Camilan | Pempek Telur dan Melon | 165 g | 138,4 kkal | Approved |
| pilot-025 | Camilan | Jagung, Yoghurt, dan Apel | 300 g | 251,0 kkal | Approved |

## Checklist per menu

- Nama dan kombinasi komponen masuk akal sebagai satu kali makan.
- Berat setiap komponen realistis dalam keadaan pangan yang disebutkan TKPI.
- Total energi sesuai rentang yang diinginkan untuk jenis makan tersebut.
- Protein, lemak, karbohidrat, serat, dan natrium telah ditinjau.
- Alergen diverifikasi dari resep sebenarnya; nama pangan saja tidak cukup.
- Kondisi kesehatan yang tidak sesuai sudah diberi tag atau pembatasan.
- Tidak ada nilai `null` yang keliru dianggap sebagai nol.
- Reviewer mencatat keputusan `approved` beserta alasan.

Alasan lengkap setiap menu tersimpan pada tabel `menu_reviews`.

## Audit penghapusan

Pada 28 Juli 2026, 11 kandidat yang sebelumnya berstatus
`changes_requested` dihapus dari katalog aktif: `pilot-001`, `pilot-002`,
`pilot-006`, `pilot-007`, `pilot-008`, `pilot-011`, `pilot-013`, `pilot-014`,
`pilot-016`, `pilot-020`, dan `pilot-023`. Definisi seed dan seluruh relasi
database kandidat tersebut juga telah dihapus agar katalog hanya memuat menu
yang sudah disetujui.

## Sumber aturan

- [Kementerian Kesehatan — Isi Piringku](https://ayosehat.kemkes.go.id/isi-piringku-kebutuhan-gizi-harian-seimbang)
- [Permenkes Nomor 28 Tahun 2019 tentang AKG](https://peraturan.bpk.go.id/Details/138621/Permenkes-No-28-%20Tahun-2019)
- [WHO — Healthy diet](https://www.who.int/health-topics/healthy-diet)
