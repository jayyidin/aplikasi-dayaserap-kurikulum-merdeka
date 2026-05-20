import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Mengatur timer untuk menunda pembaruan nilai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Membersihkan timeout jika value berubah sebelum delay selesai
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}