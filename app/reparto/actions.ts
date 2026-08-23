"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Utente non autenticato.");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("id, reparto_id, ruolo, is_admin")
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      id: string;
      reparto_id: string | null;
      ruolo: string;
      is_admin: boolean;
    } | null;
  };

  if (!profile || !profile.reparto_id) {
    throw new Error("Profilo non associato ad alcun Reparto.");
  }

  const isCapoOrAdmin = profile.ruolo === "capo" || profile.is_admin;
  return { supabase, user, profile, isCapoOrAdmin };
}

export async function creaSquadriglia(formData: FormData) {
  const { supabase, profile, isCapoOrAdmin } =
    await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) throw new Error("Il nome della Squadriglia è obbligatorio.");

  const { error } = await supabase.from("squadriglia").insert({
    reparto_id: profile.reparto_id,
    nome,
  });

  if (error) throw new Error(`Errore nella creazione della Squadriglia: ${error.message}`);
  revalidatePath("/reparto");
}

export async function rinominaSquadriglia(
  squadrigliaId: string,
  formData: FormData,
) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) throw new Error("Il nome della Squadriglia è obbligatorio.");

  const { error } = await supabase
    .from("squadriglia")
    .update({ nome })
    .eq("id", squadrigliaId);

  if (error) throw new Error(`Errore nella modifica: ${error.message}`);
  revalidatePath("/reparto");
}

export async function eliminaSquadriglia(squadrigliaId: string) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { error } = await supabase
    .from("squadriglia")
    .delete()
    .eq("id", squadrigliaId);

  if (error) throw new Error(`Errore nell'eliminazione: ${error.message}`);
  revalidatePath("/reparto");
}

export async function assegnaMembroSquadriglia(
  profileId: string,
  formData: FormData,
) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const rawSquadrigliaId = formData.get("squadriglia_id") as string | null;
  const squadrigliaId =
    rawSquadrigliaId && rawSquadrigliaId !== "nessuna"
      ? rawSquadrigliaId.trim()
      : null;

  const { error } = await supabase.rpc("assegna_squadriglia", {
    p_profile_id: profileId,
    p_squadriglia_id: squadrigliaId,
  });

  if (error) throw new Error(`Errore nell'assegnazione: ${error.message}`);
  revalidatePath("/reparto");
}

export async function creaEvento(formData: FormData) {
  const { supabase, profile, isCapoOrAdmin } =
    await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const titolo = (formData.get("titolo") as string)?.trim();
  const tipo = formData.get("tipo") as string;
  const dataInizio = formData.get("data_inizio") as string;
  const dataFineRaw = (formData.get("data_fine") as string)?.trim();
  const dataFine = dataFineRaw ? dataFineRaw : null;
  const luogo = (formData.get("luogo") as string)?.trim() || null;
  const descrizione = (formData.get("descrizione") as string)?.trim() || null;

  if (!titolo) throw new Error("Il titolo dell'evento è obbligatorio.");
  if (!dataInizio) throw new Error("La data di inizio è obbligatoria.");

  const { error } = await supabase.from("evento").insert({
    reparto_id: profile.reparto_id,
    titolo,
    tipo,
    data_inizio: dataInizio,
    data_fine: dataFine,
    luogo,
    descrizione,
  });

  if (error) throw new Error(`Errore nella creazione dell'evento: ${error.message}`);
  revalidatePath("/reparto");
  revalidatePath("/");
}

export async function modificaEvento(eventoId: string, formData: FormData) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const titolo = (formData.get("titolo") as string)?.trim();
  const tipo = formData.get("tipo") as string;
  const dataInizio = formData.get("data_inizio") as string;
  const dataFineRaw = (formData.get("data_fine") as string)?.trim();
  const dataFine = dataFineRaw ? dataFineRaw : null;
  const luogo = (formData.get("luogo") as string)?.trim() || null;
  const descrizione = (formData.get("descrizione") as string)?.trim() || null;

  if (!titolo) throw new Error("Il titolo dell'evento è obbligatorio.");
  if (!dataInizio) throw new Error("La data di inizio è obbligatoria.");

  const { error } = await supabase
    .from("evento")
    .update({
      titolo,
      tipo,
      data_inizio: dataInizio,
      data_fine: dataFine,
      luogo,
      descrizione,
    })
    .eq("id", eventoId);

  if (error) throw new Error(`Errore nella modifica dell'evento: ${error.message}`);
  revalidatePath("/reparto");
  revalidatePath("/");
}

export async function eliminaEvento(eventoId: string) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { error } = await supabase.from("evento").delete().eq("id", eventoId);

  if (error) throw new Error(`Errore nell'eliminazione dell'evento: ${error.message}`);
  revalidatePath("/reparto");
  revalidatePath("/");
}
