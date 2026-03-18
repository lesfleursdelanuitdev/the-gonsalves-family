import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { getPersonDetailContext, stripSlashesFromName, type Row } from "../lib";
import { formatGender } from "@/lib/individual-mapper";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ xref: string }> }
) {
  try {
    const { xref } = await params;
    const ctx = await getPersonDetailContext(xref);
    if (!ctx) {
      const code = !process.env.DATABASE_URL ? 503 : 404;
      return NextResponse.json(
        { error: code === 503 ? "Database not configured" : "Person not found" },
        { status: code }
      );
    }
    const { fileUuid, personId, normalizedXref } = ctx;
    const subjectBirthRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT d.year AS birth_year, d.month AS birth_month, d.day AS birth_day
        FROM gedcom_individuals_v2 i
        LEFT JOIN gedcom_dates_v2 d ON d.id = i.birth_date_id
        WHERE i.file_uuid = ${fileUuid}::uuid AND i.id = ${personId}::uuid
        LIMIT 1
      `
    );
    const subjectBirth = subjectBirthRows[0];
    const subjectBirthYear = subjectBirth?.birth_year != null ? Number(subjectBirth.birth_year) : null;
    const subjectBirthMonth = subjectBirth?.birth_month != null ? Number(subjectBirth.birth_month) : null;
    const subjectBirthDay = subjectBirth?.birth_day != null ? Number(subjectBirth.birth_day) : null;
    const famOriginRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT fc.family_id, f.xref AS family_xref,
               husb.id AS husband_id, husb.xref AS husband_xref, husb.full_name AS husband_name, husb.sex AS husband_sex, husb.gender AS husband_gender,
               wife.id AS wife_id, wife.xref AS wife_xref, wife.full_name AS wife_name, wife.sex AS wife_sex, wife.gender AS wife_gender,
               ch.id AS child_id, ch.xref AS child_xref, ch.full_name AS child_name,
               ch.sex AS child_sex, ch.gender AS child_gender,
               ch_birth_d.year AS child_birth_year, ch_birth_d.month AS child_birth_month, ch_birth_d.day AS child_birth_day
        FROM gedcom_family_children_v2 fc
        JOIN gedcom_families_v2 f ON f.id = fc.family_id AND f.file_uuid = fc.file_uuid
        LEFT JOIN gedcom_individuals_v2 husb ON husb.id = f.husband_id
        LEFT JOIN gedcom_individuals_v2 wife ON wife.id = f.wife_id
        LEFT JOIN gedcom_family_children_v2 fc2 ON fc2.family_id = fc.family_id AND fc2.file_uuid = fc.file_uuid
        LEFT JOIN gedcom_individuals_v2 ch ON ch.id = fc2.child_id
        LEFT JOIN gedcom_dates_v2 ch_birth_d ON ch_birth_d.id = ch.birth_date_id
        WHERE fc.file_uuid = ${fileUuid}::uuid AND fc.child_id = ${personId}::uuid
      `
    );
    const familyOriginByKey = new Map<
      string,
      {
        family: { id: string; xref: string };
        parents: { role: string; name: string | null; xref: string; gender?: string | null }[];
        children: { name: string | null; xref: string; gender?: string | null; birthYear?: number | null; birthMonth?: number | null; birthDay?: number | null }[];
      }
    >();
    for (const r of famOriginRows) {
      const fid = r.family_id as string;
      if (!familyOriginByKey.has(fid)) {
        const parents: { role: string; name: string | null; xref: string; gender?: string | null }[] = [];
        if (r.husband_id) parents.push({ role: "husband", name: stripSlashesFromName(r.husband_name as string) ?? null, xref: (r.husband_xref as string) ?? "", gender: formatGender((r.husband_sex as string) ?? null, (r.husband_gender as string) ?? null) ?? null });
        if (r.wife_id) parents.push({ role: "wife", name: stripSlashesFromName(r.wife_name as string) ?? null, xref: (r.wife_xref as string) ?? "", gender: formatGender((r.wife_sex as string) ?? null, (r.wife_gender as string) ?? null) ?? null });
        familyOriginByKey.set(fid, { family: { id: fid, xref: (r.family_xref as string) ?? "" }, parents, children: [] });
      }
      const entry = familyOriginByKey.get(fid)!;
      const childXref = (r.child_xref as string) ?? "";
      if (r.child_id && childXref !== normalizedXref && !entry.children.some((c) => c.xref === childXref)) {
        entry.children.push({
          name: stripSlashesFromName(r.child_name as string) ?? null,
          xref: childXref,
          gender: formatGender((r.child_sex as string) ?? null, (r.child_gender as string) ?? null) ?? null,
          birthYear: r.child_birth_year != null ? Number(r.child_birth_year) : null,
          birthMonth: r.child_birth_month != null ? Number(r.child_birth_month) : null,
          birthDay: r.child_birth_day != null ? Number(r.child_birth_day) : null,
        });
      }
    }
    const subjectName = stripSlashesFromName(ctx.person.full_name as string) ?? null;
    const subjectGender = formatGender((ctx.person.sex as string) ?? null, (ctx.person.gender as string) ?? null) ?? null;
    for (const fam of familyOriginByKey.values()) {
      if (!fam.children.some((c) => c.xref === normalizedXref)) {
        fam.children.push({
          name: subjectName,
          xref: normalizedXref,
          gender: subjectGender,
          birthYear: subjectBirthYear,
          birthMonth: subjectBirthMonth,
          birthDay: subjectBirthDay,
        });
      }
    }
    const sortChildrenByBirth = (a: { birthYear?: number | null; birthMonth?: number | null; birthDay?: number | null }, b: typeof a) => {
      const yA = Number(a.birthYear ?? Infinity);
      const yB = Number(b.birthYear ?? Infinity);
      if (yA !== yB) return yA - yB;
      const mA = Number(a.birthMonth ?? 13);
      const mB = Number(b.birthMonth ?? 13);
      if (mA !== mB) return mA - mB;
      const dA = Number(a.birthDay ?? 32);
      const dB = Number(b.birthDay ?? 32);
      return dA - dB;
    };
    const familiesOfOrigin = Array.from(familyOriginByKey.values()).map((fam) => ({
      family: fam.family,
      parents: fam.parents,
      children: fam.children.slice().sort(sortChildrenByBirth).map((c) => ({ name: c.name, xref: c.xref, gender: c.gender ?? null })),
    }));
    return NextResponse.json({ familiesOfOrigin });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
