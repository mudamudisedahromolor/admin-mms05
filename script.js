/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS UTAMA    : SCRIPT.JS (LOGIKA INTERAKTIF & DATABASE REAL-TIME)
   ========================================================================== */

const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
let pemicuInstal = null; 

/* ==========================================================================
   1. SISTEM INISIALISASI UTAMA
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    initNavigasiMobile();
    initCarouselOrganisasi();
    initHeroSlider(); 
    initSistemPWA();
    
    if (document.getElementById('data-tabel-keuangan')) loadKeuanganDariDrive();
    if (document.getElementById('data-tabel-rapat')) loadRapatDariDrive();
    if (document.getElementById('data-tabel-dokumentasi')) loadDokumentasiDariDrive();
    if (document.getElementById('data-tabel-anggota')) loadAnggotaDariDrive(); 
});

/* ==========================================================================
   2. SISTEM NAVIGASI & MENU DROPDOWN MOBILE (HP)
   ========================================================================== */
function initNavigasiMobile() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    
    if (menuBtn && navBar) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navBar.classList.toggle('aktif'); 
        });
    }

    const btnBulanan = document.getElementById('btn-bulanan');
    const menuRapat = document.getElementById('menu-rapat');
    const btnTahunan = document.getElementById('btn-tahunan');
    const menu17an = document.getElementById('menu-17an');

    if (btnBulanan && menuRapat) {
        btnBulanan.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (menu17an) menu17an.classList.remove('buka'); 
            menuRapat.classList.toggle('buka');
        });
    }

    if (btnTahunan && menu17an) {
        btnTahunan.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (menuRapat) menuRapat.classList.remove('buka'); 
            menu17an.classList.toggle('buka');
        });
    }
}

/* ==========================================================================
   3. SISTEM CAROUSEL & SLIDER GAMBAR
   ========================================================================== */
function initCarouselOrganisasi() {
    if (document.querySelector('.mySwiper') && typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", {
            slidesPerView: 1, 
            spaceBetween: 15,
            centeredSlides: true, 
            loop: true,
            initialSlide: 2, 
            observer: true,
            observeParents: true,
            breakpoints: {
                768: { slidesPerView: 3, spaceBetween: 30 }
            }
        });
    }
}

const kegiatanData = [
    {
        gambar: "images/foto-tirakatan.jpg", 
        judul: "Malam Tirakatan 17 Agustus 2025",
        deskripsi: "Kegiatan rutin tahunan untuk memperingati Hari Kemerdekaan Indonesia. Warga berkumpul di madrasah dinniyah untuk doa bersama, refleksi perjuangan para pahlawan bangsa."
    },
    {
        gambar: "images/foto-lomba.jpg",
        judul: "Lomba Agustusan Tahun 2025",
        deskripsi: "Salah satu lomba anak yaitu pindah air dengan sendok untuk memperingati hari ulang tahun kemerdekaan Indonesia yang ke-80 Tahun"
    },
    {
        gambar: "images/momen-kebersamaan.jpg",
        judul: "Momen Kebersamaan di Evaluasi Kegiatan",
        deskripsi: "Momen indah di mana seluruh anggota organisasi berkumpul untuk mengevaluasi kegiatan dalam memperingati HUT-RI yang ke 80 tahun dari persiapan, eksekusi acara, serta harapan kedepannya"
    }
];

let slideIndex = 1, slideTimer;

function initHeroSlider() {
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('dots-container');
    
    if (!sliderContainer || !dotsContainer) return;

    let slidesHTML = "", dotsHTML = "";
    kegiatanData.forEach((item, index) => {
        slidesHTML += `
            <div class="slide ${index === 0 ? 'aktif' : ''}">
                <img src="${item.gambar}" alt="${item.judul}" class="slide-img">
                <div class="slide-content">
                    <h3>${item.judul}</h3><p>${item.deskripsi}</p>
                </div>
            </div>`;
        dotsHTML += `<span class="dot ${index === 0 ? 'aktif' : ''}" onclick="currentSlide(${index + 1})"></span>`;
    });
    
    sliderContainer.innerHTML = slidesHTML;
    dotsContainer.innerHTML = dotsHTML;

    showSlides(slideIndex);
    autoSlide();
}

function showSlides(n) {
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");
    
    if (slides.length === 0) return;

    if (n > slides.length) slideIndex = 1;    
    if (n < 1) slideIndex = slides.length;
    
    Array.from(slides).forEach(s => s.classList.remove("aktif"));
    Array.from(dots).forEach(d => d.classList.remove("aktif"));
    
    slides[slideIndex-1].classList.add("aktif");  
    dots[slideIndex-1].classList.add("aktif");
}

function autoSlide() {
    slideTimer = setInterval(() => { slideIndex++; showSlides(slideIndex); }, 5000);
}

window.currentSlide = function(n) { 
    showSlides(slideIndex = n); 
    clearInterval(slideTimer);
    autoSlide();
}

/* ==========================================================================
   4. SISTEM TRANSPARANSI KAS KEUANGAN (GOOGLE SHEETS TSV)
   ========================================================================== */
const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqiCluDyXYQijRAElBYLeYPzrT7ENOPtbaxnoHfyZXFFMMxnO1pnZuOAKJaaVgSvFs6eKacEAd4w5I/pub?gid=1216205715&single=true&output=tsv";
let dataKeuanganGlobal = [];
let dataTersaringGlobal = [];
let halamanSaatIni = 1;
const barisPerHalaman = 7;

function parseTanggalKeObjek(strTanggal) {
    if (!strTanggal) return new Date(0);
    const bagian = strTanggal.split("/");
    if (bagian.length !== 3) return new Date(0);
    return new Date(parseInt(bagian[2], 10), parseInt(bagian[1], 10) - 1, parseInt(bagian[0], 10));
}

function bersihkanNominal(teksNominal) {
    if (!teksNominal) return 0;
    let bersih = teksNominal.toString().replace(/Rp/gi, "").replace(/\s/g, "");
    bersih = bersih.replace(/[\.\,]/g, "");
    bersih = bersih.replace(/[^0-9-]/g, "");
    return parseInt(bersih, 10) || 0;
}

async function loadKeuanganDariDrive() {
    try {
        const response = await fetch(`${linkTsvKeuangan}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        const baris = teksData.split(/\r?\n/);
        
        dataKeuanganGlobal = [];
        let daftarTahun = new Set();
        let daftarBulan = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue; 
            
            const kolom = barisBersih.split("\t");
            if (kolom.length < 4) continue; 

            let tglRaw = kolom[0] ? kolom[0].trim() : "";       
            let ketTransaksi = kolom[1] ? kolom[1].trim() : ""; 
            let linkNotaRaw = kolom[5] ? kolom[5].trim() : "";  
            
            if (!tglRaw || tglRaw === "Tanggal" || ketTransaksi.toUpperCase() === "TOTAL") continue; 

            let nilaiC = kolom[2] ? bersihkanNominal(kolom[2]) : 0; 
            let nilaiD = kolom[3] ? bersihkanNominal(kolom[3]) : 0; 

            let statusTipe = "";
            let nominalFix = 0;

            if (nilaiC > 0 && nilaiD === 0) {
                statusTipe = "masuk"; 
                nominalFix = nilaiC;  
            } else if (nilaiD > 0 && nilaiC === 0) {
                statusTipe = "keluar"; 
                nominalFix = nilaiD;   
            } else {
                continue; 
            }

            let tglSplit = tglRaw.split("/");
            let thn = tglSplit[2] ? tglSplit[2].trim() : "2026";
            let bln = namaBulanIndo[parseInt(tglSplit[1], 10) - 1] || "Semua";

            daftarTahun.add(thn);
            daftarBulan.add(bln);

            dataKeuanganGlobal.push({ 
                tanggal: tglRaw, bulan: bln, tahun: thn, keterangan: ketTransaksi, tipe: statusTipe, jumlah: nominalFix.toString(), linkNota: linkNotaRaw
            });
        }

        dataKeuanganGlobal.sort((a, b) => parseTanggalKeObjek(b.tanggal) - parseTanggalKeObjek(a.tanggal));
        isiDropdown('filter-tahun', Array.from(daftarTahun).sort().reverse());
        isiDropdown('filter-bulan', Array.from(daftarBulan).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        terapkanFilter();
    } catch (e) {
        console.error("Gagal memuat data keuangan", e);
        const tBody = document.getElementById('data-tabel-keuangan');
        if (tBody) tBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data dari database.</td></tr>`;
    }
}

window.terapkanFilter = function() {
    const thnInput = document.getElementById('filter-tahun');
    const blnInput = document.getElementById('filter-bulan');
    const katInput = document.getElementById('filter-kategori');
    const cariInput = document.getElementById('input-cari');

    if(!thnInput || !blnInput || !katInput || !cariInput) return;

    const thn = thnInput.value;
    const bln = blnInput.value;
    const kat = katInput.value;
    const cari = cariInput.value.toLowerCase();

    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (kat === "Semua" || item.tipe === kat) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    let m = 0, k = 0;
    let dataUntukKartu = thn === "Semua" ? dataKeuanganGlobal : dataKeuanganGlobal.filter(item => item.tahun === thn);

    dataUntukKartu.forEach(i => {
        let n = parseInt(i.jumlah) || 0; 
        i.tipe === 'masuk' ? m += n : k += n;
    });

    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    
    const saldoCardTitle = document.querySelector('.card-box.saldo h4');
    if (saldoCardTitle) saldoCardTitle.innerHTML = `<i class="fa-solid fa-wallet"></i> Saldo Kas ${thn === "Semua" ? "Keseluruhan" : "(" + thn + ")"}`;
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);

    halamanSaatIni = 1; 
    renderTabel();
}

function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return;

    if (dataTersaringGlobal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Data transaksi tidak ditemukan.</td></tr>`;
        return;
    }

    const start = (halamanSaatIni - 1) * barisPerHalaman;
    const pageData = dataTersaringGlobal.slice(start, start + barisPerHalaman);
    
    let html = pageData.map(i => `
        <tr>
            <td>${i.tanggal}</td>
            <td>
                ${i.keterangan}
                ${i.linkNota && i.linkNota !== "-" && i.linkNota.trim() !== "" ? `<br><a href="${i.linkNota}" target="_blank" style="color:#E53935; font-size:10px; font-weight:bold; text-decoration:underline;">[Lihat Nota]</a>` : ""}
            </td>
            <td style="font-weight:bold;">
                ${i.tipe === 'masuk' ? '<span style="color:#2e7d32;"><i class="fa-solid fa-arrow-down"></i> Pemasukan</span>' : '<span style="color:#E53935;"><i class="fa-solid fa-arrow-up"></i> Pengeluaran</span>'}
            </td>
            <td><strong>${formatRupiah(parseInt(i.jumlah) || 0)}</strong></td>
        </tr>
    `).join('');

    const totalHal = Math.ceil(dataTersaringGlobal.length / barisPerHalaman);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;";
        if (halamanSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="nav(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halamanSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="nav(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9; border-top:1px solid #eee;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

window.nav = (dir) => { halamanSaatIni += dir; renderTabel(); };

/* ==========================================================================
   5. SISTEM NOTULEN & HASIL MUSYAWARAH RAPAT BULANAN
   ========================================================================== */
const linkTsvRapat = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRq9to0l-2kWwtGcTvwY70z_Ga8NAVmI-C_k4LYoDgTxGhqPY954gdkuRGmqRYe3wP-zSd6M9cUz-qC/pub?gid=1613608992&single=true&output=tsv";
let dataRapatGlobal = []; let dataRapatTersaring = []; let halRapatSaatIni = 1; const barisRapatPerHal = 5; 

async function loadRapatDariDrive() {
    try {
        const response = await fetch(`${linkTsvRapat}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        
        dataRapatGlobal = [];
        let daftarTahunRapat = new Set();
        let daftarBulanRapat = new Set();
        let baris = [], barisSaatIni = [], diDalamKutip = false, penampungTeks = "";

        for (let i = 0; i < teksData.length; i++) {
            let char = teksData[i], nextChar = teksData[i + 1];
            if (char === '"') {
                diDalamKutip = !diDalamKutip; 
            } else if (char === '\t' && !diDalamKutip) {
                barisSaatIni.push(penampungTeks.trim()); penampungTeks = "";
            } else if ((char === '\n' || char === '\r') && !diDalamKutip) {
                if (char === '\r' && nextChar === '\n') i++; 
                barisSaatIni.push(penampungTeks.trim());
                if (barisSaatIni.length > 0) baris.push(barisSaatIni);
                barisSaatIni = []; penampungTeks = "";
            } else { penampungTeks += char; }
        }
        if (penampungTeks) { barisSaatIni.push(penampungTeks.trim()); baris.push(barisSaatIni); }

        for (let i = 1; i < baris.length; i++) {
            let kolom = baris[i]; if (kolom.length < 5) continue;
            let tglRaw = kolom[1] || ""; let agendaRaw = kolom[2] || "-";
            let hasilRaw = kolom[3] || "-";
            let hasilFormatBaris = hasilRaw.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/\r/g, '<br>');
            let lokasiRaw = kolom[4] || "-";

            let tglSplit = tglRaw.includes("/") ? tglRaw.split("/") : tglRaw.split("-");
            let thn = tglSplit[2] || tglSplit[0] || "2026";
            if(thn.length > 4) thn = thn.substring(0,4); 
            let bln = namaBulanIndo[parseInt(tglSplit[1], 10) - 1] || "Semua";

            if(thn) daftarTahunRapat.add(thn);
            if(bln && bln !== "Semua") daftarBulanRapat.add(bln);

            dataRapatGlobal.push({ tanggal: tglRaw, bulan: bln, tahun: thn, agenda: agendaRaw, hasil: hasilFormatBaris, lokasi: lokasiRaw });
        }

        isiDropdown('filter-rapat-tahun', Array.from(daftarTahunRapat).sort().reverse());
        isiDropdown('filter-rapat-bulan', Array.from(daftarBulanRapat).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        terapkanFilterRapat();
    } catch (e) { console.error("Gagal memuat arsip rapat", e); }
}

window.terapkanFilterRapat = function() {
    const thn = document.getElementById('filter-rapat-tahun').value;
    const bln = document.getElementById('filter-rapat-bulan').value;
    const cari = document.getElementById('input-cari-rapat').value.toLowerCase();

    dataRapatTersaring = dataRapatGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && (bln === "Semua" || item.bulan === bln) && 
               (item.agenda.toLowerCase().includes(cari) || item.hasil.toLowerCase().includes(cari) || item.lokasi.toLowerCase().includes(cari));
    });
    halRapatSaatIni = 1; renderTabelRapat();
}

function renderTabelRapat() {
    const tbody = document.getElementById('data-tabel-rapat'); if (!tbody) return;
    if (dataRapatTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Tidak ada arsip hasil rapat yang cocok.</td></tr>`; return;
    }
    const start = (halRapatSaatIni - 1) * barisRapatPerHal;
    const pageData = dataRapatTersaring.slice(start, start + barisRapatPerHal);
    
    let html = pageData.map(i => `
        <tr>
            <td style="font-weight: 500; color: #333; vertical-align: top;"><i class="fa-regular fa-calendar-days" style="color:#E53935; margin-right:5px;"></i> ${i.tanggal}</td>
            <td style="font-weight: bold; color: #E53935; vertical-align: top;">${i.agenda}</td>
            <td style="vertical-align: top; padding-right:20px;"><div style="line-height: 1.6; text-align: left; color: #333;">${i.hasil}</div></td>
            <td style="vertical-align: top;"><i class="fa-solid fa-location-dot" style="color: #666; margin-right:4px;"></i> ${i.lokasi}</td>
        </tr>
    `).join('');

    const totalHal = Math.ceil(dataRapatTersaring.length / barisRapatPerHal);
    if (totalHal > 1) {
        let tombolNav = ""; const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;";
        if (halRapatSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="navRapat(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halRapatSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navRapat(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}
window.navRapat = (dir) => { halRapatSaatIni += dir; renderTabelRapat(); setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100); };

/* ==========================================================================
   6. SISTEM DOKUMENTASI & GALERI KEGIATAN
   ========================================================================== */
const linkTsvDokumentasi = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGNBxjdguHX3DyMAm4824Cw9Nv6t83MDuqojSZUcwftKAKyuC2jRLtPGId7FdK7w1asPeEVVtdSqqN/pub?gid=600804245&single=true&output=tsv";
let dataDokumentasiGlobal = []; let dataDokumentasiTersaring = []; let halDokSaatIni = 1; const barisDokPerHal = 5; 

async function loadDokumentasiDariDrive() {
    try {
        const response = await fetch(`${linkTsvDokumentasi}&cache=${new Date().getTime()}`);
        const teksData = await response.text(); const baris = teksData.split("\n");
        dataDokumentasiGlobal = []; let daftarTahunDok = new Set(); let daftarBulanDok = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim(); if (!barisBersih) continue;
            const kolom = barisBersih.split("\t"); if (kolom.length < 5) continue; 

            let tglRaw = kolom[1] ? kolom[1].trim() : ""; let agendaRaw = kolom[2] ? kolom[2].trim() : "-";
            let kegiatanRaw = kolom[3] ? kolom[3].trim() : "-"; let subjekRaw = kolom[4] ? kolom[4].trim() : "-";
            let linkFotoAsli = kolom[5] ? kolom[5].trim() : ""; if (!tglRaw) continue;

            let tglSplit = tglRaw.includes("/") ? tglRaw.split("/") : tglRaw.split("-");
            let thn = tglSplit[2] ? tglSplit[2].trim() : "2026"; if(thn.length > 4) thn = thn.substring(0,4);
            let bln = namaBulanIndo[parseInt(tglSplit[1], 10) - 1] || "Semua";

            if(thn) daftarTahunDok.add(thn); if(bln && bln !== "Semua") daftarBulanDok.add(bln);
            dataDokumentasiGlobal.push({ tanggal: tglRaw, bulan: bln, tahun: thn, agenda: agendaRaw, kegiatan: kegiatanRaw, subjek: subjekRaw, linkAsli: linkFotoAsli });
        }

        dataDokumentasiGlobal.sort((itemA, itemB) => {
            let splitA = itemA.tanggal.includes("/") ? itemA.tanggal.split("/") : itemA.tanggal.split("-");
            let splitB = itemB.tanggal.includes("/") ? itemB.tanggal.split("/") : itemB.tanggal.split("-");
            return new Date(splitB[2], splitB[1] - 1, splitB[0]) - new Date(splitA[2], splitA[1] - 1, splitA[0]);
        });

        isiDropdown('filter-dok-tahun', Array.from(daftarTahunDok).sort().reverse());
        isiDropdown('filter-dok-bulan', Array.from(daftarBulanDok).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        terapkanFilterDokumentasi();
    } catch (e) { console.error("Gagal memuat data dokumentasi", e); }
}

window.terapkanFilterDokumentasi = function() {
    const thn = document.getElementById('filter-dok-tahun').value;
    const bln = document.getElementById('filter-dok-bulan').value;
    const cari = document.getElementById('input-cari-dok').value.toLowerCase();

    dataDokumentasiTersaring = dataDokumentasiGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && (bln === "Semua" || item.bulan === bln) && 
               (item.agenda.toLowerCase().includes(cari) || item.kegiatan.toLowerCase().includes(cari) || item.subjek.toLowerCase().includes(cari));
    });
    halDokSaatIni = 1; renderTabelDokumentasi();
}

function renderTabelDokumentasi() {
    const tbody = document.getElementById('data-tabel-dokumentasi'); if (!tbody) return;
    if (dataDokumentasiTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#666;">Tidak ditemukan rekaman kegiatan yang cocok.</td></tr>`; return;
    }
    const start = (halDokSaatIni - 1) * barisDokPerHal;
    const pageData = dataDokumentasiTersaring.slice(start, start + barisDokPerHal);

    let html = pageData.map(i => {
        let kolomMedia = "";
        if (i.linkAsli) {
            let daftarLink = i.linkAsli.split(",").map(link => link.trim());
            kolomMedia = `<div style="display: flex; flex-direction: column; gap: 14px; align-items: center;">`;
            daftarLink.forEach((linkSingle, index) => {
                if (!linkSingle) return;
                let renderUrl = linkSingle, isImg = false;
                if (linkSingle.includes("id=")) {
                    let idFile = linkSingle.split("id=")[1].split("&")[0];
                    renderUrl = `https://drive.google.com/thumbnail?id=${idFile}&sz=w800`; isImg = true;
                } else if (linkSingle.includes("/d/")) {
                    let idFile = linkSingle.split("/d/")[1].split("/")[0];
                    renderUrl = `https://drive.google.com/thumbnail?id=${idFile}&sz=w800`; isImg = true;
                } else if (linkSingle.match(/\.(jpeg|jpg|gif|png)$/) != null) { isImg = true; }

                if (isImg) {
                    kolomMedia += `
                        <div style="text-align:center; margin-bottom: 5px;">
                            <a href="${linkSingle}" target="_blank"><img src="${renderUrl}" alt="${i.agenda}" style="max-width:260px; max-height:200px; object-fit:contain; background-color:#fafafa; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.12); border:1px solid #ddd;"></a><br>
                            <a href="${linkSingle}" target="_blank" style="font-size:11px; color:#E53935; text-decoration:none; display:inline-block; margin-top:4px; font-weight:600;"><i class="fa-solid fa-magnifying-glass-plus"></i> Foto ${index + 1} (Penuh)</a>
                        </div>`;
                } else {
                    kolomMedia += `<a href="${linkSingle}" target="_blank" style="padding:6px 12px; background:#f5f5f5; border:1px solid #ccc; border-radius:4px; text-decoration:none; color:#333; font-size:11px; display:inline-block; font-weight:bold;"><i class="fa-solid fa-paperclip" style="color:#E53935;"></i> Buka Berkas ${index + 1}</a>`;
                }
            });
            kolomMedia += `</div>`;
        } else { kolomMedia = `<div style="text-align:center; color:#999; font-style:italic; font-size:12px;">Tidak ada file</div>`; }

        return `<tr>
            <td style="font-weight:500; color:#444; vertical-align:top;"><i class="fa-regular fa-calendar" style="color:#E53935; margin-right:4px;"></i> ${i.tanggal}</td>
            <td style="vertical-align:top; padding-top:15px;">${kolomMedia}</td>
            <td style="font-weight:bold; color:#E53935; vertical-align:top; line-height:1.4;">${i.agenda}</td>
            <td style="font-weight:600; color:#555; vertical-align:top;">${i.subjek}</td>
            <td style="line-height:1.6; text-align:justify; white-space:pre-line; vertical-align:top; padding-right:10px;">${i.kegiatan}</td>
        </tr>`;
    }).join('');

    const totalHal = Math.ceil(dataDokumentasiTersaring.length / barisDokPerHal);
    if (totalHal > 1) {
        let tombolNav = ""; const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;";
        if (halDokSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="navDok(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halDokSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="navDok(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navDok(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navDok(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="5" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}
window.navDok = (dir) => { halDokSaatIni += dir; renderTabelDokumentasi(); setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100); };

/* ==========================================================================
   7. DATABASE ANGGOTA, UMUR JUJUR & FOTO POPUP
   ========================================================================== */
const linkTsvAnggota = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR45-ysPdK4uVibwJQbXKvaGGA2zlX3m2GnAS2392fiSDwENSz9ABffImneI-u4ZGmErvHbdM5RJoDi/pub?gid=992968433&single=true&output=tsv";
let dataAnggotaGlobal = []; let dataAnggotaTersaring = []; let halAnggotaSaatIni = 1; const barisAnggotaPerHal = 7; 

async function loadAnggotaDariDrive() {
    try {
        const response = await fetch(`${linkTsvAnggota}&cache=${new Date().getTime()}`);
        const teksData = await response.text(); const baris = teksData.split("\n");
        dataAnggotaGlobal = [];

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim(); if (!barisBersih) continue;
            const kolom = barisBersih.split("\t");
            
            let nama = kolom[2] ? kolom[2].trim() : "-"; let nim = kolom[4] ? kolom[4].trim() : "-";          
            let tglLahirRaw = kolom[6] ? kolom[6].trim() : ""; let linkFotoRaw = kolom[13] ? kolom[13].trim() : ""; 
            let usiaTeks = "-", tahunLahirInt = 0;

            let matchTahun = tglLahirRaw.match(/\b(19\d{2}|20\d{2})\b/);
            if (matchTahun) { tahunLahirInt = parseInt(matchTahun[0], 10); }

            if (tahunLahirInt > 0) {
                let tglInggris = tglLahirRaw.toLowerCase().replace('mei', 'may').replace('agu', 'aug').replace('okt', 'oct').replace('des', 'dec');
                let tglLahirObj = new Date(tglInggris); let hariIni = new Date(); let umur = hariIni.getFullYear() - tahunLahirInt;
                if (!isNaN(tglLahirObj.getTime())) {
                    let bulanSelisih = hariIni.getMonth() - tglLahirObj.getMonth();
                    if (bulanSelisih < 0 || (bulanSelisih === 0 && hariIni.getDate() < tglLahirObj.getDate())) { umur--; }
                }
                usiaTeks = umur + " Tahun";
            }
            if (tahunLahirInt > 0) { dataAnggotaGlobal.push({ nim: nim, nama: nama, tahunLahirInt: tahunLahirInt, usia: usiaTeks, foto: linkFotoRaw }); }
        }
        terapkanFilterAnggota();
    } catch (e) { console.error("Gagal memuat database anggota", e); }
}

window.terapkanFilterAnggota = function() {
    const cariInput = document.getElementById('input-cari-anggota'); if(!cariInput) return;
    const cari = cariInput.value.toLowerCase();
    dataAnggotaTersaring = dataAnggotaGlobal.filter(item => item.nama.toLowerCase().includes(cari) || item.nim.toLowerCase().includes(cari));
    halAnggotaSaatIni = 1; renderTabelAnggota();
}

function renderTabelAnggota() {
    const tbody = document.getElementById('data-tabel-anggota'); if (!tbody) return;
    if (dataAnggotaTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#666;"><strong>Data anggota tidak ditemukan.</strong></td></tr>`; return;
    }
    const start = (halAnggotaSaatIni - 1) * barisAnggotaPerHal; const dataPerHalaman = dataAnggotaTersaring.slice(start, start + barisAnggotaPerHal);
    
    let html = dataPerHalaman.map(i => {
        let linkDefaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(i.nama)}&background=E53935&color=fff&size=150&bold=true`;
        let urlFotoTampil = linkDefaultAvatar; 
        
        if (i.foto && i.foto !== "" && i.foto !== "-") {
            let idFile = "";
            if (i.foto.includes("id=")) { idFile = i.foto.split("id=")[1].split("&")[0]; } 
            else if (i.foto.includes("/d/")) { idFile = i.foto.split("/d/")[1].split("/")[0]; }
            if (idFile !== "") { urlFotoTampil = `https://drive.google.com/thumbnail?id=${idFile}&sz=w800`; } 
            else if (i.foto.startsWith("http")) { urlFotoTampil = i.foto; }
        }

        let generasi = "-";
        if (i.tahunLahirInt <= 1964) generasi = '<span style="background-color: #5D4037; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Baby Boomer</span>';
        else if (i.tahunLahirInt >= 1965 && i.tahunLahirInt <= 1980) generasi = '<span style="background-color: #7B1FA2; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen X</span>';
        else if (i.tahunLahirInt >= 1981 && i.tahunLahirInt <= 1996) generasi = '<span style="background-color: #0288D1; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Millennial</span>';
        else if (i.tahunLahirInt >= 1997 && i.tahunLahirInt <= 2012) generasi = '<span style="background-color: #388E3C; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen Z</span>';
        else if (i.tahunLahirInt >= 2013 && i.tahunLahirInt <= 2024) generasi = '<span style="background-color: #F57C00; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen Alpha</span>';

        return `<tr style="height: 90px; vertical-align: middle;"> 
            <td style="font-size: 14px; font-weight: bold; color: #555;">${i.nim}</td>
            <td style="padding: 10px 0;"><img src="${urlFotoTampil}" alt="Foto ${i.nama}" style="width: 75px; height: 75px; object-fit: cover; border-radius: 50%; border: 3px solid #E53935; box-shadow: 0 4px 8px rgba(0,0,0,0.15); display: block; margin: 0 auto; cursor: pointer;" onerror="this.src='${linkDefaultAvatar}'" onclick="event.stopPropagation(); window.bukaFotoFull('${urlFotoTampil}');"></td>
            <td style="text-align: left; padding-left: 20px; font-size: 15px; font-weight: 600; color: #333;"><i class="fa-solid fa-user" style="color:#E53935; margin-right:8px;"></i> ${i.nama}</td>
            <td><span class="badge-usia" style="font-size: 13px; font-weight: 600; padding: 4px 10px;">${i.usia}</span></td>
            <td>${generasi}</td>
        </tr>`;
    }).join('');

    const totalHal = Math.ceil(dataAnggotaTersaring.length / barisAnggotaPerHal);
    if (totalHal > 1) {
        let tombolNav = ""; const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;";
        if (halAnggotaSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="window.navAnggota(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halAnggotaSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="window.navAnggota(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="window.navAnggota(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="window.navAnggota(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="5" style="padding:12px; background:#f9f9f9; border-top:1px solid #eee;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

window.navAnggota = function(arah) { halAnggotaSaatIni += arah; renderTabelAnggota(); setTimeout(() => { document.querySelector('.finance-table').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
window.bukaFotoFull = function(url) { const modal = document.getElementById('modal-foto-full'); const imgModal = document.getElementById('img-modal-tampil'); if(modal && imgModal) { imgModal.src = url; modal.style.display = 'flex'; } };
window.tutupFoto = function() { const modal = document.getElementById('modal-foto-full'); if(modal) modal.style.display = 'none'; };

/* ==========================================================================
   8. SISTEM PROMPT SEBELUM INSTALASI PWA (VERSI FIX MACET HP)
   ========================================================================== */
function initSistemPWA() {
    const popup = document.getElementById('pwa-install-popup');
    const tombolInstal = document.getElementById('btn-instal-pwa');

    // Amankan: Langsung paksa tampil secara visual di gateway login
    if (popup) {
        popup.style.display = 'block';
    }

    // Tangkap pemicu instalasi resmi dari browser HP
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); 
        pemicuInstal = e;
        if (popup) popup.style.display = 'block';
    });

    // Logika klik tombol "Instal Sekarang"
    if (tombolInstal) {
        tombolInstal.addEventListener('click', async () => {
            // JIKA DI HP PEMICU OTOMATIS BELUM SIAP / MACET, JALANKAN ALTERNATIF INI:
            if (!pemicuInstal) {
                // Deteksi apakah user pakai perangkat iOS (iPhone/iPad)
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                
                if (isIOS) {
                    alert("Untuk iPhone/iOS, silakan klik tombol 'Share' (ikon kotak panah ke atas) di bagian bawah Safari, lalu pilih 'Add to Home Screen' / 'Tambahkan ke Layar Utama', Bro!");
                } else {
                    alert("Sistem browser HP kamu sedang memproses. Silakan klik tombol Titik Tiga di pojok kanan atas browser Chrome kamu, lalu pilih 'Tambahkan ke Layar Utama' atau 'Instal Aplikasi' ya, Bro!");
                }
                return;
            }
            
            // Jika pemicu otomatis browser siap, langsung jalankan instalasi resmi
            pemicuInstal.prompt();
            const { outcome } = await pemicuInstal.userChoice;
            console.log(`Pilihan user PWA: ${outcome}`);
            
            pemicuInstal = null; 
            tutupPopupInstal();
        });
    }

    window.addEventListener('appinstalled', () => { 
        console.log('Aplikasi MMS 05 Sukses Terinstal!');
        tutupPopupInstal(); 
    });
}

function tutupPopupInstal() { 
    const popup = document.getElementById('pwa-install-popup'); 
    if (popup) popup.style.display = 'none'; 
}
/* ==========================================================================
   9. GATEWAY LOGIN & VALIDASI ADMIN SECURITY
   ========================================================================== */
function validasiLogin() {
    const inputBox = document.getElementById('access-code');
    const errorBox = document.getElementById('error-message');
    if (!inputBox) return;
    
    const password = inputBox.value.trim(); 
    if (errorBox) { errorBox.textContent = ""; errorBox.style.display = "none"; }
    
    if (password === "admin1234") {
        sessionStorage.setItem("statusAdmin", "aktif");
        window.location.href = "admin.html";
    } else if (password === "") {
        if (errorBox) { errorBox.textContent = "Password tidak boleh kosong!"; errorBox.style.display = "block"; }
        inputBox.focus();
    } else {
        if (errorBox) { errorBox.textContent = "Password salah! Khusus internal BPH MMS 05."; errorBox.style.display = "block"; }
        inputBox.value = ""; inputBox.focus();
    }
}



/* ==========================================================================
   10. UTILITIES / FUNGSI PEMBANTU UMUM
   ========================================================================== */
function isiDropdown(id, dataArray) {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = el.options[0].outerHTML; 
    dataArray.forEach(item => {
        let opt = document.createElement("option"); opt.value = item; opt.text = item; el.appendChild(opt);
    });
}
function formatRupiah(angka) { return 'Rp ' + Math.abs(angka).toLocaleString('id-ID'); }




/* ==========================================================================
   11. DETECTOR DEVICE (ANDROID/IPHONE)
   ===========================================*/
function isIos() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator) && (window.navigator.standalone);
}

// Jalankan logika setelah halaman selesai dimuat
window.addEventListener('DOMContentLoaded', () => {
  if (isIos() && !isInStandaloneMode()) {
    const iosPrompt = document.getElementById('ios-prompt');
    if (iosPrompt) {
      iosPrompt.style.display = 'block';
    }
  }
});

/* ==========================================================================
   12. SISTEM MANAJEMEN ELIMINASI TURNAMEN (INTEGRASI GOOGLE APPS SCRIPT)
   ========================================================================== */
const URL_ENGINE_TURNAMEN = "https://script.google.com/macros/s/AKfycbxxdT597ae8mNFxb_MU4elx-CWKZ9kWDt6kzhsemCz8zHj4A_MZZGW0kTVRxKrYeo-e/exec"; 

// A. Fungsi Mengacak Bagan (POST)
window.triggerAcakBaganOtomatis = function() {
    const usiaRaw = document.getElementById('filter-usia').value;
    const genderRaw = document.getElementById('filter-gender').value;
    const kategori = document.getElementById('filter-kategori').value;

    // Standarisasi value untuk dikirim ke Apps Script robot
    const usia = usiaRaw.trim();
    const gender = genderRaw.trim().toLowerCase() === "semua" ? "semua" : genderRaw.trim();

    const konfirmasi = confirm(`Kunci data pendaftaran & acak bagan eliminasi murni untuk kelompok:\n\n» Usia: ${usia}\n» Gender: ${genderRaw}\n» Kategori: ${kategori}\n\nLanjutkan proses pengundian acak?`);
    if (!konfirmasi) return;

    const bodiPesan = {
        aksi: "generateBagan",
        targetUsia: usia,
        targetGender: gender, // Mengirim "semua", "Laki-laki", atau "Perempuan"
        targetKategori: kategori
    };

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #2c3e50; width: 100%; font-weight: bold;"><i class="fa-solid fa-spinner fa-spin"></i> Sedahromo Engine sedang mengacak urutan pendaftar...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual(); 
    })
    .catch(err => {
        console.error(err);
        alert("Bagan sukses diproses! Memuat ulang visual...");
        window.muatBaganLombaVisual();
    });
};

// B. Fungsi Mengambil & Menggambar Pohon Turnamen (GET)
window.muatBaganLombaVisual = function() {
    const usia = document.getElementById('filter-usia').value.trim();
    const genderRaw = document.getElementById('filter-gender').value.trim();
    const kategori = document.getElementById('filter-kategori').value.trim();
    const container = document.getElementById('bracket-container');
    
    if (!container) return;
    container.innerHTML = `<p style="text-align: center; color: #666; width: 100%;"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengambil draf pertandingan dari lembar kerja...</p>`;

    // Logika pembentukan identitas filter yang pas dengan nama di Apps Script
    const gender = genderRaw.toLowerCase() === "semua" ? "semua" : genderRaw;
    const identitasFilter = `${usia}_${gender}_${kategori}`;

    fetch(`${URL_ENGINE_TURNAMEN}?aksi=ambilBagan&identitasFilter=${encodeURIComponent(identitasFilter)}`)
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #999; width: 100%; padding: 20px;">Belum ada draf bagan pertandingan untuk kelompok ini.<br>Silakan klik tombol "Kunci & Acak Grup" untuk membuatnya.</p>`;
            return;
        }

        container.innerHTML = ""; 

        const rondeGrup = {};
        data.forEach(match => {
            if (!rondeGrup[match.ronde]) rondeGrup[match.ronde] = [];
            rondeGrup[match.ronde].push(match);
        });

        for (const namaRonde in rondeGrup) {
            const elemenRonde = document.createElement('div');
            elemenRonde.className = 'bracket-round';
            
            const judulRonde = document.createElement('h4');
            judulRonde.style = "text-align: center; margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; border-bottom: 2px solid #2c3e50; padding-bottom: 5px; font-weight: bold;";
            judulRonde.innerText = namaRonde.toUpperCase();
            elemenRonde.appendChild(judulRonde);

            rondeGrup[namaRonde].forEach(match => {
                const isP1Menang = match.pemenang.trim().toLowerCase() === match.p1.trim().toLowerCase() && match.p1 !== "";
                const isP2Menang = match.pemenang.trim().toLowerCase() === match.p2.trim().toLowerCase() && match.p2 !== "";

                let displaySkor1 = match.skor1 !== undefined ? match.skor1 : 0;
                let displaySkor2 = match.skor2 !== undefined ? match.skor2 : 0;
                
                let disableInput = false;
                if (match.p2.includes("BYE") || match.p2.includes("KOSONG")) {
                    displaySkor1 = 1; 
                    disableInput = true;
                }

                const elemenMatch = document.createElement('div');
                elemenMatch.className = 'bracket-match';
                
                elemenMatch.innerHTML = `
                    <div class="bracket-match-id">${match.matchId.split('-')[1] || match.matchId}</div>
                    <div class="bracket-team-row ${isP1Menang ? 'team-menang' : ''}">
                        <span class="bracket-team-name"><i class="fa-solid fa-user-group" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${match.p1}</span>
                        <input type="number" class="bracket-team-score" value="${displaySkor1}" min="0" max="99" 
                            style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0;"
                            ${disableInput ? 'disabled' : ''}
                            onchange="window.simpanSkorPertandingan('${match.matchId}', 1, this.value)">
                    </div>
                    <div class="bracket-team-row ${isP2Menang ? 'team-menang' : ''}">
                        <span class="bracket-team-name"><i class="fa-solid fa-user-group" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${match.p2}</span>
                        <input type="number" class="bracket-team-score" value="${displaySkor2}" min="0" max="99" 
                            style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0;"
                            ${disableInput ? 'disabled' : ''}
                            onchange="window.simpanSkorPertandingan('${match.matchId}', 2, this.value)">
                    </div>
                `;
                elemenRonde.appendChild(elemenMatch);
            });
            container.appendChild(elemenRonde);
        }
    })
    .catch(err => {
        container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-triangle-exclamation"></i> Gagal terhubung ke server robot. Pastikan deployment Apps Script benar.</p>`;
    });
};

// C. Fungsi Toggle Reset Robot Total (POST)
window.triggerResetRobotTotal = function() {
    const konfirmasi1 = confirm("PERINGATAN TINGKAT TINGGI!\n\nTindakan ini akan MENGHAPUS BERSIH data pendaftaran dan skema bagan aktif di dalam lembar kerja Google Sheets Robot.");
    if (!konfirmasi1) return;

    const konfirmasiKunci = prompt("Untuk memvalidasi tindakan pembersihan ini, silakan ketik teks 'RESET' pada kolom di bawah ini:");
    if (konfirmasiKunci !== "RESET") {
        alert("Pembersihan dibatalkan. Kata kunci verifikasi salah.");
        return;
    }

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-trash-can fa-fade"></i> Robot sedang menghapus seluruh baris data pendaftaran...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ aksi: "resetSystem" })
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual();
    })
    .catch(err => {
        console.error(err);
        alert("Sistem robot sukses dikosongkan kembali ke kondisi nol!");
        window.muatBaganLombaVisual();
    });
};

// Pemicu otomatis saat halaman dimuat pertama kali
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filter-usia')) {
        window.muatBaganLombaVisual();
    }
});

// D. Fungsi Kirim Data ke Database Utama & Auto-Reset Bagan
window.arsipDanAutoResetBagan = function() {
    const usia = document.getElementById('filter-usia').value.trim();
    const genderRaw = document.getElementById('filter-gender').value.trim();
    const kategori = document.getElementById('filter-kategori').value.trim();
    
    const gender = genderRaw.toLowerCase() === "semua" ? "semua" : genderRaw;
    const identitasFilter = `${usia}_${gender}_${kategori}`;

    const konfirmasi = confirm(`Apakah turnamen untuk kelompok:\n» ${usia} (${genderRaw} - ${kategori})\nsudah selesai total dan didapatkan Juara 1?\n\nJika YA, seluruh data pertandingan akan dikirim ke DATABASE UTAMA dan bagan aktif di robot akan langsung dibersihkan.`);
    if (!konfirmasi) return;

    const bodiPesan = {
        aksi: "simpanKeDatabase",
        identitasFilter: identitasFilter
    };

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Memindahkan riwayat pertandingan ke database eksternal...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual(); 
    })
    .catch(err => {
        console.error(err);
        alert("Proses arsip selesai! Mengosongkan bagan aktif...");
        window.muatBaganLombaVisual();
    });
};

// E. Fungsi Pengiriman Update Skor Real-Time
window.simpanSkorPertandingan = function(matchId, nomorPlayer, nilaiSkor) {
    console.log(`Mengirim update skor: ${matchId} | Player ${nomorPlayer} -> Skor: ${nilaiSkor}`);
    
    const bodiPesan = {
        aksi: "updateSkorMatch",
        matchId: matchId,
        playerKe: nomorPlayer,
        skorBaru: parseInt(nilaiSkor) || 0
    };

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        if (respon.status === "sukses") {
            console.log("Skor sukses disimpan!");
            window.muatBaganLombaVisual(); 
        } else {
            alert("Gagal memperbarui skor: " + respon.pesan);
        }
    })
    .catch(err => {
        console.error("Koneksi gagal saat update skor:", err);
    });
};

// F. Fungsi memicu majunya pemenang ke ronde berikutnya
window.triggerLanjutBabakRonde = function() {
    const usia = document.getElementById('filter-usia').value.trim();
    const genderRaw = document.getElementById('filter-gender').value.trim();
    const kategori = document.getElementById('filter-kategori').value.trim();
    
    const gender = genderRaw.toLowerCase() === "semua" ? "semua" : genderRaw;
    const identitasFilter = `${usia}_${gender}_${kategori}`;

    const konfirmasi = confirm(`Apakah seluruh skor Ronde saat ini sudah selesai diinput?\n\nKlik OK untuk menaikkan para pemenang ke babak berikutnya secara otomatis.`);
    if (!konfirmasi) return;

    const bodiPesan = {
        aksi: "lanjutRondeBerikutnya",
        identitasFilter: identitasFilter
    };

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual(); 
    })
    .catch(err => {
        console.error("Gagal melaju ke ronde berikutnya:", err);
    });
};
