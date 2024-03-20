/**
  * Format date into YYYY-MM-DD
  * */
function formatDate(date: Date) {
  const YYYY = date.getFullYear();
  const MM = date.getDay().toString().padStart(2, '0');
  const DD = date.getDay().toString().padStart(2, '0');

  return `${YYYY}-${MM}-${DD}`;
}

export { formatDate };
