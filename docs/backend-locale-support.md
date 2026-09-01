# Translatable serializers reject `uz` on most endpoints

**Severity: launch blocker for the Uzbek locale.**

## What happens

`PATCH /api/v1/admin/about/factory/` with the full locale set returns 400:

```json
{
  "title":          ["This field must contain exactly these languages: ru, en."],
  "subtitle":       ["This field must contain exactly these languages: ru, en."],
  "description":    ["This field must contain exactly these languages: ru, en."],
  "subdescription": ["This field must contain exactly these languages: ru, en."]
}
```

The request body was:

```json
{ "title": { "uz": "...", "ru": "...", "en": "..." }, ... }
```

The only offending key is `uz`. The same message appears on
`catalog/products`. `catalog/categories` accepts `uz` and saves it correctly.

## Why this is a backend bug, not a frontend one

1. **The public site serves `/uz/` routes.** With `uz` unsupported on most
   translatable endpoints, Uzbek visitors get RU/EN fallback content on those
   blocks. Uzbek is the majority language of the target market; shipping the
   Uzbek locale in this state means shipping it half-translated.

2. **The constraint is arbitrary and inconsistent.** `categories` accepts three
   locales, `products` and `about/factory` accept two. Nothing about the
   resources justifies the difference. This has the shape of a hardcoded locale
   tuple in some serializers and `settings.LANGUAGES` in others.

3. **The validator is stricter than the documented schema.** Swagger renders
   these fields as free-form dicts
   (`{"additionalProp1": "string", ...}` — Swagger UI's placeholder for
   arbitrary string keys). Nothing in the schema states that the key set is
   constrained, which locales are accepted, or that the set must match
   *exactly*. A client written against the documentation cannot succeed.

4. **Rejecting missing keys as well as extra ones makes PATCH behave like PUT**
   for these fields. A partial update of one language must still send every
   accepted language, so a client that does not first GET the record cannot
   safely PATCH it.

## What we need

- Add `uz` to every translatable serializer, so the accepted set is uniform.
- Migrations plus a backfill inserting `""` for `uz` on existing rows, so
  already-stored records validate under the new set.
- Ideally, derive the accepted set from `settings.LANGUAGES` rather than
  restating it per serializer, so the three can't drift apart again.
- Ideally, relax "exactly" to "no unknown keys" — accepting a subset makes
  PATCH partial again.

## Frontend status in the meantime

`src/api/locale-support.ts` holds a per-endpoint map. Screens on a restricted
endpoint render only the accepted tabs and send exactly that key set. This is a
containment measure, not a fix:

- Editors on those screens **cannot enter Uzbek at all**.
- Uzbek already stored on a restricted endpoint is **not destroyed** — the `uz`
  key is omitted from the payload rather than sent empty, so the stored value
  survives. It is simply no longer editable.

Once `uz` is accepted everywhere, the fix on our side is deleting the entries
from `SUPPORTED_LOCALES` — one line each. Nothing else changes.

## Endpoints still unverified

Only three entries are evidence-backed. Every other admin endpoint falls back
to the full locale set, i.e. current behaviour, because a wrong guess here
would silently remove a working Uzbek tab. Confirming the rest needs an
authenticated probe — all `/api/v1/admin/*` routes are 401 without a token:

```bash
TOKEN=...   # admin JWT
for u in about/factory about/slides about/stats about/timeline \
         about/export-regions blog/posts blog/post-blocks \
         careers/career-values careers/companies \
         catalog/products catalog/categories catalog/flavors \
         catalog/product-families catalog/product-images \
         pages/privacy-policy pages/settings pages/static-pages \
         partners/partners partners/certificates; do
  echo -n "$u -> "
  curl -s -X PATCH "https://deya.uz/api/v1/admin/$u/" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d '{"title":{"ru":"probe","uz":"probe","en":"probe"}}' \
    | grep -o 'exactly these languages: [^."]*' || echo "no locale error"
done
```

A resource with an id needs `.../<id>/` instead, and a field name it actually
has (`name`, `label`, `text`) instead of `title`.
