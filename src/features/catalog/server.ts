import 'server-only';
import { z } from 'zod';
import { getPublicEnv } from '@/lib/env/public';
const optionalText = z.string().trim().max(80).optional().default('');
export const filtersSchema = z
  .object({
    q: optionalText,
    country: optionalText,
    city: optionalText,
    level: z
      .enum(['', 'bachelor', 'master', 'doctorate', 'associate', 'foundation'])
      .optional()
      .default(''),
    major: optionalText,
    language: optionalText,
    mode: z.enum(['', 'on_campus', 'online', 'hybrid']).optional().default(''),
    exam: optionalText,
    intake: optionalText,
    deadline: z
      .union([z.literal(''), z.iso.date()])
      .optional()
      .default(''),
    funding: z.enum(['', 'yes']).optional().default(''),
    maxTuition: z
      .union([z.literal(''), z.coerce.number().nonnegative().max(100000000)])
      .optional()
      .default(''),
    currency: z
      .string()
      .regex(/^$|^[A-Z]{3}$/)
      .optional()
      .default(''),
    sort: z.enum(['name', 'tuition', 'deadline']).optional().default('name'),
    page: z.coerce.number().int().min(1).max(200).optional().default(1),
  })
  .refine((value) => value.maxTuition === '' || value.currency !== '', {
    path: ['currency'],
    message: 'Currency is required with tuition',
  });
export type CatalogFilters = z.infer<typeof filtersSchema>;
export type CatalogRow = {
  id: string;
  program_name: string;
  university_slug: string;
  university_name: string;
  country: string;
  city: string | null;
  level: string;
  major: string;
  teaching_language: string | null;
  study_mode: string | null;
  tuition_amount: number | null;
  tuition_currency: string | null;
  tuition_period: string | null;
  tuition_as_of: string | null;
  next_deadline: string | null;
  total_count: number;
};
export type CatalogUniversity = {
  id: string;
  slug: string;
  name: string;
  country: string;
  official_url: string | null;
  source_id: string;
};
export type CatalogProgram = {
  id: string;
  name: string;
  university_id: string;
  campus_id: string | null;
  level: string;
  major: string;
  teaching_language: string | null;
  study_mode: string | null;
  languages: string[];
  formats: string[];
  duration_months: number | null;
  credit_value: number | null;
  credit_system: string | null;
  requirements: string | null;
  entrance_exams: string | null;
  tuition_amount: number | null;
  tuition_currency: string | null;
  tuition_period: string | null;
  tuition_as_of: string | null;
  source_id: string;
};
export type CatalogSource = {
  official_url: string;
  publisher: string;
  captured_at: string;
  reviewed_at: string | null;
};
export class CatalogUnavailable extends Error {}
export function parseFilters(
  input: Record<string, string | string[] | undefined>,
) {
  return filtersSchema.safeParse(
    Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );
}
async function catalogFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new CatalogUnavailable('Catalog is not configured');
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new CatalogUnavailable('Catalog request failed');
  }
  if (!response.ok) throw new CatalogUnavailable('Catalog request failed');
  return response.json() as Promise<T>;
}
const table = <T>(name: string, query: string) =>
  catalogFetch<T[]>(`${name}?${query}`);
export async function searchCatalog(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  const { page, ...rest } = filters;
  return catalogFetch<CatalogRow[]>('rpc/catalog_search', {
    method: 'POST',
    body: JSON.stringify({
      p_filters: { ...rest, offset: (page - 1) * 12, limit: 12 },
    }),
  });
}
async function getCountry(id: number) {
  const rows = await table<{ iso2: string }>(
    'countries',
    `id=eq.${id}&select=iso2&limit=1`,
  );
  return rows[0]?.iso2 ?? '';
}
function mapUniversity(
  row: {
    id: number;
    slug: string;
    legal_name: string;
    country_id: number;
    website_url: string | null;
  },
  country: string,
): CatalogUniversity {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.legal_name,
    country,
    official_url: row.website_url,
    source_id: String(row.id),
  };
}
const institutionSelect =
  'select=id,slug,legal_name,country_id,website_url&limit=1';
export async function getUniversity(slug: string) {
  const rows = await table<{
    id: number;
    slug: string;
    legal_name: string;
    country_id: number;
    website_url: string | null;
  }>(
    'institutions',
    `slug=eq.${encodeURIComponent(slug)}&${institutionSelect}`,
  );
  return rows[0]
    ? mapUniversity(rows[0], await getCountry(rows[0].country_id))
    : null;
}
export async function getUniversityById(id: string) {
  const rows = await table<{
    id: number;
    slug: string;
    legal_name: string;
    country_id: number;
    website_url: string | null;
  }>('institutions', `id=eq.${encodeURIComponent(id)}&${institutionSelect}`);
  return rows[0]
    ? mapUniversity(rows[0], await getCountry(rows[0].country_id))
    : null;
}
export async function getSource(
  entityId: string,
): Promise<CatalogSource | null> {
  const claims = await table<{ source_id: number; observed_at: string }>(
    'source_claims',
    `catalog_entity_id=eq.${encodeURIComponent(entityId)}&verification_state_code=eq.verified&select=source_id,observed_at&order=observed_at.desc&limit=1`,
  );
  if (!claims[0]) return null;
  const sources = await table<{
    canonical_url: string;
    publisher_name: string;
    last_checked_at: string;
  }>(
    'official_sources',
    `id=eq.${claims[0].source_id}&select=canonical_url,publisher_name,last_checked_at&limit=1`,
  );
  const source = sources[0];
  return source
    ? {
        official_url: source.canonical_url,
        publisher: source.publisher_name,
        captured_at: source.last_checked_at,
        reviewed_at: claims[0].observed_at,
      }
    : null;
}
async function getProgramRaw(id: string) {
  const rows = await table<{
    id: number;
    title: string;
    academic_unit_id: number;
    degree_level_code: string;
    primary_field_id: number;
    duration_months: number | null;
    credit_value: number | null;
    credit_system: string | null;
  }>(
    'degree_programs',
    `id=eq.${encodeURIComponent(id)}&select=id,title,academic_unit_id,degree_level_code,primary_field_id,duration_months,credit_value,credit_system&limit=1`,
  );
  return rows[0] ?? null;
}
async function mapProgram(
  raw: NonNullable<Awaited<ReturnType<typeof getProgramRaw>>>,
): Promise<CatalogProgram> {
  const [units, fields, campuses, languages, modes, tuition] =
    await Promise.all([
      table<{ institution_id: number }>(
        'academic_units',
        `id=eq.${raw.academic_unit_id}&select=institution_id&limit=1`,
      ),
      table<{ name: string }>(
        'fields_of_study',
        `id=eq.${raw.primary_field_id}&select=name&limit=1`,
      ),
      table<{ campus_id: number }>(
        'program_campuses',
        `program_id=eq.${raw.id}&select=campus_id&order=is_primary.desc,campus_id.asc&limit=1`,
      ),
      table<{ language_code: string }>(
        'degree_program_languages',
        `program_id=eq.${raw.id}&select=language_code&order=language_code.asc&limit=50`,
      ),
      table<{ delivery_mode_code: string }>(
        'degree_program_delivery_modes',
        `program_id=eq.${raw.id}&select=delivery_mode_code&order=delivery_mode_code.asc&limit=50`,
      ),
      table<{
        id: number;
        amount_min: number;
        currency_code: string;
        billing_period: string;
      }>(
        'estimated_tuition',
        `program_id=eq.${raw.id}&select=id,amount_min,currency_code,billing_period&order=academic_year_start.desc.nullslast,id.desc&limit=1`,
      ),
    ]);
  let tuitionDate: string | null = null;
  if (tuition[0]) {
    const entities = await table<{ last_checked_at: string | null }>(
      'catalog_entities',
      `id=eq.${tuition[0].id}&select=last_checked_at&limit=1`,
    );
    tuitionDate = entities[0]?.last_checked_at?.slice(0, 10) ?? null;
  }
  return {
    id: String(raw.id),
    name: raw.title,
    university_id: String(units[0]?.institution_id ?? ''),
    campus_id: campuses[0] ? String(campuses[0].campus_id) : null,
    level: raw.degree_level_code,
    major: fields[0]?.name ?? '',
    teaching_language: languages[0]?.language_code ?? null,
    study_mode: modes[0]?.delivery_mode_code ?? null,
    languages: languages.map((row) => row.language_code),
    formats: modes.map((row) => row.delivery_mode_code),
    duration_months: raw.duration_months,
    credit_value: raw.credit_value,
    credit_system: raw.credit_system,
    requirements: null,
    entrance_exams: null,
    tuition_amount: tuition[0]?.amount_min ?? null,
    tuition_currency: tuition[0]?.currency_code ?? null,
    tuition_period: tuition[0]?.billing_period ?? null,
    tuition_as_of: tuitionDate,
    source_id: String(raw.id),
  };
}
export async function getProgram(id: string) {
  const raw = await getProgramRaw(id);
  return raw ? mapProgram(raw) : null;
}
export async function getProgramsForUniversity(id: string) {
  const units = await table<{ id: number }>(
    'academic_units',
    `institution_id=eq.${encodeURIComponent(id)}&select=id&limit=100`,
  );
  if (!units.length) return [];
  const ids = units.map((unit) => unit.id).join(',');
  const raws = await table<
    NonNullable<Awaited<ReturnType<typeof getProgramRaw>>>
  >(
    'degree_programs',
    `academic_unit_id=in.(${ids})&select=id,title,academic_unit_id,degree_level_code,primary_field_id,duration_months,credit_value,credit_system&order=title.asc&limit=100`,
  );
  return Promise.all(raws.map(mapProgram));
}
export async function getCampus(id: string) {
  const rows = await table<{
    name: string;
    city_id: number | null;
    country_id: number;
  }>(
    'campuses',
    `id=eq.${encodeURIComponent(id)}&select=name,city_id,country_id&limit=1`,
  );
  if (!rows[0]) return null;
  const [country, cities] = await Promise.all([
    getCountry(rows[0].country_id),
    rows[0].city_id
      ? table<{ name: string }>(
          'cities',
          `id=eq.${rows[0].city_id}&select=name&limit=1`,
        )
      : Promise.resolve([]),
  ]);
  return { name: rows[0].name, city: cities[0]?.name ?? rows[0].name, country };
}
export async function getIntakes(programId: string) {
  const rows = await table<{
    id: number;
    term_code: string;
    starts_on: string | null;
  }>(
    'admission_intakes',
    `program_id=eq.${encodeURIComponent(programId)}&select=id,term_code,starts_on&order=starts_on.asc.nullslast&limit=500`,
  );
  if (!rows.length) return [];
  const rounds = await table<{
    id: number;
    intake_id: number;
    closes_at: string | null;
  }>(
    'application_rounds',
    `intake_id=in.(${rows.map((row) => row.id).join(',')})&select=id,intake_id,closes_at&limit=500`,
  );
  const deadlineLinks = rounds.length
    ? await table<{ application_round_id: number; deadline_id: number }>(
        'application_round_deadlines',
        `application_round_id=in.(${rounds.map((round) => round.id).join(',')})&select=application_round_id,deadline_id&limit=500`,
      )
    : [];
  const deadlines = deadlineLinks.length
    ? await table<{
        id: number;
        due_at: string | null;
        due_date: string | null;
        date_precision: string | null;
      }>(
        'deadlines',
        `id=in.(${deadlineLinks.map((link) => link.deadline_id).join(',')})&select=id,due_at,due_date,date_precision&limit=500`,
      )
    : [];
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((row) => {
    const dates = rounds
      .filter((round) => round.intake_id === row.id)
      .flatMap((round) => {
        const values: {
          at: string;
          id: number | null;
          dateOnly: string | null;
        }[] = [];
        if (round.closes_at)
          values.push({ at: round.closes_at, id: null, dateOnly: null });
        for (const link of deadlineLinks.filter(
          (item) => item.application_round_id === round.id,
        )) {
          const deadline = deadlines.find(
            (item) => item.id === link.deadline_id,
          );
          if (!deadline) continue;
          const at =
            deadline.due_at ??
            (deadline.due_date ? `${deadline.due_date}T12:00:00Z` : null);
          if (at)
            values.push({
              at,
              id: deadline.id,
              dateOnly: deadline.due_at ? null : deadline.due_date,
            });
        }
        return values;
      })
      .filter((value) =>
        value.dateOnly
          ? // A date-only deadline stays open for the whole calendar day.
            value.dateOnly >= today
          : new Date(value.at).getTime() >= Date.now(),
      )
      .sort((a, b) => {
        // Chronological when both are parseable timestamps (uniform
        // Postgres timestamptz ISO output); lexicographic otherwise.
        const ta = Date.parse(a.at);
        const tb = Date.parse(b.at);
        if (Number.isNaN(ta) || Number.isNaN(tb))
          return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
        return ta - tb;
      });
    return {
      label: row.term_code,
      starts_on: row.starts_on,
      deadline_at: dates[0]?.at ?? null,
      deadline_date: dates[0]?.dateOnly ?? null,
      deadline_id: dates[0]?.id ?? null,
    };
  });
}
export async function getRequirements(programId: string) {
  const links = await table<{ eligibility_requirement_id: number }>(
    'program_eligibility_requirements',
    `program_id=eq.${encodeURIComponent(programId)}&select=eligibility_requirement_id&limit=100`,
  );
  if (!links.length)
    return { descriptions: [] as string[], exams: [] as string[] };
  const ids = links.map((link) => link.eligibility_requirement_id).join(',');
  const [requirements, tests] = await Promise.all([
    table<{ title: string; description: string }>(
      'eligibility_requirements',
      `id=in.(${ids})&select=title,description&limit=100`,
    ),
    table<{ test_code: string }>(
      'required_tests',
      `eligibility_requirement_id=in.(${ids})&select=test_code&limit=100`,
    ),
  ]);
  return {
    descriptions: requirements.map((r) => `${r.title}: ${r.description}`),
    exams: [...new Set(tests.map((test) => test.test_code))],
  };
}
export async function getFunding(programId: string) {
  const links = await table<{ scholarship_cycle_id: number }>(
    'scholarship_program_links',
    `program_id=eq.${encodeURIComponent(programId)}&select=scholarship_cycle_id&limit=100`,
  );
  if (!links.length) return [];
  const cycles = await table<{ scholarship_id: number }>(
    'scholarship_cycles',
    `id=in.(${links.map((link) => link.scholarship_cycle_id).join(',')})&select=scholarship_id&limit=100`,
  );
  if (!cycles.length) return [];
  return table<{ title: string; official_url: string }>(
    'scholarships',
    `id=in.(${cycles.map((cycle) => cycle.scholarship_id).join(',')})&select=title,official_url&limit=100`,
  );
}
