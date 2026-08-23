"use server";

import { getArchivio, type ArchivioData } from "@/lib/queries/archivio";
import {
  getMaestroProfilo,
  type MaestroProfiloData,
} from "@/lib/queries/maestri";
import {
  getAdesione,
  getCatalogo,
  getMaestri,
  getProfilo,
  type AdesioneData,
  type CatalogoData,
  type MaestroVoce,
  type ProfiloData,
} from "@/lib/queries/percorso";
import {
  getRepartoSurface,
  type RepartoSurfaceData,
} from "@/lib/queries/reparto";
import type { ContentKind } from "@/lib/scene/objects";

/**
 * Caricamento dei dati di una superficie del tavolo, su richiesta (DEC-021).
 *
 * La Home disegna un tavolo: non deve scaricare membri, Squadriglie e
 * calendario per mostrare una cassetta chiusa. I dati arrivano quando l'utente
 * apre davvero l'oggetto.
 *
 * Sono Server Action di sola lettura: nessun identificativo utente arriva dal
 * client, l'identità è quella della sessione e l'autorizzazione resta la RLS
 * (`docs/PERMISSIONS.md`).
 */
export async function loadRepartoSurface(): Promise<RepartoSurfaceData> {
  return getRepartoSurface();
}

export async function loadCatalogo(kind: ContentKind): Promise<CatalogoData> {
  return getCatalogo(kind);
}

export async function loadMaestri(): Promise<MaestroVoce[]> {
  return getMaestri();
}

export async function loadProfilo(): Promise<ProfiloData | null> {
  return getProfilo();
}

export async function loadMaestroProfilo(): Promise<MaestroProfiloData | null> {
  return getMaestroProfilo();
}

export async function loadArchivio(): Promise<ArchivioData> {
  return getArchivio();
}

export async function loadAdesione(): Promise<AdesioneData> {
  return getAdesione();
}
