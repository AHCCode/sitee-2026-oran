#!/usr/bin/env node
/**
 * End-to-end API & SSR smoke test suite for AFRIMÉTIERS HUB.
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
 */

import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function extractCookie(res, name) {
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") ?? ""];
  for (const c of setCookies) {
    const m = c.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
    if (m) return m[1];
  }
  return null;
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  return { status: res.status, headers: res.headers, body };
}

async function main() {
  console.log(`🔎 Running AFRIMÉTIERS HUB smoke tests against ${BASE} …`);

  // 1. Categories
  const cats = await req("/api/categories");
  assert.equal(cats.status, 200);
  assert.equal(cats.body.data.length, 12);
  const totalPublishedFromCats = cats.body.data.reduce((s, c) => s + c.artisanCount, 0);
  assert.ok(totalPublishedFromCats >= 20, "Categories should report published artisan counts");
  console.log("  ✓ GET /api/categories");

  // 2. Countries & cascading cities
  const countries = await req("/api/countries");
  assert.equal(countries.status, 200);
  assert.equal(countries.body.data.length, 10);
  const senegal = countries.body.data.find((c) => c.code === "SN");
  assert.ok(senegal);

  const snCities = await req(`/api/countries/${senegal.id}/cities`);
  assert.equal(snCities.status, 200);
  const dakar = snCities.body.data.find((c) => c.name === "Dakar");
  assert.ok(dakar);

  const badCountry = await req("/api/countries/999999/cities");
  assert.equal(badCountry.status, 404);
  console.log("  ✓ GET /api/countries & GET /api/countries/:id/cities");

  // 3. Artisans search with combinable filters
  const filtered = await req(
    `/api/artisans?category=menuiserie&country=SN&city=${dakar.id}&featured=true&q=acajou&sort=experience`,
  );
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.data.length, 1);
  assert.equal(filtered.body.data[0].fullName, "Ibrahima Ndiaye");
  console.log("  ✓ GET /api/artisans (combinable filters)");

  // 4. Artisan detail + draft hidden from public
  const detail = await req(`/api/artisans/${filtered.body.data[0].id}`);
  assert.equal(detail.status, 200);
  assert.ok(detail.body.data.photos.length >= 2);
  assert.ok(detail.body.data.services.length >= 3);
  assert.ok(Array.isArray(detail.body.data.similar));

  const draftDetail = await req("/api/artisans/art-draft-leila-mansouri");
  assert.equal(draftDetail.status, 404, "DRAFT artisan must not be publicly accessible");
  console.log("  ✓ GET /api/artisans/:id");

  // 5. Quote request validation (422) & creation (201)
  const invalidQuote = await req("/api/quotes", {
    method: "POST",
    body: JSON.stringify({
      artisanId: detail.body.data.id,
      clientName: "A",
      clientEmail: "not-an-email",
      clientPhone: "123",
      subject: "Hi",
      description: "Too short",
      consent: false,
    }),
  });
  assert.equal(invalidQuote.status, 422);
  assert.equal(invalidQuote.body.error.code, "VALIDATION_ERROR");
  assert.ok(invalidQuote.body.error.fields.clientName);
  assert.ok(invalidQuote.body.error.fields.clientEmail);
  assert.ok(invalidQuote.body.error.fields.clientPhone);
  assert.ok(invalidQuote.body.error.fields.subject);
  assert.ok(invalidQuote.body.error.fields.description);
  assert.ok(invalidQuote.body.error.fields.consent);

  const createdQuote = await req("/api/quotes", {
    method: "POST",
    body: JSON.stringify({
      artisanId: detail.body.data.id,
      clientName: "Ousmane Diallo",
      clientEmail: "ousmane.diallo@example.com",
      clientPhone: "+221 77 123 45 67",
      subject: "Bibliothèque murale sur mesure en bois de teck",
      description:
        "Bonjour, je souhaite un devis pour une bibliothèque murale en bois de teck de 3,20 m de largeur sur 2,40 m de hauteur avec portes basses à Dakar.",
      budget: "750 000 FCFA",
      consent: true,
    }),
  });
  assert.equal(createdQuote.status, 201);
  assert.match(createdQuote.body.data.reference, /^DEV-\d{4}-\d{4,}$/);
  console.log(`  ✓ POST /api/quotes (422 field validation + 201 reference ${createdQuote.body.data.reference})`);

  // 6. Public SSR pages in FR and EN + Confirmation page
  const homeFr = await req("/", { headers: { Cookie: "afm_locale=fr" } });
  assert.equal(homeFr.status, 200);
  assert.ok(homeFr.body.includes("Artisans à la une"));

  const homeEn = await req("/", { headers: { Cookie: "afm_locale=en" } });
  assert.equal(homeEn.status, 200);
  assert.ok(homeEn.body.includes("Featured artisans"));

  const confirmPage = await req(createdQuote.body.data.confirmationUrl);
  assert.equal(confirmPage.status, 200);
  assert.ok(confirmPage.body.includes(createdQuote.body.data.reference));
  console.log("  ✓ Public SSR pages (FR/EN + Quote Confirmation)");

  // 7. Strict Admin Access Control (401 unauthenticated, 401 bad login, 403 VIEWER)
  const unauthStats = await req("/api/admin/stats");
  assert.equal(unauthStats.status, 401);

  const badLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "admin@afrimetiers.com", password: "WrongPassword!" }),
  });
  assert.equal(badLogin.status, 401);

  const unknownUserLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "nobody@afrimetiers.com", password: "WrongPassword!" }),
  });
  assert.equal(unknownUserLogin.status, 401);
  assert.equal(
    badLogin.body.error.message,
    unknownUserLogin.body.error.message,
    "Invalid credentials must return an identical generic error message",
  );

  // Login as VIEWER → must get 403 Forbidden on /api/admin/*
  const viewerLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "viewer@afrimetiers.com", password: "Viewer@2026!" }),
  });
  assert.equal(viewerLogin.status, 200);
  const viewerToken = extractCookie(viewerLogin, "afm_session");
  assert.ok(viewerToken);

  const forbiddenStats = await req("/api/admin/stats", {
    headers: { Cookie: `afm_session=${viewerToken}` },
  });
  assert.equal(forbiddenStats.status, 403);
  console.log("  ✓ Access control: 401 unauthenticated, generic 401 login error, 403 non-admin role");

  // 8. Admin login + stats + artisans CRUD + quotes PATCH + logout invalidation
  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "admin", password: "Admin@2026!" }),
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = extractCookie(adminLogin, "afm_session");
  assert.ok(adminToken);
  const authHeader = { Cookie: `afm_session=${adminToken}` };

  const stats = await req("/api/admin/stats", { headers: authHeader });
  assert.equal(stats.status, 200);
  assert.ok(stats.body.data.kpis.totalArtisans >= 28);
  assert.ok(stats.body.data.kpis.totalQuotes >= 19);
  assert.equal(stats.body.data.monthly.length, 12);

  // Create + update + delete an artisan
  const createdArtisan = await req("/api/admin/artisans", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      fullName: "Mamadou Kouyaté",
      businessName: "Atelier Kouyaté",
      categoryId: cats.body.data[0].id,
      countryId: senegal.id,
      cityId: dakar.id,
      phone: "+221 77 900 11 22",
      email: "mamadou.kouyate@example.sn",
      website: "https://kouyate.sn",
      bio: "Artisan expérimenté basé à Dakar avec plus de 12 ans de pratique en atelier et sur chantier.",
      yearsExperience: 12,
      services: ["Fabrication sur mesure", "Rénovation complète"],
      photos: [{ url: "/images/seed/menuiserie-1.jpg", caption: "Atelier" }],
      featured: false,
      status: "DRAFT",
    }),
  });
  assert.equal(createdArtisan.status, 201);
  const newArtisanId = createdArtisan.body.data.id;

  const publishPatch = await req(`/api/admin/artisans/${newArtisanId}`, {
    method: "PATCH",
    headers: authHeader,
    body: JSON.stringify({ status: "PUBLISHED" }),
  });
  assert.equal(publishPatch.status, 200);
  assert.equal(publishPatch.body.data.status, "PUBLISHED");

  const deletedArtisan = await req(`/api/admin/artisans/${newArtisanId}`, {
    method: "DELETE",
    headers: authHeader,
  });
  assert.equal(deletedArtisan.status, 200);

  // Update quote status + internal notes + forwardedToArtisan and verify history
  const quotesList = await req(`/api/admin/quotes?q=${createdQuote.body.data.reference}`, {
    headers: authHeader,
  });
  assert.equal(quotesList.status, 200);
  const quoteId = quotesList.body.data[0].id;

  const patchedQuote = await req(`/api/admin/quotes/${quoteId}`, {
    method: "PATCH",
    headers: authHeader,
    body: JSON.stringify({
      status: "IN_PROGRESS",
      internalNotes: "Client contacté par téléphone, devis en préparation.",
      forwardedToArtisan: true,
    }),
  });
  assert.equal(patchedQuote.status, 200);
  assert.equal(patchedQuote.body.data.status, "IN_PROGRESS");
  assert.equal(patchedQuote.body.data.forwardedToArtisan, true);
  assert.ok(patchedQuote.body.data.history.length >= 4, "Status history must record every change");

  // Clean up test quote so DB counts stay clean
  console.log("  ✓ Admin stats, Artisan CRUD, Quote status/notes/forwarded + history log");

  // Logout must invalidate the server-side session token
  const logoutRes = await req("/api/auth/logout", {
    method: "POST",
    headers: authHeader,
  });
  assert.equal(logoutRes.status, 200);

  const afterLogout = await req("/api/admin/stats", { headers: authHeader });
  assert.equal(afterLogout.status, 401, "Session token must be invalidated in DB after logout");
  console.log("  ✓ POST /api/auth/logout (session invalidated)");

  console.log("\n🎉 All smoke tests passed!");
}

main().catch((err) => {
  console.error("❌ Smoke test failed:", err);
  process.exit(1);
});
