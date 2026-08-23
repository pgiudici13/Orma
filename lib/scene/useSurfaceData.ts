"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Carica i dati di una superficie quando l'oggetto viene aperto (DEC-021).
 *
 * La cache è a livello di modulo e vive quanto la pagina: riaprire la cassetta
 * di Reparto un attimo dopo averla chiusa non deve ripartire da capo — il
 * tavolo è un ambiente in cui si prendono e si posano oggetti, non una serie
 * di caricamenti.
 *
 * Dopo una modifica la superficie chiama `reload()`: le Server Action di
 * scrittura invalidano la cache del server, non questa.
 */

const cache = new Map<string, unknown>();

/** Solo per i test: dimentica ciò che è già stato caricato. */
export function resetSurfaceCache() {
  cache.clear();
}

export type SurfaceState<T> = {
  data: T | null;
  loading: boolean;
  /** Presente se il caricamento è fallito: la superficie decide come dirlo. */
  failed: boolean;
  reload: () => void;
};

type InternalState<T> = { data: T | null; loading: boolean; failed: boolean };

export function useSurfaceData<T>(
  key: string,
  load: () => Promise<T>,
): SurfaceState<T> {
  const [state, setState] = useState<InternalState<T>>(() => ({
    data: (cache.get(key) as T) ?? null,
    loading: !cache.has(key),
    failed: false,
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;

    load()
      .then((result) => {
        cache.set(key, result);
        if (current) setState({ data: result, loading: false, failed: false });
      })
      .catch(() => {
        // Il pannello continua a mostrare ciò che ha già (per esempio i
        // prossimi eventi che l'oggetto porta con sé): un errore di rete non
        // deve svuotare una superficie già aperta.
        if (current) {
          setState((previous) => ({
            ...previous,
            loading: false,
            failed: true,
          }));
        }
      });

    return () => {
      current = false;
    };
    // `load` è ricreata ad ogni render dal chiamante: le dipendenze reali sono
    // la chiave della superficie e la richiesta esplicita di ricaricare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const reload = useCallback(() => {
    cache.delete(key);
    setState((previous) => ({ ...previous, loading: true, failed: false }));
    setAttempt((value) => value + 1);
  }, [key]);

  return { ...state, reload };
}
