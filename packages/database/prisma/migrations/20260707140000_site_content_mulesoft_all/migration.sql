-- Replace MuleSoft with Microsoft across all SiteContent CMS payloads (footer, homepage, etc.)
UPDATE "SiteContent"
SET "payload" = replace(
    replace(
        replace("payload"::text, '"mulesoft"', '"microsoft"'),
        '"MuleSoft"', '"Microsoft"'
    ),
    'MuleSoft', 'Microsoft'
)::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "payload"::text ILIKE '%mulesoft%';
