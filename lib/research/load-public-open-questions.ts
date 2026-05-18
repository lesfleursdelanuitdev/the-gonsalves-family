import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

export type PublicOpenQuestion = {
  id: string;
  question: string;
  details: string | null;
  createdAt: Date;
};

export async function loadPublicOpenQuestions(): Promise<PublicOpenQuestion[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  return prisma.openQuestion.findMany({
    where: { fileUuid, status: "open" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      question: true,
      details: true,
      createdAt: true,
    },
  });
}
