export function whatsappShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function participantMessage(args: { prenom: string; kamal: string; juz: number; url: string }) {
  return `Assalamou alaykoum ${args.prenom} 👋\n\nTon Juz pour le ${args.kamal} :\n\n📖 Juz ${args.juz}\n\nQuand tu as terminé ta lecture, confirme ici :\n${args.url}\n\nQu'Allah accepte ta lecture 🤲`;
}


function recipientNumber(telephone: string) {
  let digits = telephone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Senegalese local numbers have nine digits; store links in international form.
  if (digits.length === 9) digits = `221${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function whatsappRecipientUrl(telephone: string, message: string) {
  const phone = recipientNumber(telephone);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}

export function smsRecipientUrl(telephone: string, message: string) {
  const phone = recipientNumber(telephone);
  return phone ? `sms:+${phone}?body=${encodeURIComponent(message)}` : null;
}
