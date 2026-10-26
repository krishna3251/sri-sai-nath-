/* Run npm run build first. Optionally set BASE_URL and CHROMIUM_PATH. Uses isolated demo browser contexts only. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
try {
  process.loadEnvFile(".env.local");
} catch {}
const base = process.env.BASE_URL || "http://127.0.0.1:3100";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function demoImei(n) {
  const body = "860999" + String(n).padStart(8, "0");
  let sum = 0,
    d = true;
  for (let i = 13; i >= 0; i--) {
    let v = +body[i];
    if (d) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
    d = !d;
  }
  return body + ((10 - (sum % 10)) % 10);
}
(async () => {
  let server, browser;
  try {
    if (!process.env.BASE_URL) {
      server = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
          "-p",
          "3100",
          "--hostname",
          "127.0.0.1",
        ],
        { stdio: "ignore" },
      );
      for (let n = 0; n < 100; n++) {
        try {
          const r = await fetch(base);
          if (r.ok) break;
        } catch {}
        await sleep(200);
      }
    }
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--no-zygote",
      ],
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => d.accept());
    const nav = async (label) => {
      const menuButton = page.getByRole("button", {
        name: "Open menu",
        exact: true,
      });
      if (
        (await menuButton.isVisible()) &&
        !(await page.locator(".sidebar").getAttribute("class")).includes(
          "sidebar-open",
        )
      )
        await menuButton.click();
      const b = page.locator(".nav-item").filter({ hasText: label });
      if (!(await b.isVisible())) {
        const menu = page.getByRole("button", {
          name: "Open menu",
          exact: true,
        });
        if (await menu.isVisible()) await menu.click();
        if (!(await b.isVisible()))
          await page
            .locator("summary")
            .filter({ hasText: "ADMINISTRATION" })
            .click();
      }
      await b.click();
    };
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("ssm-erp-demo-v1")));
    await page.goto(base);
    assert.ok(page.url().includes("/sign-in"));
    fs.mkdirSync("test-results", { recursive: true });
    await page.screenshot({
      path: "test-results/shop-sign-in.png",
      fullPage: true,
      animations: "disabled",
    });
    const rejectedOrigin = await page.request.post(base + "/api/shop-session", {
      headers: { Origin: "https://other.example" },
      data: { pin: process.env.SHOP_PIN },
    });
    assert.equal(rejectedOrigin.status(), 403);
    await page.getByLabel("Shop PIN", { exact: true }).fill("incorrect-pin");
    await page.getByRole("button", { name: "Open shop", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "incorrect" }).waitFor();
    await page
      .getByLabel("Shop PIN", { exact: true })
      .fill(process.env.SHOP_PIN);
    await page.getByRole("button", { name: "Open shop", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Setup", exact: true })
      .click();
    await page.locator(".guide-panel").waitFor();
    assert.match(await page.locator("h1").innerText(), /yours/);
    await page.getByLabel("I’ve completed this step").check();
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await page.getByLabel("Close guide", { exact: true }).click();
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("ssm-guide-v1")).done,
      ),
      [0],
    );
    console.log(
      "PASS onboarding: welcome, contextual navigation, checklist and close/resume",
    );
    await nav("Dashboard");
    fs.mkdirSync("test-results", { recursive: true });
    await page.screenshot({
      path: "test-results/dashboard-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    const initial = await state(),
      unit = initial.devices.find((d) => d.productId === "p1");
    assert.equal(
      new Set(
        initial.devices.flatMap((d) => [d.imei1, d.imei2].filter(Boolean)),
      ).size,
      initial.devices.flatMap((d) => [d.imei1, d.imei2].filter(Boolean)).length,
    );
    await nav("New Sale");
    const scan = page.getByPlaceholder("Scan barcode, IMEI or type code…");
    await scan.fill("PH-NVX5-128");
    await scan.press("Enter");
    await page.locator(".device-picker-row").first().click();
    await scan.fill(unit.imei2);
    await scan.press("Enter");
    assert.match(
      await page.locator(".toast").innerText(),
      /already in this bill/,
    );
    assert.equal(
      await page.locator(".pos-main .data-table tbody tr").count(),
      1,
    );
    await page.locator(".pos-main .inline-money").nth(1).fill("100");
    await page.getByLabel("Payment method (demo record)").selectOption("UPI");
    await page
      .getByRole("button", { name: "Save demo sale & preview", exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    const invoiceText = await page.getByRole("dialog").innerText();
    assert.ok(
      invoiceText.includes(unit.imei1) && invoiceText.includes(unit.imei2),
    );
    let data = await state();
    assert.equal(data.devices.find((d) => d.id === unit.id).status, "Sold");
    assert.equal(data.products.find((p) => p.id === "p1").stock, 6);
    assert.equal(data.invoices[0].items[0].lineTotal, 20899);
    assert.equal(data.invoices[0].paymentMethod, "UPI");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.reload();
    await page
      .getByRole("heading", { name: "Your shop, at a glance." })
      .waitFor();
    assert.equal(
      (await state()).devices.find((d) => d.id === unit.id).status,
      "Sold",
    );
    console.log(
      "PASS POS: model picker, IMEI 2 scan, duplicate handset prevention, invoice identifiers, discount/payment snapshot, stock update and reload",
    );
    await nav("New Sale");
    await scan.fill(unit.imei1);
    await scan.press("Enter");
    assert.match(await page.locator(".toast").innerText(), /marked sold/);
    await nav("Sales Returns");
    await page
      .getByRole("button", { name: "Receive for inspection", exact: true })
      .click();
    data = await state();
    assert.equal(
      data.devices.find((d) => d.id === unit.id).status,
      "Under inspection",
    );
    assert.equal(data.products.find((p) => p.id === "p1").stock, 6);
    await nav("IMEI & Serial Tracking");
    await page
      .getByRole("button", { name: "Inspection passed", exact: true })
      .click();
    assert.equal((await state()).products.find((p) => p.id === "p1").stock, 7);
    console.log(
      "PASS returns: original handset intake, inspection hold, explicit inspection before restock",
    );
    await nav("Dashboard");
    await page
      .locator(".task-bar button")
      .filter({ hasText: "Add product" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Product name", { exact: true })
      .fill("QA Demo Phone");
    await dialog.getByLabel(/^SKU/).fill("QA-PHONE");
    await dialog.getByLabel(/^IMEI 1/).fill(unit.imei1);
    await dialog.getByLabel(/^IMEI 2/).fill(demoImei(900001));
    await dialog
      .getByRole("button", { name: "Add product", exact: true })
      .click();
    assert.match(await page.locator(".toast").innerText(), /Duplicate IMEI/);
    await dialog.getByLabel(/^IMEI 1/).fill("123456789012345");
    await dialog
      .getByRole("button", { name: "Add product", exact: true })
      .click();
    assert.match(await page.locator(".toast").innerText(), /valid check digit/);
    await dialog.getByLabel(/^IMEI 1/).fill(demoImei(900000));
    await dialog
      .getByRole("button", { name: "Add product", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    assert.ok((await state()).products.some((p) => p.sku === "QA-PHONE"));
    console.log(
      "PASS products: required variant SKU, checksum and existing-identifier rejection, dual-IMEI creation",
    );
    await nav("Purchase In");
    await page
      .getByLabel("Supplier bill no.", { exact: true })
      .fill("DEMO-QA-001");
    await page
      .getByPlaceholder("Search model, SKU, IMEI or barcode")
      .fill("QA-PHONE");
    await page.locator(".purchase-pick button").first().click();
    await page
      .getByLabel("IMEI 1 / one per phone", { exact: true })
      .fill(demoImei(900002));
    await page
      .getByPlaceholder("Optional second IMEI per phone", { exact: true })
      .fill(unit.imei1);
    await page.locator(".purchase-summary .btn-primary").click();
    assert.match(await page.locator(".toast").innerText(), /Duplicate IMEI/);
    await page
      .getByPlaceholder("Optional second IMEI per phone", { exact: true })
      .fill(demoImei(900003));
    await page.locator(".purchase-summary .btn-primary").click();
    data = await state();
    assert.ok(data.purchases.some((p) => p.number === "DEMO-QA-001"));
    assert.equal(
      data.devices.find((d) => d.imei1 === demoImei(900002)).imei2,
      demoImei(900003),
    );
    assert.equal(data.products.find((p) => p.sku === "QA-PHONE").stock, 2);
    console.log(
      "PASS purchases: cross-column duplicate rejection, receipt reference, dual identifiers and quantity update",
    );
    await page
      .getByRole("textbox", { name: "Global search", exact: true })
      .fill(demoImei(900003));
    await page.locator(".search-results button").first().click();
    await page.getByRole("dialog").waitFor();
    assert.ok(
      (await page.getByRole("dialog").innerText()).includes(demoImei(900003)),
    );
    await page.keyboard.press("Escape");
    console.log(
      "PASS global search: secondary IMEI opens matching product/device record",
    );
    await nav("Purchase Returns");
    await page
      .getByLabel("Supplier bill no.", { exact: true })
      .fill("DEMO-QA-RETURN");
    await page
      .getByPlaceholder("Search model, SKU, IMEI or barcode")
      .fill("QA-PHONE");
    await page.locator(".purchase-pick button").first().click();
    await page
      .getByLabel("IMEI 1 / one per phone", { exact: true })
      .fill(demoImei(900002));
    await page
      .getByRole("button", { name: "Record return", exact: true })
      .click();
    assert.equal(
      (await state()).devices.find((d) => d.imei1 === demoImei(900002)).status,
      "Returned to supplier",
    );
    assert.equal(
      (await state()).products.find((p) => p.sku === "QA-PHONE").stock,
      1,
    );
    console.log(
      "PASS supplier return: exact available unit removed and stock stays consistent",
    );
    for (const name of [
      "Products & Stock",
      "Price Manager",
      "Customers & Suppliers",
      "Payments & Receipts",
      "Invoices",
      "Reports",
      "Barcode Management",
      "Stock Movements",
      "Categories",
      "Getting Started",
    ]) {
      await nav(name);
      assert.ok(await page.locator("h1").count());
    }
    console.log("PASS major module navigation");
    await nav("Shop Settings");
    await page
      .getByRole("button", { name: "Branding gallery", exact: true })
      .click();
    assert.equal(await page.locator(".branding-card").count(), 4);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".branding-card>a>img")].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    for (const image of await page.locator(".branding-card>a>img").all()) {
      assert.equal(
        await image.evaluate((i) => i.complete && i.naturalWidth > 0),
        true,
      );
    }
    await page.screenshot({
      path: "test-results/logo-comparison.png",
      fullPage: true,
      animations: "disabled",
    });
    console.log(
      "PASS logos: four actual assets loaded, gallery and individual image links",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await nav("Dashboard");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "test-results/dashboard-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    await nav("New Sale");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "test-results/pos-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    console.log(
      "PASS mobile: navigation, dashboard and POS fit 390px viewport",
    );
    const empty = await browser.newPage();
    await empty.addInitScript(() => {
      localStorage.setItem(
        "ssm-erp-demo-v1",
        JSON.stringify({
          products: [],
          devices: [],
          parties: [],
          invoices: [],
        }),
      );
      localStorage.setItem(
        "ssm-guide-v1",
        JSON.stringify({ step: 0, done: [] }),
      );
    });
    await empty.goto(base);
    await empty
      .getByLabel("Shop PIN", { exact: true })
      .fill(process.env.SHOP_PIN);
    await empty.getByRole("button", { name: "Open shop", exact: true }).click();
    await empty
      .getByRole("heading", { name: "Your first bill starts here" })
      .waitFor();
    assert.equal(
      (
        await empty.evaluate(() =>
          JSON.parse(localStorage.getItem("ssm-erp-demo-v1")),
        )
      ).products.length,
      0,
    );
    console.log("PASS empty shop and hydration preserve saved empty records");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await nav("Imports & exports");
    await page.getByLabel(/^Default supplier \/ party code/).fill("SUPQA");
    await page
      .getByLabel(/^Supplier name \(only for a new code\)/)
      .fill("QA Imports Supplier");
    await page
      .getByLabel(/^Supplier bill \/ delivery reference/)
      .fill("IMPORT-QA-001");
    await page
      .getByLabel("Paste WhatsApp stock list", { exact: true })
      .fill(
        "Accessories\nQA Import Cable | qty: 3 | cost: 50 | retail: 99 | wholesale: 70",
      );
    await page
      .getByRole("button", { name: "Read stock list", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm & receive stock", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "3 units received" })
      .waitFor();
    assert.equal(
      (await state()).products.find((p) => p.name === "QA Import Cable").stock,
      3,
    );
    await page
      .getByRole("button", { name: "Read stock list", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm & receive stock", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "already recorded" })
      .waitFor();
    assert.equal(
      (await state()).products.find((p) => p.name === "QA Import Cable").stock,
      3,
    );
    await page.getByRole("radio").nth(1).check();
    await page
      .getByLabel("Paste WhatsApp stock list", { exact: true })
      .fill("Samsung\nQA Import Phone 8/128");
    await page
      .getByRole("button", { name: "Read stock list", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm catalogue import", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "0 units received" })
      .waitFor();
    assert.equal(
      (await state()).products.find((p) => p.name === "QA Import Phone").stock,
      0,
    );
    await page.getByRole("radio").first().check();
    await page
      .getByLabel(/^Supplier bill \/ delivery reference/)
      .fill("IMPORT-QA-002");
    await page
      .getByLabel("Paste WhatsApp stock list", { exact: true })
      .fill(
        "Samsung\nQA Import Phone 8/128 | qty: 1 | cost: 100 | retail: 200 | wholesale: 150",
      );
    await page
      .getByRole("button", { name: "Read stock list", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Confirm & receive stock", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByLabel("Row 1 imei1", { exact: true })
      .fill(demoImei(900040));
    await page
      .getByLabel("Row 1 imei2", { exact: true })
      .fill(demoImei(900041));
    await page
      .getByRole("button", { name: "Confirm & receive stock", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "1 units received" })
      .waitFor();
    assert.equal(
      (await state()).devices.find((d) => d.imei1 === demoImei(900040)).imei2,
      demoImei(900041),
    );
    const backupDownload = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Full shop backup (JSON)", exact: true })
      .click();
    const backup = JSON.parse(
      fs.readFileSync(await (await backupDownload).path(), "utf8"),
    );
    assert.equal(
      backup.devices.find((d) => d.imei1 === demoImei(900040)).imei2,
      demoImei(900041),
    );
    await page
      .getByRole("button", { name: "Import file", exact: true })
      .click();
    await page.getByLabel("Stock import file", { exact: true }).setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "sku,name,tracking,quantity,purchase_cost,retail_price,wholesale_price\nQA-FILE,QA File Cable,Quantity,2,20,50,40",
      ),
    });
    await page
      .getByLabel(/^Supplier bill \/ delivery reference/)
      .fill("IMPORT-QA-003");
    await page
      .getByRole("button", { name: "Confirm & receive stock", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "2 units received" })
      .waitFor();
    assert.equal(
      (await state()).products.find((p) => p.sku === "QA-FILE").stock,
      2,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "test-results/imports-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    console.log(
      "PASS imports: WhatsApp preview, supplier creation, exact quantities/IMEIs, duplicate reference rejection, catalogue-only safeguard, CSV upload and JSON backup",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await nav("Getting Started");
    await page
      .getByRole("button", { name: "Restart guided tour", exact: true })
      .click();
    await page.locator('[data-testid="teacher-highlight"]').waitFor();
    await page.screenshot({
      path: "test-results/teacher-guide.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.getByLabel("Close guide", { exact: true }).click();
    console.log("PASS teacher guide highlights the actual shop-name control");
    const storageFailure = await browser.newPage();
    storageFailure.on("pageerror", (e) => errors.push(e.message));
    await storageFailure.addInitScript(() => {
      const original = Storage.prototype.setItem;
      window.__guideStorageBlocked = true;
      Storage.prototype.setItem = function (key, value) {
        if (key === "ssm-guide-v1" && window.__guideStorageBlocked)
          throw new DOMException("Demo storage blocked", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await storageFailure.goto(base);
    await storageFailure
      .getByLabel("Shop PIN", { exact: true })
      .fill(process.env.SHOP_PIN);
    await storageFailure
      .getByRole("button", { name: "Open shop", exact: true })
      .click();
    await storageFailure
      .getByRole("button", { name: "Explore Demo", exact: true })
      .click();
    await storageFailure
      .getByRole("status")
      .filter({ hasText: "Setup progress couldn’t be saved" })
      .waitFor();
    await storageFailure
      .getByRole("button", { name: "Help & setup", exact: true })
      .click();
    await storageFailure.getByLabel("I’ve completed this step").check();
    await storageFailure
      .getByRole("button", { name: "Next step", exact: true })
      .click();
    assert.equal(
      await storageFailure.locator(".guide-body h2").innerText(),
      "Add suppliers & customers",
    );
    await storageFailure.evaluate(() => {
      window.__guideStorageBlocked = false;
    });
    await storageFailure
      .getByRole("button", { name: "Next step", exact: true })
      .click();
    await storageFailure
      .locator(".guide-storage-warning")
      .waitFor({ state: "hidden" });
    assert.deepEqual(
      await storageFailure.evaluate(() =>
        JSON.parse(localStorage.getItem("ssm-guide-v1")),
      ),
      { step: 2, done: [0] },
    );
    console.log(
      "PASS guide storage failure: visible warning, usable walkthrough, successful recovery saves current progress",
    );
    const malformedGuide = await browser.newPage();
    malformedGuide.on("pageerror", (e) => errors.push(e.message));
    await malformedGuide.addInitScript(() =>
      localStorage.setItem(
        "ssm-guide-v1",
        JSON.stringify({ step: "invalid", done: [0, 0, -1, 99, "1"] }),
      ),
    );
    await malformedGuide.goto(base);
    await malformedGuide
      .getByLabel("Shop PIN", { exact: true })
      .fill(process.env.SHOP_PIN);
    await malformedGuide
      .getByRole("button", { name: "Open shop", exact: true })
      .click();
    await malformedGuide
      .getByRole("button", { name: "Help & setup", exact: true })
      .click();
    assert.equal(
      await malformedGuide.locator(".guide-body h2").innerText(),
      "Set up your shop",
    );
    assert.deepEqual(
      await malformedGuide.evaluate(() =>
        JSON.parse(localStorage.getItem("ssm-guide-v1")),
      ),
      { step: 0, done: [0] },
    );
    console.log(
      "PASS malformed guide progress: invalid steps and checklist entries safely normalized",
    );
    const tampered = await browser.newContext();
    await tampered.addCookies([
      {
        name: "sri-sai-shop-session",
        value: "forged-unlocked-session",
        url: base,
      },
    ]);
    const locked = await tampered.newPage();
    await locked.goto(base);
    assert.ok(locked.url().includes("/sign-in"));
    await page.getByRole("button", { name: "Lock shop", exact: true }).click();
    await page
      .getByRole("heading", { name: "Welcome back", exact: true })
      .waitFor();
    await page.goto(base);
    assert.ok(page.url().includes("/sign-in"));
    console.log(
      "PASS shop gate: incorrect PIN and cross-origin requests rejected, encrypted session works, forged session rejected, lock closes access",
    );
    assert.deepEqual(errors, []);
    console.log("PASS no browser runtime errors");
  } finally {
    await browser?.close();
    server?.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
