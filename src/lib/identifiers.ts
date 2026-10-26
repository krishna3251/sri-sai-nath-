export function luhnCheckDigit(body: string) {
  let sum = 0,
    double = true;
  for (let i = body.length - 1; i >= 0; i--) {
    let n = Number(body[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return String((10 - (sum % 10)) % 10);
}
export function makeDemoImei(n: number) {
  const body = "860999" + String(n).padStart(8, "0");
  return body + luhnCheckDigit(body);
}
export function isValidImei(value: string) {
  return (
    /^\d{15}$/.test(value) && luhnCheckDigit(value.slice(0, 14)) === value[14]
  );
}
export function splitIdentifiers(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}
