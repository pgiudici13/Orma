"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  cercaMaestri,
  getSpecialitaAttive,
  type CercaMaestriFiltri,
  type MaestroRicerca,
} from "@/lib/queries/maestri";

/**
 * Azioni della Fase 8 (Maestri — ricerca globale).
 *
 * La scrittura del proprio profilo Maestro passa da qui, ma l'autorizzazione
 * resta la RLS: l'identità è quella della sessione, mai un id dal client
 * (`docs/PERMISSIONS.md`).
 */

export type CercaMaestriState = {
  risultati: MaestroRicerca[];
  /**
   * Le Specialità con percorso in corso dell'utente: solo per queste si può
   * associare il Maestro trovato (il Maestro vive su una carta).
   */
  mieSpecialitaAttive: string[];
  /** Vero dopo il primo submit: distingue "nessun risultato" da "non ancora cercato". */
  cercato: boolean;
};

export async function cercaMaestriAction(
  _previous: CercaMaestriState,
  formData: FormData,
): Promise<CercaMaestriState> {
  const filtri: CercaMaestriFiltri = {
    specialitaId: String(formData.get("specialitaId") ?? "") || undefined,
    regione: String(formData.get("regione") ?? "").trim() || undefined,
    zona: String(formData.get("zona") ?? "").trim() || undefined,
    soloDisponibili: formData.get("soloDisponibili") === "on",
  };

  const [risultati, mieSpecialitaAttive] = await Promise.all([
    cercaMaestri(filtri),
    getSpecialitaAttive(),
  ]);

  return { risultati, mieSpecialitaAttive, cercato: true };
}

/**
 * Associa come Maestro interno un utente trovato in ricerca, alla propria
 * Specialità in corso. Parametri diretti (come `startSpecialita`), non FormData:
 * la chiama il client dopo il submit del modulo di ricerca.
 */
export async function associaMaestroDaRicerca(
  specialitaId: string,
  maestroProfileId: string,
) {
  if (!specialitaId || !maestroProfileId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_specialita")
    .update({ maestro_profile_id: maestroProfileId, maestro_esterno_id: null })
    .eq("profile_id", user.id)
    .eq("specialita_id", specialitaId);

  if (error) {
    throw new Error(`Impossibile associare il Maestro: ${error.message}`);
  }

  revalidatePath("/");
}

export type SalvaMaestroProfiloState = { error?: string; success?: boolean };

/**
 * Salva il proprio profilo di Maestro (tessera): crea o aggiorna la riga
 * `maestro_profilo` e sostituisce le Specialità dichiarate. Il vincolo
 * "opt-in senza Specialità non ha senso" è una validazione applicativa: la
 * RLS non può esprimere dipendenze tra righe.
 */
export async function salvaMaestroProfilo(
  _previous: SalvaMaestroProfiloState | null,
  formData: FormData,
): Promise<SalvaMaestroProfiloState> {
  const visibile = formData.get("visibile") === "on";
  const disponibile = formData.get("disponibile") === "on";
  const regione = String(formData.get("regione") ?? "").trim() || null;
  const zona = String(formData.get("zona") ?? "").trim() || null;
  const localita = String(formData.get("localita") ?? "").trim() || null;
  const specialitaIds = formData.getAll("specialitaId").map(String);

  if (visibile && specialitaIds.length === 0) {
    return { error: "Indica almeno una Specialità che puoi accompagnare." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessione scaduta." };

  const { data: esistente } = (await supabase
    .from("maestro_profilo")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()) as unknown as { data: { id: string } | null };

  let maestroId: string;
  if (esistente) {
    const { error } = await supabase
      .from("maestro_profilo")
      .update({ visibile, regione, zona, localita, disponibile })
      .eq("id", esistente.id);
    if (error) {
      return { error: `Impossibile salvare: ${error.message}` };
    }
    maestroId = esistente.id;
  } else {
    const { data: inserito, error } = await supabase
      .from("maestro_profilo")
      .insert({
        profile_id: user.id,
        visibile,
        regione,
        zona,
        localita,
        disponibile,
      })
      .select("id")
      .single();
    if (error || !inserito) {
      return {
        error: `Impossibile salvare: ${error?.message ?? "errore sconosciuto"}`,
      };
    }
    maestroId = inserito.id;
  }

  // Sostituzione delle Specialità dichiarate: il modulo invia la lista completa.
  const { error: deleteError } = await supabase
    .from("maestro_specialita")
    .delete()
    .eq("maestro_id", maestroId);
  if (deleteError) {
    return {
      error: `Impossibile aggiornare le Specialità: ${deleteError.message}`,
    };
  }

  if (specialitaIds.length > 0) {
    const { error: insertError } = await supabase
      .from("maestro_specialita")
      .insert(
        specialitaIds.map((specialita_id) => ({
          maestro_id: maestroId,
          specialita_id,
        })),
      );
    if (insertError) {
      return {
        error: `Impossibile aggiornare le Specialità: ${insertError.message}`,
      };
    }
  }

  revalidatePath("/");
  return { success: true };
}
