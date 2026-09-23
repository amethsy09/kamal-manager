import { generateAccessToken } from "@/lib/tokens";

export type AssignmentMember = { id: string; nom: string; prenom: string };
export type AssignmentMode = "alphabetique" | "aleatoire";

export function planJuzAssignments(
  kamalId: string,
  members: AssignmentMember[],
  mode: AssignmentMode,
  makeToken: () => string = generateAccessToken,
  random: () => number = Math.random,
) {
  if (members.length === 0) throw new Error("At least one active member is required");

  const ordered = [...members].sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"));
  if (mode === "aleatoire") {
    for (let index = ordered.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    }
  }

  return Array.from({ length: 30 }, (_, index) => ({
    kamalId,
    userId: ordered[index % ordered.length].id,
    juzNumber: index + 1,
    tokenAcces: makeToken(),
  }));
}
