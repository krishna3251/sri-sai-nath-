import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
// PGlite provides gen_random_uuid() but does not ship pgcrypto. No schema tables or checks are skipped.
await db.exec(
  readFileSync("db/schema.sql", "utf8").replace(
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    "",
  ),
);
const product = (
  await db.query(
    "INSERT INTO products (sku,name,tracking) VALUES ('TEST','Demo phone','imei') RETURNING id",
  )
).rows[0].id;
const a = "490154203237518",
  b = "356938035643809"; // public illustrative test identifiers only
const unit = (
  await db.query(
    "INSERT INTO devices(product_id,imei_1,imei_2) VALUES ($1,$2,$3) RETURNING id",
    [product, a, b],
  )
).rows[0].id;
assert.equal(
  (await db.query("SELECT * FROM device_imei_registry")).rows.length,
  2,
);
const c = "490154203237526";
for (const { identifiers, code, constraint } of [
  {
    identifiers: [b, null],
    code: "23505",
    constraint: "device_imei_registry_pkey",
  },
  {
    identifiers: [null, a],
    code: "23505",
    constraint: "device_imei_registry_pkey",
  },
  {
    identifiers: ["123456789012345", null],
    code: "23514",
    constraint: "devices_imei_1_checksum",
  },
  { identifiers: [c, c], code: "23514", constraint: "devices_distinct_imeis" },
]) {
  await assert.rejects(
    db.query(
      "INSERT INTO devices(product_id,imei_1,imei_2) VALUES ($1,$2,$3)",
      [product, ...identifiers],
    ),
    { code, constraint },
  );
}
const registered = async (id) =>
  (
    await db.query(
      "SELECT imei FROM device_imei_registry WHERE device_id=$1 ORDER BY imei",
      [id],
    )
  ).rows.map((row) => row.imei);
await db.query("UPDATE devices SET imei_2=$1 WHERE id=$2", [c, unit]);
assert.deepEqual(await registered(unit), [a, c].sort());
assert.equal(
  (await db.query("SELECT imei FROM device_imei_registry WHERE imei=$1", [b]))
    .rows.length,
  0,
);
// The released identifier must be reusable, while a conflicting update must roll back fully.
const other = (
  await db.query(
    "INSERT INTO devices(product_id,imei_1) VALUES ($1,$2) RETURNING id",
    [product, b],
  )
).rows[0].id;
await assert.rejects(
  db.query("UPDATE devices SET imei_2=$1 WHERE id=$2", [b, unit]),
  { code: "23505", constraint: "device_imei_registry_pkey" },
);
assert.deepEqual(await registered(unit), [a, c].sort());
assert.equal(
  (await db.query("SELECT imei_2 FROM devices WHERE id=$1", [unit])).rows[0]
    .imei_2,
  c,
);
await db.query("DELETE FROM devices WHERE id=$1", [other]);
await db.query("UPDATE devices SET imei_2=null WHERE id=$1", [unit]);
assert.equal(
  (await db.query("SELECT * FROM device_imei_registry")).rows.length,
  1,
);
await db.query("DELETE FROM devices WHERE id=$1", [unit]);
assert.equal(
  (await db.query("SELECT * FROM device_imei_registry")).rows.length,
  0,
);
console.log(
  "PASS: complete SQL foundation creates; checksum, same-unit and cross-column duplicates reject; replacement, reuse, failed-update rollback and delete remain consistent.",
);
await db.close();
