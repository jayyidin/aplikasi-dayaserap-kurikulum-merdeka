import React, { useState, useEffect, useRef } from 'react';
import { Users, FileText, CheckCircle, Save, Printer, BookOpen, Award, Settings, Plus, Trash2, X, ChevronRight, GraduationCap, Loader2, Upload, FileSpreadsheet, ChevronDown, Edit2, ClipboardList, Sliders, TrendingUp, RefreshCw, Search } from 'lucide-react';

// --- DATA AWAL MOCKUP ---
const TUJUAN_PEMBELAJARAN_AWAL = [
  { id: 'tp1', kode: 'TP 1', deskripsi: 'Mengenal perangkat keras komputer dasar (Monitor, Keyboard, Mouse)' },
  { id: 'tp2', kode: 'TP 2', deskripsi: 'Menggunakan mouse untuk mengklik dan menahan (drag & drop)' },
  { id: 'tp3', kode: 'TP 3', deskripsi: 'Mengenal lingkungan kerja aplikasi pengolah gambar dasar (misal: MS Paint)' },
  { id: 'tp4', kode: 'TP 4', deskripsi: 'Memahami aturan dasar keamanan dan sikap duduk saat menggunakan perangkat teknologi' }
];

const DATA_SISWA_AWAL = [
  { id: 'S001', nis: '25001', nama: 'Ahmad Budi Santoso', gender: 'L' },
  { id: 'S002', nis: '25002', nama: 'Bunga Citra Lestari', gender: 'P' },
  { id: 'S003', nis: '25003', nama: 'Cakra Khan', gender: 'L' },
  { id: 'S004', nis: '25004', nama: 'Dian Sastrowardoyo', gender: 'P' },
  { id: 'S005', nis: '25005', nama: 'Eka Kurniawan', gender: 'L' },
];

// --- KONFIGURASI JENIS ASESMEN ---
const JENIS_ASESMEN_LIST = [
  { id: 'AH', label: 'Asesmen Harian (AH)' },
  { id: 'STS', label: 'Sumatif Tengah Semester (STS)' },
  { id: 'ASTS', label: 'Asesmen Sumatif Tengah Semester (ASTS)' },
  { id: 'ASAS', label: 'Asesmen Sumatif Akhir Semester (ASAS)' },
  { id: 'ASAT', label: 'Asesmen Sumatif Akhir Tahun (ASAT)' },
];

// --- STRUKTUR DATA MULTI-KELAS ---
const INITIAL_DATA = {
  'Kelas 1A': {
    siswa: DATA_SISWA_AWAL,
    tpList: [...TUJUAN_PEMBELAJARAN_AWAL],
    nilai: {}
  },
  'Kelas 1B': {
    siswa: [],
    tpList: [...TUJUAN_PEMBELAJARAN_AWAL],
    nilai: {}
  }
};

// KUNCI PENYIMPANAN UNTUK BROWSER (KODE BARU)
const LOCAL_STORAGE_KEY = 'edurapor_ikm_data_v1';

// URL API GOOGLE SHEETS (DARI GOOGLE APPS SCRIPT)
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxVTYzjMHexPAjtptQl_NgfuBUIGqKMOryCOq0P1QbfIgX85s36_dfQDXlxNJDId9x6/exec';

const getInitialData = () => {
  const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Gagal memuat data", e);
    }
  }
  return INITIAL_DATA;
};

export default function App() {
  // State Navigasi & UI Interaktif
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRapor, setIsLoadingRapor] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMassInputModal, setShowMassInputModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // STATE PENGATURAN PREDIKAT (KKTP)
  const [kktp, setKktp] = useState(() => {
    const saved = localStorage.getItem('edurapor_kktp');
    return saved ? JSON.parse(saved) : { sangatBaik: 85, baik: 75 };
  });

  // STATE PROFIL SEKOLAH
  const [schoolProfile, setSchoolProfile] = useState(() => {
    const saved = localStorage.getItem('edurapor_profile');
    const defaultProfile = { namaSekolah: 'SD Negeri Nusantara', tahunPelajaran: '2025/2026', kota: 'Nusantara', namaGuru: 'Siti Aminah, S.Pd.', nipGuru: '198501012010012001' };
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  });
  
  // STATE MODE CETAK
  const [printView, setPrintView] = useState(null);

  const fileInputRef = useRef(null);
  
  // State Data Master Berbasis Multi-Kelas (UBAH BARIS INI)
  const [appData, setAppData] = useState(getInitialData());
  const [activeClass, setActiveClass] = useState('Kelas 1A');
  const [activeAsesmen, setActiveAsesmen] = useState('STS');
  const [selectedSiswaId, setSelectedSiswaId] = useState(null);
  const [editingTpId, setEditingTpId] = useState(null);
  const [editingSiswaId, setEditingSiswaId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mengambil data berdasarkan kelas yang sedang aktif
  const currentData = appData[activeClass] || { siswa: [], tpList: [], nilai: {} };
  // Mengurutkan siswa berdasarkan nama A-Z
  const siswa = [...currentData.siswa].sort((a, b) => a.nama.localeCompare(b.nama));
  const tpList = currentData.tpList;
  const nilai = currentData.nilai[activeAsesmen] || {};

  // Reset pilihan siswa tiap kali ganti kelas atau asesmen
  useEffect(() => {
    setSelectedSiswaId(null);
    setEditingTpId(null);
    setEditingSiswaId(null);
    setSearchQuery('');
  }, [activeClass, activeAsesmen]);

  // AUTOSAVE: Menyimpan data otomatis ke memori browser (KODE BARU)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
  }, [appData]);

  // AUTOSAVE: Pengaturan KKTP
  useEffect(() => {
    localStorage.setItem('edurapor_kktp', JSON.stringify(kktp));
  }, [kktp]);

  // AUTOSAVE: Profil Sekolah
  useEffect(() => {
    localStorage.setItem('edurapor_profile', JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  // --- FUNGSI TARIK DATA (SINKRONISASI MANUAL & OTOMATIS) ---
  const tarikDataDariCloud = async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(GOOGLE_SHEETS_API_URL, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        const parsedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        if (Object.keys(parsedData).length > 0) {
          setAppData(parsedData);
          if (isManual) showToast('Data berhasil disinkronisasi dari Cloud!');
          else showToast('Berhasil memuat data terbaru dari Database Cloud!');
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Gagal menarik data dari cloud:", error);
      if (error.name === 'AbortError') {
        showToast(isManual ? 'Koneksi lambat (Timeout). Gagal sinkronisasi.' : 'Koneksi lambat (Timeout). Menggunakan data lokal terakhir...');
      } else if (isManual) {
        showToast('Gagal sinkronisasi data dengan Cloud.');
      }
    } finally {
      setIsInitialLoading(false);
      if (isManual) setIsSyncing(false);
    }
  };

  useEffect(() => {
    tarikDataDariCloud(false);
  }, []);

  // --- FUNGSI NOTIFIKASI ---
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- FUNGSI TRANSAKSI DENGAN ANIMASI ---
  const handleTabChange = (tabId) => {
    if (activeTab !== tabId) setActiveTab(tabId);
  };

  const simpanNilai = async () => {
    setIsSaving(true);

    // Timeout 15 detik untuk proses penyimpanan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      // Mengirimkan seluruh data aplikasi (appData) ke Google Sheets
      await fetch(GOOGLE_SHEETS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(appData),
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setIsSaving(false);
      showToast(`Data ${activeAsesmen} ${activeClass} berhasil disimpan ke Database Cloud!`);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Gagal simpan ke Cloud:", error);
      setIsSaving(false);
      if (error.name === 'AbortError') {
        showToast('Waktu simpan habis (Timeout). Data hanya disimpan secara lokal.');
      } else {
        showToast(`Data berhasil disimpan secara lokal (Gagal ke Cloud).`);
      }
    }
  };

  const handleSelectSiswaRapor = (id) => {
    if (id === selectedSiswaId) return;
    setIsLoadingRapor(true);
    setSelectedSiswaId(id);
    setTimeout(() => {
      setIsLoadingRapor(false);
    }, 500);
  };

  // --- FUNGSI MANAJEMEN KELAS ---
  const handleAddClass = () => {
    const inputEl = document.getElementById('newClassNameInput');
    const val = inputEl.value.trim();
    if (!val) return;
    
    if (appData[val]) {
      showToast('Nama kelas sudah ada!');
      return;
    }

    setAppData(prev => ({
      ...prev,
      [val]: {
        siswa: [],
        tpList: [...TUJUAN_PEMBELAJARAN_AWAL], 
        nilai: {}
      }
    }));
    setActiveClass(val);
    setShowClassModal(false);
    showToast(`Kelas ${val} berhasil ditambahkan!`);
  };

  const handleDeleteClass = (className) => {
    if (Object.keys(appData).length <= 1) {
      showToast('Minimal harus ada 1 kelas tersisa!');
      return;
    }
    const newAppData = { ...appData };
    delete newAppData[className];
    setAppData(newAppData);
    if (activeClass === className) setActiveClass(Object.keys(newAppData)[0]);
    showToast(`Kelas ${className} beserta isinya berhasil dihapus.`);
  };

  // --- FUNGSI EKSPOR & IMPOR (CSV) ---
  const handleExportCSV = () => {
    try {
      const headers = ['ID_Sistem', 'NIS', 'Nama_Siswa', 'Gender'];
      tpList.forEach(tp => headers.push(tp.kode));
      headers.push('Nilai_Akhir');

      const rows = siswa.map(s => {
        const row = [s.id, s.nis, `"${s.nama}"`, s.gender];
        tpList.forEach(tp => {
           row.push(nilai[s.id]?.[tp.id] !== undefined ? nilai[s.id][tp.id] : '');
        });
        row.push(hitungNilaiAkhir(s.id));
        return row.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Nilai_${activeAsesmen}_${activeClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(`Data ${activeClass} berhasil diekspor!`);
    } catch (error) {
      showToast('Terjadi kesalahan saat mengekspor data.');
    }
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const newSiswaList = [];
        let addedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());

          if (cols.length >= 3) {
            let id, nis, nama, gender;
            
            if (cols[0].startsWith('S') && cols[0].length < 20) {
              id = cols[0]; nis = cols[1]; nama = cols[2]; gender = cols[3];
            } else {
              id = `S${Date.now()}${i}`; nis = cols[0]; nama = cols[1];
              gender = cols[2] ? cols[2].toUpperCase().charAt(0) : 'L';
            }

            if (!siswa.find(s => s.nis === nis) && !newSiswaList.find(s => s.nis === nis)) {
              if (nis && nama) {
                newSiswaList.push({ id, nis, nama, gender: gender === 'P' ? 'P' : 'L' });
                addedCount++;
              }
            }
          }
        }

        if (addedCount > 0) {
          setAppData(prev => ({
            ...prev,
            [activeClass]: {
              ...prev[activeClass],
              siswa: [...prev[activeClass].siswa, ...newSiswaList]
            }
          }));
          showToast(`${addedCount} siswa baru diimpor ke ${activeClass}!`);
        } else {
          showToast('Tidak ada data baru. Pastikan format benar atau data tidak duplikat.');
        }
      } catch (error) {
        showToast('Gagal memproses file CSV. Pastikan format sesuai.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleProcessMassInput = (e) => {
    e.preventDefault();
    const text = e.target.massData.value;
    if (!text.trim()) return showToast('Data tidak boleh kosong!');

    const lines = text.split('\n');
    const newSiswaList = [];
    let addedCount = 0;

    lines.forEach((line, i) => {
      const cols = line.split(/\t|,/).map(col => col.trim()); 
      if (cols.length === 1 && cols[0]) {
        const nama = cols[0];
        // Generate NIS otomatis jika hanya memasukkan nama
        const nis = `AUTO-${Date.now().toString().slice(-4)}${i}`;
        newSiswaList.push({ id: `S${Date.now()}${i}`, nis, nama, gender: 'L' });
        addedCount++;
      } else if (cols.length >= 2) { 
        const nis = cols[0];
        const nama = cols[1];
        let gender = 'L'; 
        if (cols[2]) {
           const g = cols[2].toUpperCase();
           if (g === 'P' || g === 'PEREMPUAN' || g === 'W' || g === 'WANITA' || g === 'PR') gender = 'P';
        }

        if (nis && nama && !siswa.find(s => s.nis === nis) && !newSiswaList.find(s => s.nis === nis)) {
          newSiswaList.push({ id: `S${Date.now()}${i}`, nis, nama, gender });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      setAppData(prev => ({
        ...prev,
        [activeClass]: {
          ...prev[activeClass],
          siswa: [...prev[activeClass].siswa, ...newSiswaList]
        }
      }));
      setShowMassInputModal(false);
      showToast(`${addedCount} data siswa berhasil ditambahkan ke ${activeClass}!`);
    } else {
      showToast('Tidak ada data valid yang ditambahkan. Pastikan format benar atau bukan data duplikat.');
    }
  };

  // --- FUNGSI CRUD DATA MASTER ---
  const handleAddSiswa = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSiswa = {
      id: `S${Date.now()}`,
      nis: formData.get('nis'),
      nama: formData.get('nama'),
      gender: formData.get('gender')
    };
    if (!newSiswa.nis || !newSiswa.nama) return showToast('NIS dan Nama harus diisi!');
    
    setAppData(prev => ({
      ...prev, [activeClass]: { ...prev[activeClass], siswa: [...prev[activeClass].siswa, newSiswa] }
    }));
    e.target.reset();
    showToast('Siswa berhasil ditambahkan');
  };

  const handleDeleteSiswa = (id) => {
    const newNilai = { ...currentData.nilai };
    Object.keys(newNilai).forEach(asesmen => {
      if (newNilai[asesmen][id]) delete newNilai[asesmen][id];
    });

    setAppData(prev => ({
      ...prev, [activeClass]: {
        ...prev[activeClass],
        siswa: prev[activeClass].siswa.filter(s => s.id !== id),
        nilai: newNilai
      }
    }));
    if (selectedSiswaId === id) setSelectedSiswaId(null);
    showToast('Data siswa dihapus');
  };

  const handleSaveEditSiswa = (e, id) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newNis = formData.get('nis');
    const newNama = formData.get('nama');
    const newGender = formData.get('gender');

    if (!newNis || !newNama) return showToast('NIS dan Nama tidak boleh kosong!');

    setAppData(prev => ({
      ...prev,
      [activeClass]: {
        ...prev[activeClass],
        siswa: prev[activeClass].siswa.map(s =>
          s.id === id ? { ...s, nis: newNis, nama: newNama, gender: newGender } : s
        )
      }
    }));
    setEditingSiswaId(null);
    showToast('Data siswa berhasil diperbarui');
  };

  const handleAddTp = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTp = {
      id: `tp${Date.now()}`,
      kode: formData.get('kode'),
      deskripsi: formData.get('deskripsi')
    };
    if (!newTp.kode || !newTp.deskripsi) return showToast('Kode dan Deskripsi TP harus diisi!');
    
    setAppData(prev => ({
      ...prev, [activeClass]: { ...prev[activeClass], tpList: [...prev[activeClass].tpList, newTp] }
    }));
    e.target.reset();
    showToast('Tujuan Pembelajaran ditambahkan');
  };

  const handleDeleteTp = (id) => {
    setAppData(prev => ({
      ...prev, [activeClass]: { ...prev[activeClass], tpList: prev[activeClass].tpList.filter(tp => tp.id !== id) }
    }));
    showToast('Tujuan Pembelajaran dihapus');
  };

  const handleSaveEditTp = (e, id) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newKode = formData.get('kode');
    const newDeskripsi = formData.get('deskripsi');

    if (!newKode || !newDeskripsi) return showToast('Kode dan Deskripsi tidak boleh kosong!');

    setAppData(prev => ({
      ...prev,
      [activeClass]: {
        ...prev[activeClass],
        tpList: prev[activeClass].tpList.map(tp =>
          tp.id === id ? { ...tp, kode: newKode, deskripsi: newDeskripsi } : tp
        )
      }
    }));
    setEditingTpId(null);
    showToast('Tujuan Pembelajaran berhasil diperbarui');
  };

  // --- FUNGSI LOGIKA IKM ---
  const hitungNilaiAkhir = (siswaId) => {
    const nilaiSiswa = nilai[siswaId];
    if (!nilaiSiswa) return 0;
    
    let totalNilai = 0;
    let jumlahDiisi = 0;

    tpList.forEach(tp => {
      if (nilaiSiswa[tp.id] !== undefined && nilaiSiswa[tp.id] !== '') {
        totalNilai += Number(nilaiSiswa[tp.id]);
        jumlahDiisi++;
      }
    });

    return jumlahDiisi === 0 ? 0 : Math.round(totalNilai / jumlahDiisi);
  };

  const buatDeskripsiRapor = (siswaId) => {
    if (tpList.length === 0) return "Belum ada Tujuan Pembelajaran yang diatur.";
    
    const nilaiSiswa = nilai[siswaId];
    if (!nilaiSiswa || Object.keys(nilaiSiswa).length === 0) return "Belum ada data nilai untuk dianalisis.";

    let maxVal = -1;
    let minVal = 101;
    let tpTertinggi = [];
    let tpTerendah = [];

    tpList.forEach(tp => {
      const valText = nilaiSiswa[tp.id];
      if (valText !== undefined && valText !== '') {
        const val = Number(valText);
        if (val > maxVal) { maxVal = val; tpTertinggi = [tp.deskripsi]; } 
        else if (val === maxVal) { tpTertinggi.push(tp.deskripsi); }

        if (val < minVal) { minVal = val; tpTerendah = [tp.deskripsi]; } 
        else if (val === minVal) { tpTerendah.push(tp.deskripsi); }
      }
    });

    if (maxVal === -1) return "Belum ada nilai yang diinput secara lengkap.";

    let deskripsi = "";
    if (maxVal >= kktp.sangatBaik) deskripsi += `Menunjukkan penguasaan yang sangat baik dalam ${tpTertinggi.join(' dan ')}. `;
    else if (maxVal >= kktp.baik) deskripsi += `Menunjukkan penguasaan yang baik dalam ${tpTertinggi.join(' dan ')}. `;

    if (minVal < kktp.baik && minVal !== maxVal) deskripsi += `Perlu bimbingan lebih lanjut dalam ${tpTerendah.join(' dan ')}.`;
    else if (minVal >= kktp.baik && minVal !== maxVal) deskripsi += `Cukup baik dalam ${tpTerendah.join(' dan ')}, namun masih dapat terus ditingkatkan.`;

    return deskripsi || "Telah mengikuti pembelajaran dengan baik.";
  };

  const handleInputNilai = (siswaId, tpId, value) => {
    let numValue = parseInt(value, 10);
    if (value === '') numValue = '';
    else {
      if (isNaN(numValue)) return;
      if (numValue > 100) numValue = 100;
      if (numValue < 0) numValue = 0;
    }

    setAppData(prev => ({
      ...prev,
      [activeClass]: {
        ...prev[activeClass],
        nilai: {
          ...prev[activeClass].nilai,
          [activeAsesmen]: {
            ...(prev[activeClass].nilai?.[activeAsesmen] || {}),
            [siswaId]: {
              ...(prev[activeClass].nilai?.[activeAsesmen]?.[siswaId] || {}),
              [tpId]: numValue
            }
          }
        }
      }
    }));
  };

  // =====================================================================
  // KELOMPOK RENDER TAMPILAN MODE CETAK (FULLSCREEN PRINT PREVIEW)
  // =====================================================================

  const renderPrintViewRekap = () => {
    const asesmenLabel = JENIS_ASESMEN_LIST.find(a => a.id === activeAsesmen)?.label || activeAsesmen;
    
    return (
    <div className="min-h-screen bg-[#F8FAFC] py-4 sm:py-8 print:p-0 print:bg-white text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-10 shadow-2xl sm:rounded-2xl print:shadow-none print:rounded-none print:max-w-none print:p-0 overflow-x-auto hide-scrollbar">
        
        <div className="print:hidden flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-100 sticky left-0">
          <button onClick={() => setPrintView(null)} className="w-full sm:w-auto justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold flex items-center space-x-2 text-slate-700 transition-colors">
            <X size={18} /> <span>Kembali ke Aplikasi</span>
          </button>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <p className="text-sm text-slate-500 hidden sm:block">
              Tekan <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl + P</kbd> jika tombol tidak merespon.
            </p>
            <button onClick={() => window.print()} className="w-full sm:w-auto justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
              <Printer size={18} /> <span>Cetak Rekap Sekarang</span>
            </button>
          </div>
        </div>

        <div className="min-w-[800px] print:min-w-0">
          <div className="text-black text-sm">
            <div className="text-center font-bold text-lg mb-8 leading-relaxed uppercase">
              {asesmenLabel} GANJIL<br/>
              {schoolProfile.namaSekolah}<br/>
              TAHUN PELAJARAN {schoolProfile.tahunPelajaran}
            </div>
            
            <div className="flex justify-between items-start mb-6 font-semibold">
              <div>
                <table className="text-left">
                  <tbody>
                    <tr><td className="pr-4 pb-1.5">Mata Pelajaran</td><td>: Informatika (Praktik)</td></tr>
                    <tr><td className="pr-4 pb-1.5">Kelas/Semester</td><td>: {activeClass} / Ganjil</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="text-left">
                  <tbody>
                    <tr><td className="pr-4 pb-1.5">Bentuk Praktik</td><td>: Project Digital</td></tr>
                    <tr><td className="pr-4 pb-1.5">Teknis Praktik</td><td>: Individu</td></tr>
                    <tr><td className="pr-4 pb-1.5">Waktu</td><td>: 70 menit/2JP</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th rowSpan="2" className="border border-black py-2 px-1 text-center w-10">No</th>
                  <th rowSpan="2" className="border border-black py-2 px-3 text-left">Nama</th>
                  <th colSpan={tpList.length} className="border border-black py-2 px-2 text-center">Nilai Intrakurikuler</th>
                  <th rowSpan="2" className="border border-black py-2 px-2 text-center w-24">Nilai Akhir</th>
                </tr>
                <tr className="bg-slate-50">
                  {tpList.map(tp => (
                    <th key={tp.id} className="border border-black py-1.5 px-2 text-center">{tp.kode}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siswa.map((s, index) => (
                  <tr key={s.id}>
                    <td className="border border-black py-1.5 px-1 text-center">{index + 1}</td>
                    <td className="border border-black py-1.5 px-3 text-left whitespace-nowrap">{s.nama}</td>
                    {tpList.map(tp => (
                      <td key={tp.id} className="border border-black py-1.5 px-2 text-center">
                        {nilai[s.id]?.[tp.id] || ''}
                      </td>
                    ))}
                    <td className="border border-black py-1.5 px-2 text-center font-bold">
                      {hitungNilaiAkhir(s.id) || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderKertasRaporContent = (idSiswa) => {
    const s = siswa.find(item => item.id === idSiswa);
    if (!s) return null;

    return (
      <div className="w-full relative text-black">
        <div className="border-b-4 border-double border-slate-800 pb-6 mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Laporan Hasil Belajar</h1>
              <p className="text-slate-600 text-sm font-medium mt-1">Kurikulum Merdeka - Fase A ({activeAsesmen})</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center font-bold text-slate-800 text-xs text-center leading-tight">
                TUT WURI<br/>HANDAYANI
              </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8 text-sm text-slate-800">
            <div className="flex border-b border-slate-100 pb-2"><span className="w-36 text-slate-500">Nama Peserta Didik</span><span className="font-bold uppercase">: {s.nama}</span></div>
            <div className="flex border-b border-slate-100 pb-2"><span className="w-32 text-slate-500">Kelas / Fase</span><span className="font-semibold">: {activeClass} / A</span></div>
            <div className="flex border-b border-slate-100 pb-2"><span className="w-36 text-slate-500">Nomor Induk (NIS)</span><span className="font-semibold">: {s.nis}</span></div>
            <div className="flex border-b border-slate-100 pb-2"><span className="w-32 text-slate-500">Tahun Pelajaran</span><span className="font-semibold">: {schoolProfile.tahunPelajaran}</span></div>
            <div className="flex border-b border-slate-100 pb-2"><span className="w-36 text-slate-500">Nama Sekolah</span><span className="font-semibold">: {schoolProfile.namaSekolah}</span></div>
            <div className="flex border-b border-slate-100 pb-2"><span className="w-32 text-slate-500">Semester</span><span className="font-semibold">: Ganjil</span></div>
        </div>

        <div className="mb-10">
          <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Muatan Pelajaran</h3>
          <table className="w-full border-collapse border-2 border-slate-800">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-800 py-3 px-4 text-left w-1/4">Mata Pelajaran</th>
                <th className="border border-slate-800 py-3 px-4 text-center w-24">Nilai Akhir</th>
                <th className="border border-slate-800 py-3 px-4 text-left">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-800 p-4 align-top font-bold text-slate-800">
                  Informatika<br/>
                  <span className="font-normal text-xs text-slate-500">(Muatan Lokal Dasar)</span>
                </td>
                <td className="border border-slate-800 p-4 align-top text-center">
                  <span className="text-2xl font-black text-slate-900">
                    {hitungNilaiAkhir(s.id)}
                  </span>
                </td>
                <td className="border border-slate-800 p-4 align-top text-slate-800 text-sm leading-relaxed text-justify">
                  {buatDeskripsiRapor(s.id)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 mt-16 text-sm text-center text-slate-800">
          <div><p className="mb-16">Mengetahui,<br/>Orang Tua/Wali</p><p className="border-b border-slate-800 inline-block w-40"></p></div>
          <div></div>
          <div><p className="mb-16">{schoolProfile.kota}, 18 Desember 2025<br/>Wali Kelas</p><p className="font-bold underline underline-offset-4">{schoolProfile.namaGuru}</p><p className="mt-1">NIP. {schoolProfile.nipGuru}</p></div>
        </div>
      </div>
    );
  };

  const renderPrintViewRapor = () => {
    if (!selectedSiswaId) {
      setPrintView(null);
      return null;
    }
    
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-4 sm:py-8 print:p-0 print:bg-white text-slate-900 font-sans flex justify-center">
        <div className="w-full max-w-[21cm] bg-white p-4 sm:p-12 shadow-2xl sm:rounded-2xl print:shadow-none print:rounded-none print:max-w-none print:p-0 overflow-x-auto hide-scrollbar">
          <div className="print:hidden flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-100 sticky left-0">
            <button onClick={() => setPrintView(null)} className="w-full sm:w-auto justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold flex items-center space-x-2 text-slate-700 transition-colors">
              <X size={18} /> <span>Kembali ke Aplikasi</span>
            </button>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <p className="text-sm text-slate-500 hidden sm:block">Tekan <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl + P</kbd></p>
              <button onClick={() => window.print()} className="w-full sm:w-auto justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                <Printer size={18} /> <span>Cetak Rapor</span>
              </button>
            </div>
          </div>
          
          <div className="min-w-[700px] print:min-w-0">
            {renderKertasRaporContent(selectedSiswaId)}
          </div>
        </div>
      </div>
    );
  };

  if (printView === 'rekap') return renderPrintViewRekap();
  if (printView === 'rapor') return renderPrintViewRapor();


  // =====================================================================
  // KELOMPOK RENDER TAMPILAN APLIKASI INTERAKTIF
  // =====================================================================

  const renderDashboard = () => {
    // Kalkulasi Daya Serap (Rata-rata persentase per TP)
    const dayaSerapData = tpList.map(tp => {
      let total = 0;
      let count = 0;
      siswa.forEach(s => {
        const val = nilai[s.id]?.[tp.id];
        if (val !== undefined && val !== '') {
          total += Number(val);
          count++;
        }
      });
      return { ...tp, avg: count === 0 ? 0 : Math.round(total / count) };
    });

    const overallAvg = dayaSerapData.length > 0
      ? Math.round(dayaSerapData.reduce((acc, curr) => acc + curr.avg, 0) / dayaSerapData.length)
      : 0;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5 group custom-pop-in" style={{animationDelay: '0ms'}}>
          <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300"><Users size={28} /></div>
          <div><p className="text-sm text-slate-500 font-medium mb-1">Peserta Didik ({activeClass})</p><p className="text-3xl font-bold text-slate-800">{siswa.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5 group custom-pop-in" style={{animationDelay: '100ms'}}>
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300"><BookOpen size={28} /></div>
          <div><p className="text-sm text-slate-500 font-medium mb-1">Tujuan Pembelajaran</p><p className="text-3xl font-bold text-slate-800">{tpList.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5 group custom-pop-in" style={{animationDelay: '200ms'}}>
          <div className="bg-purple-50 p-4 rounded-xl text-purple-600 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300"><GraduationCap size={28} /></div>
          <div><p className="text-sm text-slate-500 font-medium mb-1">Total Kelas Terkelola</p><p className="text-3xl font-bold text-slate-800">{Object.keys(appData).length}</p></div>
        </div>
      </div>

      {/* GRAFIK DAYA SERAP */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm custom-pop-in" style={{animationDelay: '250ms'}}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <TrendingUp size={20} className="text-indigo-600" />
                <span>Grafik Daya Serap ({activeAsesmen})</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">Persentase rata-rata nilai kelas berdasarkan Tujuan Pembelajaran.</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center space-x-3 w-fit shadow-sm">
              <span className="text-sm font-semibold text-slate-600">Rata-rata Kelas:</span>
              <span className={`text-xl font-black ${overallAvg >= kktp.sangatBaik ? 'text-emerald-600' : overallAvg >= kktp.baik ? 'text-blue-600' : overallAvg > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{overallAvg}%</span>
            </div>
        </div>
        
        <div className="space-y-4">
          {dayaSerapData.length === 0 ? (
            <p className="text-center text-slate-400 py-4 text-sm">Belum ada data nilai atau Tujuan Pembelajaran.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {dayaSerapData.map(tp => (
                <div key={tp.id} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-slate-700 cursor-help" title={tp.deskripsi}>{tp.kode} <span className="font-normal text-slate-400 text-xs hidden sm:inline ml-1">- {tp.deskripsi.length > 40 ? tp.deskripsi.substring(0,40)+'...' : tp.deskripsi}</span></span>
                    <span className="font-bold text-slate-800">{tp.avg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80 ${tp.avg >= kktp.sangatBaik ? 'bg-emerald-500' : tp.avg >= kktp.baik ? 'bg-blue-500' : tp.avg > 0 ? 'bg-orange-500' : 'bg-slate-300'}`} style={{ width: `${tp.avg}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[550px] overflow-hidden custom-pop-in" style={{animationDelay: '300ms'}}>
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative flex-wrap gap-3">
            <div><h2 className="text-lg font-bold text-slate-800">Siswa {activeClass}</h2></div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowMassInputModal(true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-indigo-200"><ClipboardList size={14} /><span>Paste Data</span></button>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
              <button onClick={() => fileInputRef.current.click()} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200"><Upload size={14} /><span>Impor CSV</span></button>
            </div>
          </div>
          <div className="p-5 border-b border-slate-50 bg-slate-50/50">
            <form onSubmit={handleAddSiswa} className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                <input name="nis" placeholder="NIS" className="w-full sm:w-1/4 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" required />
                <input name="nama" placeholder="Nama Lengkap Siswa" className="w-full sm:flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" required />
              </div>
              <div className="flex flex-row gap-3 w-full sm:w-auto">
                <select name="gender" className="flex-1 sm:w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"><option value="L">L</option><option value="P">P</option></select>
                <button type="submit" className="bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-slate-700 active:scale-95 transition-all shadow-sm flex items-center justify-center hover:shadow-md flex-1 sm:flex-none sm:w-auto"><Plus size={20} className="hover:rotate-90 transition-transform duration-300 mr-1 sm:mr-0" /><span className="sm:hidden font-semibold">Tambah</span></button>
              </div>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {siswa.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 custom-float"><Users size={48} className="opacity-20" /><p className="text-sm">Belum ada data siswa di {activeClass}.</p><button onClick={() => setShowMassInputModal(true)} className="text-indigo-600 font-semibold text-sm hover:underline mt-2">Gunakan fitur Paste Data Excel</button></div>
            ) : (
              <ul className="space-y-2">
                {siswa.map((s, idx) => (
                  editingSiswaId === s.id ? (
                    <li key={s.id} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 transition-colors animate-in fade-in">
                      <form onSubmit={(e) => handleSaveEditSiswa(e, s.id)} className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input name="nis" defaultValue={s.nis} placeholder="NIS" className="w-full sm:w-1/4 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm" required />
                          <input name="nama" defaultValue={s.nama} placeholder="Nama Lengkap" className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm" required />
                          <select name="gender" defaultValue={s.gender} className="w-full sm:w-20 px-2 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm cursor-pointer"><option value="L">L</option><option value="P">P</option></select>
                        </div>
                        <div className="flex justify-end space-x-2 mt-1">
                          <button type="button" onClick={() => setEditingSiswaId(null)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">Batal</button>
                          <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm active:scale-95"><Save size={14} /><span>Simpan</span></button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li key={s.id} className="custom-slide-up flex justify-between items-center p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors group" style={{animationDelay: `${idx * 20}ms`}}>
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 pr-2">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-transform duration-300 group-hover:scale-110 ${s.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{s.nama.charAt(0)}</div>
                        <div className="flex-1 min-w-0"><p className="font-semibold text-slate-800 text-sm truncate">{s.nama}</p><p className="text-xs text-slate-500 mt-0.5">NIS: {s.nis}</p></div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setEditingSiswaId(s.id)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all active:scale-90" title="Edit Siswa"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteSiswa(s.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all active:scale-90" title="Hapus Siswa"><Trash2 size={18} /></button>
                      </div>
                    </li>
                  )
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[550px] overflow-hidden custom-pop-in" style={{animationDelay: '400ms'}}>
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative">
            <div><h2 className="text-lg font-bold text-slate-800">Tujuan Pembelajaran</h2><p className="text-xs text-slate-500 mt-0.5">TP khusus untuk {activeClass}</p></div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">{tpList.length} TP</div>
          </div>
          <div className="p-5 border-b border-slate-50 bg-slate-50/50">
            <form onSubmit={handleAddTp} className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                <input name="kode" placeholder="Kode (Misal: TP 5)" className="w-full sm:w-1/3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm" required />
                <input name="deskripsi" placeholder="Deskripsi Capaian..." className="w-full sm:flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm" required />
              </div>
              <button type="submit" className="w-full sm:w-auto py-2.5 bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center justify-center hover:shadow-md"><Plus size={20} className="hover:rotate-90 transition-transform duration-300 mr-1 sm:mr-0" /><span className="sm:hidden font-semibold">Tambah TP</span></button>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {tpList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 custom-float"><BookOpen size={48} className="opacity-20" /><p className="text-sm">Belum ada Tujuan Pembelajaran.</p></div>
            ) : (
              <ul className="space-y-2">
                {tpList.map((tp, idx) => (
                  editingTpId === tp.id ? (
                    <li key={tp.id} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 transition-colors animate-in fade-in">
                      <form onSubmit={(e) => handleSaveEditTp(e, tp.id)} className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input name="kode" defaultValue={tp.kode} placeholder="Kode" className="w-full sm:w-1/3 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm" required />
                          <input name="deskripsi" defaultValue={tp.deskripsi} placeholder="Deskripsi Capaian" className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm" required />
                        </div>
                        <div className="flex justify-end space-x-2 mt-1">
                          <button type="button" onClick={() => setEditingTpId(null)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">Batal</button>
                          <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm active:scale-95"><Save size={14} /><span>Simpan</span></button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li key={tp.id} className="custom-slide-up flex items-start justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors group" style={{animationDelay: `${idx * 50}ms`}}>
                      <div className="flex space-x-4 pr-4"><div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold h-fit whitespace-nowrap group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">{tp.kode}</div><span className="text-slate-600 text-sm leading-relaxed">{tp.deskripsi}</span></div>
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setEditingTpId(tp.id)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all active:scale-90" title="Edit TP"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteTp(tp.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all active:scale-90" title="Hapus TP"><Trash2 size={18} /></button>
                      </div>
                    </li>
                  )
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      </div>
    );
  };

  const renderInputNilai = () => {
    const filteredSiswa = siswa.filter(s => 
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nis.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col custom-pop-in">
          <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-start lg:items-center z-20 relative flex-col lg:flex-row gap-4 lg:gap-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Buku Nilai ({activeClass} - {activeAsesmen})</h2>
              <p className="text-sm text-slate-500 mt-1">Masukkan nilai formatif/sumatif (Skala 0-100).</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-56 lg:w-64 shrink-0">
                <input type="text" placeholder="Cari Siswa atau NIS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
                <button onClick={() => setPrintView('rekap')} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 sm:py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all active:scale-95 shadow-md shrink-0" title={`Buka pratinjau tabel Nilai ${activeAsesmen}`}>
                  <Printer size={18} /><span>Cetak {activeAsesmen}</span>
                </button>
                <button onClick={handleExportCSV} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 sm:py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all active:scale-95 shrink-0" title="Download ke format Excel (CSV)">
                  <FileSpreadsheet size={18} /><span>Ekspor Excel</span>
                </button>
                <button onClick={simpanNilai} disabled={isSaving} className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-md shadow-indigo-500/20 active:scale-95 shrink-0 ${isSaving ? 'opacity-80 cursor-not-allowed' : ''}`}>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}<span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
                </button>
              </div>
            </div>
          </div>
        
        <div className="overflow-auto custom-scrollbar max-h-[600px]">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="p-3 sm:p-4 font-semibold w-12 sm:w-16 text-center sticky left-0 top-0 bg-slate-50 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">No</th>
                <th className="p-3 sm:p-4 font-semibold sticky left-12 sm:left-16 top-0 bg-slate-50 z-40 shadow-[4px_0_10px_rgba(0,0,0,0.03)] min-w-[200px] sm:min-w-[250px]">Data Peserta Didik</th>
                {tpList.map(tp => (
                  <th key={tp.id} className="p-4 font-medium text-center w-28 text-xs leading-tight group sticky top-0 bg-slate-50 z-30" title={tp.deskripsi}>
                    <div className="bg-white border border-slate-200 px-2 py-1.5 rounded-md inline-block group-hover:border-indigo-300 group-hover:text-indigo-700 transition-colors cursor-help">{tp.kode}</div>
                  </th>
                ))}
                <th className="p-4 font-bold text-center w-28 sticky top-0 bg-indigo-50/90 backdrop-blur-sm text-indigo-800 border-l border-indigo-100 z-30">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siswa.length === 0 ? (
                <tr>
                  <td colSpan={tpList.length + 3} className="p-12 text-center text-slate-400 bg-white">
                    <div className="flex flex-col items-center justify-center space-y-3 custom-float"><Users size={40} className="opacity-20" /><p>Belum ada siswa di kelas {activeClass}.</p></div>
                  </td>
                </tr>
              ) : filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={tpList.length + 3} className="p-12 text-center text-slate-400 bg-white">
                    <div className="flex flex-col items-center justify-center space-y-3"><Search size={40} className="opacity-20" /><p>Siswa dengan pencarian "{searchQuery}" tidak ditemukan.</p></div>
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, index) => {
                  const na = hitungNilaiAkhir(s.id);
                  return (
                    <tr key={s.id} className="custom-slide-up hover:bg-slate-50/80 transition-colors group bg-white" style={{animationDelay: `${index * 20}ms`}}>
                      <td className="p-3 sm:p-4 text-center text-slate-400 font-medium sticky left-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{index + 1}</td>
                      <td className="p-3 sm:p-4 sticky left-12 sm:left-16 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[4px_0_10px_rgba(0,0,0,0.03)]">
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{s.nama}</p>
                        <p className="text-xs text-slate-400 mt-0.5">NIS: {s.nis}</p>
                      </td>
                      {tpList.map(tp => (
                        <td key={tp.id} className="p-3 text-center">
                          <input type="number" inputMode="numeric" min="0" max="100" className="hide-number-spin w-16 sm:w-20 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all group-hover:border-slate-300 hover:border-slate-400" value={nilai[s.id]?.[tp.id] !== undefined ? nilai[s.id][tp.id] : ''} onChange={(e) => handleInputNilai(s.id, tp.id, e.target.value)} placeholder="-" />
                        </td>
                      ))}
                      <td className="p-4 text-center border-l border-slate-50">
                        <span className={`font-bold px-3 py-1.5 rounded-lg text-sm inline-block min-w-[3rem] transition-colors ${na >= kktp.sangatBaik ? 'bg-emerald-100 text-emerald-700' : na >= kktp.baik ? 'bg-blue-100 text-blue-700' : na > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>{na || '-'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    );
  };

  const renderRapor = () => (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
      <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit flex flex-col max-h-[350px] xl:max-h-[600px] custom-pop-in">
        <div className="p-5 border-b border-slate-100 bg-white">
          <h3 className="font-bold text-slate-800">Rapor {activeClass}</h3>
          <p className="text-xs text-slate-500 mt-1">Pilih siswa untuk pratinjau dokumen</p>
        </div>
        <div className="overflow-y-auto p-3 flex-1 space-y-1 custom-scrollbar">
          {siswa.length === 0 ? (
            <p className="text-center text-slate-400 p-8 text-sm custom-float">Data siswa kosong</p>
          ) : (
            siswa.map((s, idx) => (
              <button key={s.id} onClick={() => handleSelectSiswaRapor(s.id)} className={`custom-slide-up w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedSiswaId === s.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 translate-x-2' : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:translate-x-1'}`} style={{animationDelay: `${idx * 20}ms`}}>
                <div className="overflow-hidden">
                  <div className={`font-semibold text-sm truncate transition-colors ${selectedSiswaId === s.id ? 'text-white' : 'text-slate-800 group-hover:text-indigo-600'}`}>{s.nama}</div>
                  <div className={`text-xs mt-0.5 ${selectedSiswaId === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>NIS: {s.nis}</div>
                </div>
                {selectedSiswaId === s.id && <ChevronRight size={16} className="text-white opacity-80" />}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="xl:col-span-3 flex justify-center bg-slate-200/50 rounded-3xl p-3 sm:p-8 border border-slate-200 border-dashed relative overflow-x-auto hide-scrollbar custom-pop-in" style={{animationDelay: '100ms'}}>
        {isLoadingRapor && (
           <div className="absolute inset-0 z-10 bg-slate-200/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
             <Loader2 size={40} className="text-indigo-600 animate-spin mb-3" />
             <p className="text-indigo-800 font-medium text-sm animate-pulse">Menyiapkan Rapor IKM...</p>
           </div>
        )}
        {selectedSiswaId && siswa.find(s=> s.id === selectedSiswaId) ? (
          <div className={`bg-white shadow-2xl rounded-sm w-max min-w-[700px] sm:min-w-0 sm:w-full max-w-[21cm] p-6 sm:p-12 relative transition-all duration-500 ${isLoadingRapor ? 'scale-95 opacity-50 blur-sm' : 'custom-scale-up opacity-100 blur-0'}`}>
            {renderKertasRaporContent(selectedSiswaId)}
            <div className="fixed bottom-6 right-6 lg:absolute lg:bottom-auto lg:top-12 lg:right-[-80px] flex flex-col gap-3 print:hidden z-40">
              <button onClick={() => setPrintView('rapor')} className="bg-indigo-600 lg:bg-slate-800 hover:bg-indigo-700 lg:hover:bg-slate-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-xl transition-all active:scale-90 lg:hover:rotate-12 hover:-translate-y-1 lg:hover:translate-y-0" title="Buka Mode Cetak Penuh Layar"><Printer size={24} /></button>
            </div>
          </div>
        ) : (
          <div className="bg-transparent h-96 w-full flex flex-col items-center justify-center text-slate-400 custom-float">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4"><Award size={40} className="text-slate-300" /></div>
            <p className="font-medium text-slate-500">Pilih dokumen siswa</p>
            <p className="text-sm mt-1">Pratinjau rapor akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      
      {isInitialLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center space-y-4 custom-pop-in max-w-sm text-center">
            <div className="bg-indigo-50 p-4 rounded-full text-indigo-600 mb-2">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Memuat Data...</h3>
              <p className="text-sm text-slate-500 font-medium">Sinkronisasi dengan Database Cloud</p>
            </div>
          </div>
        </div>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center space-y-4 custom-pop-in max-w-sm text-center">
            <div className="bg-indigo-50 p-4 rounded-full text-indigo-600 mb-2">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Menyimpan Data...</h3>
              <p className="text-sm text-slate-500 font-medium">Mengunggah ke Database Cloud</p>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto max-w-sm sm:max-w-none bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 z-50 custom-toast border border-slate-700">
          <CheckCircle size={18} className="text-emerald-400 custom-bounce" />
          <span className="font-medium text-sm tracking-wide">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white ml-2 outline-none p-1 transition-colors"><X size={16} /></button>
        </div>
      )}

      {showMassInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden custom-pop-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2">
                <ClipboardList size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">Input Massal (Paste Data)</h3>
              </div>
              <button onClick={() => setShowMassInputModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200"><X size={18}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-4 rounded-xl mb-4 leading-relaxed">
                <strong>Cara Penggunaan:</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Buka file Microsoft Excel / Google Sheets Anda.</li>
                  <li>Copy (Blok lalu tekan <code>Ctrl + C</code>) kolom <strong>NIS, Nama Lengkap, dan L/P</strong> (atau bisa juga hanya daftar <strong>Nama Lengkap</strong> saja).</li>
                  <li>Paste (Tekan <code>Ctrl + V</code>) ke dalam kotak di bawah ini.</li>
                </ol>
              </div>
              <form onSubmit={handleProcessMassInput} className="flex flex-col h-full">
                <textarea name="massData" placeholder="Contoh format lengkap:&#10;25001&#9;Budi Santoso&#9;L&#10;25002&#9;Siti Aminah&#9;P&#10;&#10;Atau cukup ketik nama saja:&#10;Andi Wijaya&#10;Citra Kirana" className="w-full h-48 px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-mono resize-y whitespace-pre" required></textarea>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowMassInputModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center space-x-2"><Save size={16} /><span>Proses Data</span></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden custom-pop-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Manajemen Kelas</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200"><X size={18}/></button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tambah Kelas Baru</label>
                <div className="flex space-x-2">
                  <input id="newClassNameInput" type="text" placeholder="Misal: Kelas 1C, Kelas 2A..." className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  <button onClick={handleAddClass} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm font-semibold active:scale-95 transition-all">Tambah</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between"><span>Daftar Kelas Tersimpan</span><span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{Object.keys(appData).length} Kelas</span></label>
                <ul className="space-y-2 max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {Object.keys(appData).map(c => (
                    <li key={c} className={`flex justify-between items-center p-3 border rounded-xl transition-all ${activeClass === c ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center min-w-0 pr-2">
                        <span className="font-bold text-slate-800 text-sm truncate">{c}</span>
                        <span className="text-xs text-slate-500 font-medium ml-2 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{appData[c].siswa.length} Siswa</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {activeClass !== c && <button onClick={() => {setActiveClass(c); setShowClassModal(false);}} className="text-xs text-indigo-600 font-semibold px-2 hover:underline">Pilih</button>}
                        {Object.keys(appData).length > 1 && <button onClick={() => handleDeleteClass(c)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Hapus Kelas"><Trash2 size={16}/></button>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden custom-pop-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Pengaturan Aplikasi</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200"><X size={18}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                  <input type="text" value={schoolProfile.namaSekolah} onChange={e => setSchoolProfile({...schoolProfile, namaSekolah: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                    <input type="text" value={schoolProfile.tahunPelajaran} onChange={e => setSchoolProfile({...schoolProfile, tahunPelajaran: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Kota / Kab</label>
                    <input type="text" value={schoolProfile.kota} onChange={e => setSchoolProfile({...schoolProfile, kota: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Wali Kelas</label>
                    <input type="text" value={schoolProfile.namaGuru} onChange={e => setSchoolProfile({...schoolProfile, namaGuru: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">NIP Wali Kelas</label>
                    <input type="text" value={schoolProfile.nipGuru} onChange={e => setSchoolProfile({...schoolProfile, nipGuru: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                </div>

                <hr className="border-slate-100 my-4" />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Minimum "Sangat Baik"</label>
                  <input type="number" value={kktp.sangatBaik} onChange={e => setKktp({...kktp, sangatBaik: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Minimum "Baik"</label>
                  <input type="number" value={kktp.baik} onChange={e => setKktp({...kktp, baik: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl border border-blue-100 mt-2 leading-relaxed">
                  <strong>Contoh:</strong> Nilai &ge; {kktp.sangatBaik} (Sangat Baik), &ge; {kktp.baik} (Baik), dan di bawah {kktp.baik} otomatis (Perlu Bimbingan).
                </div>
              </div>
              <div className="mt-6">
                <button onClick={() => setShowSettingsModal(false)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-semibold shadow-md active:scale-95 transition-all w-full flex items-center justify-center space-x-2"><Save size={16} /><span>Simpan & Tutup</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3.5 gap-3 sm:gap-0">
            <div className="flex items-center space-x-4 w-full sm:w-auto justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2 sm:p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/30 hover:scale-105 hover:-rotate-3 transition-all duration-300"><FileText size={24} strokeWidth={2.5} /></div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 tracking-tight">EduRapor</h1>
                  <div className="flex items-center space-x-2 mt-0.5"><span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">IKM Terpadu</span><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="text-[10px] sm:text-xs text-slate-400 font-medium">TP {schoolProfile.tahunPelajaran}</span></div>
                </div>
              </div>
              <button onClick={() => tarikDataDariCloud(true)} disabled={isSyncing} className="sm:hidden relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100" title="Sinkronisasi Data">
                <RefreshCw size={20} className={isSyncing ? "animate-spin text-indigo-600" : ""} />
              </button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-5 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
              <div className="flex items-center space-x-2 bg-white hover:bg-slate-50 px-2 py-1.5 rounded-full border border-slate-200 shadow-sm transition-colors relative group shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)] ml-2"></div>
                <div className="relative flex items-center">
                  <select value={activeClass} onChange={(e) => setActiveClass(e.target.value)} className="appearance-none bg-transparent font-bold text-slate-700 text-sm outline-none cursor-pointer pl-1 pr-6 py-1 hover:text-indigo-600 transition-colors z-10">{Object.keys(appData).map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="w-px h-5 bg-slate-200"></div>
                <button onClick={() => setShowClassModal(true)} className="flex text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-all items-center justify-center" title="Manajemen Kelas"><Settings size={16} /></button>
                <button onClick={() => setShowSettingsModal(true)} className="flex text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-all items-center justify-center" title="Pengaturan Aplikasi"><Sliders size={16} /></button>
              </div>

              <div className="flex items-center space-x-2 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm transition-colors relative group shrink-0">
                <div className="relative flex items-center">
                  <select value={activeAsesmen} onChange={(e) => setActiveAsesmen(e.target.value)} className="appearance-none bg-transparent font-bold text-slate-700 text-sm outline-none cursor-pointer pr-6 py-1 hover:text-indigo-600 transition-colors z-10">{JENIS_ASESMEN_LIST.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}</select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>

              <button onClick={() => tarikDataDariCloud(true)} disabled={isSyncing} className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100 hidden sm:block" title="Sinkronisasi Data">
                <RefreshCw size={20} className={isSyncing ? "animate-spin text-indigo-600" : ""} />
              </button>
              <div className="hidden md:flex items-center space-x-3 pl-5 border-l border-slate-200 shrink-0">
                <div className="text-right"><p className="text-sm font-bold text-slate-800 leading-none">{schoolProfile.namaGuru}</p><p className="text-xs text-slate-500 mt-1 font-medium">Wali Kelas</p></div>
                <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-sm hover:ring-4 ring-indigo-50 transition-all">{schoolProfile.namaGuru.charAt(0).toUpperCase()}</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-6 sm:mb-8 w-full sm:w-fit overflow-x-auto hide-scrollbar shadow-inner border border-slate-200/60 custom-pop-in">
          <button onClick={() => handleTabChange('dashboard')} className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2.5 whitespace-nowrap relative ${activeTab === 'dashboard' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 active:scale-95'}`}><Settings size={18} className={activeTab === 'dashboard' ? 'animate-[spin_4s_linear_infinite]' : ''}/><span>Data Master</span></button>
          <button onClick={() => handleTabChange('input')} className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2.5 whitespace-nowrap relative ${activeTab === 'input' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 active:scale-95'}`}><Users size={18} className={activeTab === 'input' ? 'custom-bounce' : ''} /><span>Input Nilai</span></button>
          <button onClick={() => handleTabChange('rapor')} className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2.5 whitespace-nowrap relative ${activeTab === 'rapor' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 active:scale-95'}`}><Award size={18} className={activeTab === 'rapor' ? 'text-indigo-600' : ''} /><span>Pratinjau Rapor</span></button>
        </div>

        <div className="min-h-[600px] relative">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'input' && renderInputNilai()}
          {activeTab === 'rapor' && renderRapor()}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes customPopIn { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes customSlideUp { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes customScaleUp { 0% { opacity: 0; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes customFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes customToastSlide { 0% { opacity: 0; transform: translate(-50%, 20px) scale(0.9); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        
        .custom-pop-in { animation: customPopIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .custom-slide-up { animation: customSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .custom-scale-up { animation: customScaleUp 0.4s ease-out forwards; }
        .custom-float { animation: customFloat 3s ease-in-out infinite; }
        .custom-toast { animation: customToastSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .custom-bounce { animation: bounce 2s infinite; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .hide-number-spin::-webkit-outer-spin-button,
        .hide-number-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .hide-number-spin { -moz-appearance: textfield; }

        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          header, nav, .print\\:hidden, .custom-toast { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .shadow-2xl { box-shadow: none !important; }
          .bg-slate-200\\/50 { background: white !important; border: none !important; padding: 0 !important; }
        }
      `}} />
    </div>
  );
}