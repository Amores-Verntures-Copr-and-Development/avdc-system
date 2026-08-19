// Shared guard for the "bulk update via CASE-WHEN" builders scattered across
// models/*.ts. Those builders splice column NAMES (not values) directly into
// raw SQL - e.g. `${field} = (CASE ... END)` - so wherever `field` comes from
// `Object.keys(updates[0])` on a payload that traces back to an
// unpicked/un-validated request body, an attacker can add an arbitrary extra
// JSON key whose name becomes a raw SQL fragment. Call this with the real
// column names of the target table before building the query.
export function assertKnownColumns(fields: string[], allowedColumns: ReadonlySet<string>, tableName: string) {
  for (const field of fields) {
    if (!allowedColumns.has(field)) {
      throw new Error(`Unknown ${tableName} column: ${field}`);
    }
  }
}
