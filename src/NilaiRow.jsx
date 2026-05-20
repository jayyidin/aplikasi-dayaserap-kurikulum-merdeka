import React, { memo } from 'react';

const NilaiRow = memo(({
  siswa,
  index,
  tpList,
  nilaiSiswa,
  kktp,
  onInputNilai
}) => {
  // Kalkulasi nilai akhir dipindahkan ke dalam (lokal) agar komponen 100% pure
  // dan tidak bergantung pada closure dari App.jsx
  const hitungNilaiAkhirLokal = () => {
    if (!nilaiSiswa) return 0;
    let totalNilai = 0, jumlahDiisi = 0;
    tpList.forEach(tp => {
      if (nilaiSiswa[tp.id] !== undefined && nilaiSiswa[tp.id] !== '') {
        totalNilai += Number(nilaiSiswa[tp.id]);
        jumlahDiisi++;
      }
    });
    return jumlahDiisi === 0 ? 0 : Math.round(totalNilai / jumlahDiisi);
  };

  const na = hitungNilaiAkhirLokal();

  return (
    <tr className="custom-slide-up hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors group bg-white dark:bg-slate-800 border-b border-slate-50 dark:border-slate-700/50" style={{ animationDelay: `${index * 20}ms` }}>
      <td className="p-3 sm:p-4 text-center text-slate-400 dark:text-slate-500 font-medium sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-indigo-50/40 dark:group-hover:bg-indigo-900/20 transition-colors z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[3rem] sm:min-w-[4rem] box-border">
        {index + 1}
      </td>
      <td className="p-3 sm:p-4 sticky left-[3rem] sm:left-[4rem] bg-white dark:bg-slate-800 group-hover:bg-indigo-50/40 dark:group-hover:bg-indigo-900/20 transition-colors z-10 shadow-[4px_0_10px_rgba(0,0,0,0.03)] max-w-[140px] sm:max-w-[200px]">
        <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{siswa.nama}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">NIS: {siswa.nis}</p>
      </td>
      {tpList.map(tp => (
        <td key={tp.id} className="p-3 text-center">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            className="hide-number-spin w-16 sm:w-20 p-2 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-indigo-50/30 dark:focus:bg-indigo-900/40 outline-none text-sm font-bold text-slate-700 dark:text-white transition-all group-hover:border-slate-300 dark:group-hover:border-slate-500 hover:border-slate-400"
            value={nilaiSiswa?.[tp.id] !== undefined ? nilaiSiswa[tp.id] : ''}
            onChange={(e) => onInputNilai(siswa.id, tp.id, e.target.value)}
            placeholder="-"
          />
        </td>
      ))}
      <td className="p-4 text-center border-l border-slate-50 dark:border-slate-700/50">
        <span className={`font-bold px-3 py-1.5 rounded-lg text-sm inline-block min-w-[3rem] transition-colors ${na >= kktp.sangatBaik ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : na >= kktp.baik ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : na > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
          {na || '-'}
        </span>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Mencegah re-render jika objek nilai siswa ini tidak berubah secara referensi
  return prevProps.nilaiSiswa === nextProps.nilaiSiswa &&
         prevProps.siswa === nextProps.siswa &&
         prevProps.tpList === nextProps.tpList &&
         prevProps.kktp.sangatBaik === nextProps.kktp.sangatBaik &&
         prevProps.kktp.baik === nextProps.kktp.baik;
});

export default NilaiRow;