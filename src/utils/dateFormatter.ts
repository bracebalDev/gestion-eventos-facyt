/**
 * Utilidad unificada para formatear fechas a DD/MM/AAAA en toda la aplicación FaCyT 2.0
 */
export function formatDateDDMMAAAA(dateStr?: string): string {
  if (!dateStr) return 'N/A';

  // Si ya viene en formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Si es un ISO string o YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // fallback
  }

  return dateStr;
}
