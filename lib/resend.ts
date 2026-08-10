import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviaEmailConsensoGenitoriale({
  genitoreEmail,
  nomeMinore,
  confirmUrl,
}: {
  genitoreEmail: string;
  nomeMinore: string;
  confirmUrl: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL non configurata");
  }

  await resend.emails.send({
    from,
    to: genitoreEmail,
    subject: `Richiesta di consenso — account ORMA per ${nomeMinore}`,
    text: [
      "Gentile genitore/tutore,",
      "",
      `${nomeMinore} ha richiesto la creazione di un account su ORMA, un'applicazione personale che aiuta Esploratori e Guide AGESCI a seguire il proprio percorso di Specialità, Competenze e Tappe.`,
      "",
      `Poiché ${nomeMinore} ha meno di 14 anni, la legge italiana richiede il Suo consenso, in qualità di chi esercita la responsabilità genitoriale, prima che l'account possa essere attivato.`,
      "",
      `Per confermare il consenso e attivare l'account, apra questo link (valido 7 giorni, utilizzabile una sola volta): ${confirmUrl}`,
      "",
      "Se non riconosce questa richiesta, non deve fare nulla: l'account resterà inattivo.",
    ].join("\n"),
  });
}
