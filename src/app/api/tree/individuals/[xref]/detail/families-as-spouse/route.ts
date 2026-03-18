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
    const { fileUuid, personId } = ctx;
    const famSpouseRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT f.id AS family_id, f.xref AS family_xref,
               spouse.id AS spouse_id, spouse.xref AS spouse_xref, spouse.full_name AS spouse_name, spouse.sex AS spouse_sex, spouse.gender AS spouse_gender,
               ch.id AS child_id, ch.xref AS child_xref, ch.full_name AS child_name,
               ch.sex AS child_sex, ch.gender AS child_gender,
               ch.birth_date_display AS child_birth_date, ch.birth_place_display AS child_birth_place,
               ch_birth_d.year AS child_birth_year, ch_birth_d.month AS child_birth_month, ch_birth_d.day AS child_birth_day
        FROM gedcom_families_v2 f
        LEFT JOIN gedcom_individuals_v2 spouse ON (spouse.id = f.wife_id AND f.husband_id = ${personId}::uuid)
          OR (spouse.id = f.husband_id AND f.wife_id = ${personId}::uuid)
        LEFT JOIN gedcom_family_children_v2 fch ON fch.family_id = f.id AND fch.file_uuid = f.file_uuid
        LEFT JOIN gedcom_individuals_v2 ch ON ch.id = fch.child_id
        LEFT JOIN gedcom_dates_v2 ch_birth_d ON ch_birth_d.id = ch.birth_date_id
        WHERE f.file_uuid = ${fileUuid}::uuid
          AND (f.husband_id = ${personId}::uuid OR f.wife_id = ${personId}::uuid)
      `
    );
    const spouseFamilyByKey = new Map<
      string,
      {
        family: { id: string; xref: string };
        spouse: { name: string | null; xref: string; gender?: string | null };
        children: {
          name: string | null;
          xref: string;
          gender?: string | null;
          birth?: { date: string | null; place: string | null; year?: number | null; month?: number | null; day?: number | null };
        }[];
      }
    >();
    for (const r of famSpouseRows) {
      const fid = r.family_id as string;
      if (!spouseFamilyByKey.has(fid)) {
        spouseFamilyByKey.set(fid, {
          family: { id: fid, xref: (r.family_xref as string) ?? "" },
          spouse: { name: stripSlashesFromName(r.spouse_name as string) ?? null, xref: (r.spouse_xref as string) ?? "", gender: formatGender((r.spouse_sex as string) ?? null, (r.spouse_gender as string) ?? null) ?? null },
          children: [],
        });
      }
      const entry = spouseFamilyByKey.get(fid)!;
      if (r.child_id && !entry.children.some((c) => c.xref === (r.child_xref as string))) {
        const hasBirth = r.child_birth_date != null || r.child_birth_place != null || r.child_birth_year != null || r.child_birth_month != null || r.child_birth_day != null;
        entry.children.push({
          name: stripSlashesFromName(r.child_name as string) ?? null,
          xref: (r.child_xref as string) ?? "",
          gender: formatGender((r.child_sex as string) ?? null, (r.child_gender as string) ?? null) ?? null,
          birth: hasBirth
            ? {
                date: (r.child_birth_date as string) ?? null,
                place: (r.child_birth_place as string) ?? null,
                year: r.child_birth_year != null ? Number(r.child_birth_year) : null,
                month: r.child_birth_month != null ? Number(r.child_birth_month) : null,
                day: r.child_birth_day != null ? Number(r.child_birth_day) : null,
              }
            : undefined,
        });
      }
    }
    const sortSpouseChildrenByBirth = (a: { birth?: { year?: number | null; month?: number | null; day?: number | null } }, b: typeof a) => {
      const yA = Number(a.birth?.year ?? Infinity);
      const yB = Number(b.birth?.year ?? Infinity);
      if (yA !== yB) return yA - yB;
      const mA = Number(a.birth?.month ?? 13);
      const mB = Number(b.birth?.month ?? 13);
      if (mA !== mB) return mA - mB;
      const dA = Number(a.birth?.day ?? 32);
      const dB = Number(b.birth?.day ?? 32);
      return dA - dB;
    };
    const familiesAsSpouse = Array.from(spouseFamilyByKey.values()).map((fam) => ({
      ...fam,
      children: fam.children.slice().sort(sortSpouseChildrenByBirth),
    }));
    return NextResponse.json({ familiesAsSpouse });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
