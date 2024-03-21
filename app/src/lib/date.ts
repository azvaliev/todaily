/* eslint-disable no-restricted-syntax */
const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

/**
  * Format date into YYYY-MM-DD
  * */
function formatDateYYYYMMDD(date: Date) {
  const parts = dateFormatter.formatToParts(date);

  let YYYY: string = '';
  let MM: string = '';
  let DD: string = '';

  for (const part of parts) {
    switch (part.type) {
      case 'year': {
        YYYY = part.value;
        break;
      }
      case 'month': {
        MM = part.value;
        break;
      }
      case 'day': {
        DD = part.value;
        break;
      }
      default: {
        break;
      }
    }
  }

  return `${YYYY}-${MM}-${DD}`;
}

export { formatDateYYYYMMDD };
