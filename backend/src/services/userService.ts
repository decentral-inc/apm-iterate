import pool from "../db/pool";

export interface CrmUser {
  id: string;
  email: string;
  name: string;
  company: string;
  company_size: string;
  role: string;
  industry: string;
  source: string;
  status: string;
  signed_up_at: string | null;
  last_active: string | null;
  created_at: string;
}

export interface UserStats {
  total: number;
  signed_up: number;
  not_engaged: number;
  by_source: Record<string, number>;
  by_company_size: Record<string, number>;
  by_role: Record<string, number>;
  by_industry: Record<string, number>;
}

export async function getUsers(
  limit = 300,
  offset = 0,
  status?: string
): Promise<CrmUser[]> {
  const params: any[] = [limit, offset];
  let where = "";
  if (status) {
    where = "WHERE status = $3";
    params.push(status);
  }
  const { rows } = await pool.query(
    `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

export async function getUserStats(): Promise<UserStats> {
  const [total, signedUp, notEngaged, bySource, bySize, byRole, byIndustry] =
    await Promise.all([
      pool.query("SELECT count(*)::int AS c FROM users"),
      pool.query(
        "SELECT count(*)::int AS c FROM users WHERE status='signed_up'"
      ),
      pool.query(
        "SELECT count(*)::int AS c FROM users WHERE status='not_engaged'"
      ),
      pool.query(
        "SELECT source, count(*)::int AS c FROM users GROUP BY source"
      ),
      pool.query(
        "SELECT company_size, count(*)::int AS c FROM users GROUP BY company_size"
      ),
      pool.query("SELECT role, count(*)::int AS c FROM users GROUP BY role"),
      pool.query(
        "SELECT industry, count(*)::int AS c FROM users GROUP BY industry"
      ),
    ]);

  const toMap = (rows: any[]) =>
    Object.fromEntries(rows.map((r: any) => [r[Object.keys(r)[0]], r.c]));

  return {
    total: total.rows[0].c,
    signed_up: signedUp.rows[0].c,
    not_engaged: notEngaged.rows[0].c,
    by_source: toMap(bySource.rows),
    by_company_size: toMap(bySize.rows),
    by_role: toMap(byRole.rows),
    by_industry: toMap(byIndustry.rows),
  };
}
