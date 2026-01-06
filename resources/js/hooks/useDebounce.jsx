import { useState, useEffect } from 'react';

// Hook che ritarda l'aggiornamento del valore
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Imposta un timeout per aggiornare il valore dopo il delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Pulisce il timeout se il valore cambia prima che il delay sia passato
    // (questo è il trucco che cancella la richiesta precedente se l'utente continua a scrivere)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;