import assert from "node:assert/strict";
import { GET as getCategories } from "../src/app/api/categories/route";
import { GET as getCountries } from "../src/app/api/countries/route";
import { GET as getCountryCities } from "../src/app/api/countries/[id]/cities/route";
import { GET as getArtisans } from "../src/app/api/artisans/route";
import { GET as getArtisanById } from "../src/app/api/artisans/[id]/route";
import { POST as postQuote } from "../src/app/api/quotes/route";
import { POST as postLogin } from "../src/app/api/auth/login/route";
import { getPublicStats } from "../src/lib/services/catalog";
import { getAdminStats } from "../src/lib/services/stats";
import {
  buildSearchText,
  checkArtisanReferences,
  createArtisan,
  deleteArtisan,
  getAdminArtisan,
  listAdminArtisans,
  patchArtisan,
} from "../src/lib/services/artisans";
import { getAdminQuote, getQuoteConfirmation, listAdminQuotes, updateQuote } from "../src/lib/services/quotes";
import { hashToken, verifyCredentials } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { artisanSchema } from "../src/lib/validation";

async function call(
  handler: (req: Request, ctx?: any) => Promise<Response>,
  url: string,
  init?: RequestInit,
  params?: Record<string, string>,
) {
  const req = new Request(`http://localhost:3000${url}`, init);
  const res = await handler(req, params ? { params: Promise.resolve(params) } : undefined);
  const body = await res.json();
  return { status: res.status, headers: res.headers, body };
}

async function main() {
  console.log("🔎 Verifying AFRIMÉTIERS HUB API routes & services…");

  // 1. GET /api/categories
  const cats = await call(getCategories, "/api/categories");
  assert.equal(cats.status, 200);
  assert.equal(cats.body.data.length, 12);
  const sumPublished = cats.body.data.reduce((acc: number, c: any) => acc + c.artisanCount, 0);
  assert.equal(sumPublished, 24, "Sum of published artisans across categories must match DB");
  console.log("  ✓ GET /api/categories (12 trades, 24 published artisans)");

  // 2. GET /api/countries & GET /api/countries/:id/cities
  const countries = await call(getCountries, "/api/countries");
  assert.equal(countries.status, 200);
  assert.equal(countries.body.data.length, 10);
  const senegal = countries.body.data.find((c: any) => c.code === "SN");
  assert.ok(senegal);

  const cities = await call(
    getCountryCities,
    `/api/countries/${senegal.id}/cities`,
    undefined,
    { id: String(senegal.id) },
  );
  assert.equal(cities.status, 200);
  const dakar = cities.body.data.find((c: any) => c.name === "Dakar");
  assert.ok(dakar);

  const unknownCountryCities = await call(
    getCountryCities,
    "/api/countries/99999/cities",
    undefined,
    { id: "99999" },
  );
  assert.equal(unknownCountryCities.status, 404);
  console.log("  ✓ GET /api/countries & GET /api/countries/:id/cities");

  // 3. GET /api/artisans (combinable filters)
  const search = await call(
    getArtisans,
    `/api/artisans?category=menuiserie&country=SN&city=${dakar.id}&featured=true&q=acajou&sort=experience`,
  );
  assert.equal(search.status, 200);
  assert.equal(search.body.data.length, 1);
  assert.equal(search.body.data[0].fullName, "Ibrahima Ndiaye");
  console.log("  ✓ GET /api/artisans (combinable filters: category + country + city + featured + q + sort)");

  // 4. GET /api/artisans/:id
  const detail = await call(
    getArtisanById,
    `/api/artisans/${search.body.data[0].id}`,
    undefined,
    { id: search.body.data[0].id },
  );
  assert.equal(detail.status, 200);
  assert.ok(detail.body.data.photos.length >= 2);
  assert.ok(detail.body.data.services.length >= 3);
  assert.ok(detail.body.data.similar.length >= 1);

  const draftRes = await call(
    getArtisanById,
    "/api/artisans/art-draft-leila-mansouri",
    undefined,
    { id: "art-draft-leila-mansouri" },
  );
  assert.equal(draftRes.status, 404, "DRAFT artisan must return 404 on public endpoint");
  console.log("  ✓ GET /api/artisans/:id (profile, gallery, services, similar + draft hidden)");

  // 5. POST /api/quotes — 422 validation & 201 creation
  const badQuote = await call(postQuote, "/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artisanId: detail.body.data.id,
      clientName: "X",
      clientEmail: "invalid-email",
      clientPhone: "12",
      subject: "Hi",
      description: "Short",
      consent: false,
    }),
  });
  assert.equal(badQuote.status, 422);
  assert.equal(badQuote.body.error.code, "VALIDATION_ERROR");
  assert.ok(badQuote.body.error.fields.clientName);
  assert.ok(badQuote.body.error.fields.clientEmail);
  assert.ok(badQuote.body.error.fields.clientPhone);
  assert.ok(badQuote.body.error.fields.subject);
  assert.ok(badQuote.body.error.fields.description);
  assert.ok(badQuote.body.error.fields.consent);

  const okQuote = await call(postQuote, "/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artisanId: detail.body.data.id,
      clientName: "Ousmane Diallo",
      clientEmail: "ousmane.diallo@example.com",
      clientPhone: "+221 77 123 45 67",
      subject: "Bibliothèque murale en teck massif",
      description:
        "Bonjour, je souhaite un devis pour une bibliothèque murale en bois de teck de 3,20 m × 2,40 m à Dakar.",
      budget: "750 000 FCFA",
      consent: true,
    }),
  });
  assert.equal(okQuote.status, 201);
  assert.match(okQuote.body.data.reference, /^DEV-\d{4}-\d{4,}$/);

  const confirmed = await getQuoteConfirmation(
    okQuote.body.data.reference,
    okQuote.body.data.token,
    "fr",
  );
  assert.ok(confirmed);
  assert.equal(confirmed.reference, okQuote.body.data.reference);
  console.log(`  ✓ POST /api/quotes (422 field errors + 201 created ${okQuote.body.data.reference})`);

  // 6. POST /api/auth/login — generic error on invalid credentials + session creation
  const badLogin1 = await call(postLogin, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin@afrimetiers.com", password: "WrongPassword!" }),
  });
  const badLogin2 = await call(postLogin, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "unknown@afrimetiers.com", password: "WrongPassword!" }),
  });
  assert.equal(badLogin1.status, 401);
  assert.equal(badLogin2.status, 401);
  assert.equal(badLogin1.body.error.message, badLogin2.body.error.message);

  const adminUser = await verifyCredentials("admin", "Admin@2026!");
  assert.ok(adminUser);
  assert.equal(adminUser.role, "ADMIN");
  console.log("  ✓ POST /api/auth/login (generic 401 error + bcrypt verification)");

  // 7. Admin stats consistency with DB
  const [publicStats, adminStats] = await Promise.all([
    getPublicStats(),
    getAdminStats("fr"),
  ]);
  assert.equal(publicStats.artisans, adminStats.kpis.publishedArtisans);
  assert.equal(publicStats.quotes, adminStats.kpis.totalQuotes);
  assert.equal(
    adminStats.kpis.totalQuotes,
    adminStats.kpis.pendingQuotes +
      adminStats.kpis.inProgressQuotes +
      adminStats.kpis.forwardedQuotes +
      adminStats.kpis.processedQuotes,
  );
  console.log("  ✓ Admin & Public statistics strictly consistent with DB");

  // 8. Admin Artisans CRUD + Admin Quotes status/notes/forwarded + history log
  const parsedArtisan = artisanSchema.parse({
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
  });
  const refs = await checkArtisanReferences(parsedArtisan, "fr");
  assert.ok(refs.refs);
  const createdArt = await createArtisan(parsedArtisan, buildSearchText(parsedArtisan, refs.refs));
  const patchedArt = await patchArtisan(createdArt.id, { status: "PUBLISHED" });
  assert.equal(patchedArt?.status, "PUBLISHED");
  const loadedArt = await getAdminArtisan(createdArt.id, "fr");
  assert.equal(loadedArt?.status, "PUBLISHED");
  const deletedArt = await deleteArtisan(createdArt.id);
  assert.equal(deletedArt, true);

  const quotesList = await listAdminQuotes({ q: okQuote.body.data.reference });
  assert.equal(quotesList.items.length, 1);
  const quoteId = quotesList.items[0]!.id;
  await updateQuote(
    quoteId,
    {
      status: "IN_PROGRESS",
      internalNotes: "Client contacté, devis en cours.",
      forwardedToArtisan: true,
    },
    adminUser.id,
  );
  const updatedQuote = await getAdminQuote(quoteId, "fr");
  assert.equal(updatedQuote?.status, "IN_PROGRESS");
  assert.equal(updatedQuote?.forwardedToArtisan, true);
  assert.ok((updatedQuote?.history.length ?? 0) >= 4);

  // Clean up the test quote so the seeded database stays pristine
  await prisma.quoteRequest.delete({ where: { id: quoteId } });
  const adminList = await listAdminArtisans({}, "fr");
  assert.equal(adminList.total, 28);
  console.log("  ✓ Admin Artisan CRUD & Quote status/notes/forwarded/history");

  // 9. Clean up any sessions created during test
  const loginRes = await call(postLogin, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin", password: "Admin@2026!" }),
  });
  assert.equal(loginRes.status, 200);
  const cookieHeader = loginRes.headers.get("set-cookie") ?? "";
  const tokenMatch = cookieHeader.match(/afm_session=([^;]+)/);
  assert.ok(tokenMatch?.[1]);
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(tokenMatch[1]) } });

  console.log("\n🎉 All route & service verifications passed!");
}

main()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
