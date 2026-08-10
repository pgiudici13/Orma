/**
 * Soglie e regole del flusso di registrazione/consenso definito in
 * DEC-010 (.claude/DECISIONS.md).
 */

export const ETA_MINIMA_CONSENSO_PROPRIO = 14;
export const TOKEN_CONSENSO_VALIDITA_GIORNI = 7;
export const PRIVACY_POLICY_VERSIONE = "1.0";

export function calcolaEta(
  dataNascita: Date,
  riferimento = new Date(),
): number {
  let eta = riferimento.getFullYear() - dataNascita.getFullYear();
  const meseGiornoNonRaggiunti =
    riferimento.getMonth() < dataNascita.getMonth() ||
    (riferimento.getMonth() === dataNascita.getMonth() &&
      riferimento.getDate() < dataNascita.getDate());

  if (meseGiornoNonRaggiunti) {
    eta -= 1;
  }

  return eta;
}

export function richiedeConsensoGenitoriale(dataNascita: Date): boolean {
  return calcolaEta(dataNascita) < ETA_MINIMA_CONSENSO_PROPRIO;
}
