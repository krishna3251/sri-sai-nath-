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
for (const identifiers of [
  [b, null],
  ["123456789012345", null],
  [a, a],
]) {
  await assert.rejects(
    db.query(
      "INSERT INTO devices(product_id,imei_1,imei_2) VALUES ($1,$2,$3)",
      [product, ...identifiers],
    ),
  );
}
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
  "PASS: complete SQL foundation creates; checksum, same-unit and cross-column duplicates reject; registry update/delete remain consistent.",
);
await db.close();
