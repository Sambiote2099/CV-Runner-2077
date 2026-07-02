Defense notes for Phase 0 ->

What was built: Next.js (App Router, TypeScript, Tailwind) skeleton; Neon Postgres database; Prisma schema with one User model (id, email, name, image, role enum, timestamps); deployed live on Vercel.
Key files: prisma/schema.prisma (data model), .env (local secret, never committed), Vercel's environment variable settings (production secret).
Why no version field on User yet: optimistic locking matters for records edited concurrently by multiple actors (attributes, positions, profile data) — that starts in Phase 2.

-----------------------------------------------------------------------------------------------------------------------------

Defense notes for Phase 1 ->

What was built: Google + GitHub sign-in via Auth.js (database sessions), a role field flowing from the database into every session, a server-component header reflecting login state, and middleware-based route protection keyed on both login status and role.
Key files: src/auth.ts (provider config + session callback), src/lib/prisma.ts (shared DB connection, singleton to avoid exhausting connections on hot-reload), src/middleware.ts (route protection), src/types/next-auth.d.ts (TypeScript augmentation so role is known on the session type).
Non-obvious decision worth remembering for defense: we're on database sessions, not JWT — "logged in" literally means a row exists in the Session table, which is why role changes apply on next request without re-login.

-----------------------------------------------------------------------------------------------------------------------------

Defense notes for Phase 2 ->

What was built: Full CRUD for the Attribute Library. Recruiters/Admins only (middleware + server-side auth check on every action). No per-row buttons — row selection + contextual toolbar. Optimistic locking on update and delete via updateMany/deleteMany with WHERE id=? AND version=?; conflict surfaced to user with a Reload button. Prefix search + category filter via URL search params. Recently used attributes tracked in a 30-day cookie, set in server actions.
Key files: prisma/schema.prisma (Attribute model with version), src/app/attributes/actions.ts (all writes + locking), src/app/attributes/attribute-table.tsx (selection UI), src/app/attributes/attribute-search.tsx (URL-param filter), src/lib/recently-used.ts (cookie helpers).
Non-obvious decisions: updateMany/deleteMany used instead of update/delete so we can include non-unique fields (version) in the WHERE clause and get a count back. Suspense wrapper on the search component because useSearchParams() requires it in Next.js App Router.

-----------------------------------------------------------------------------------------------------------------------------

Defense notes for Phase 3 ->

what was built: Full CRUD for Positions — create, duplicate, edit, delete with optimistic locking (same updateMany/deleteMany pattern as Phase 2). Linked attributes stored in PositionAttribute join table, replaced inside a $transaction on edit. Access rules stored in AccessRule table, operators filtered per attribute type in the UI.
Key files: prisma/schema.prisma (Position, PositionAttribute, AccessRule, AccessRuleOperator), src/app/positions/actions.ts (all writes, transactions, locking), src/app/positions/position-table.tsx (selection + toolbar), src/app/positions/access-rules-editor.tsx (dynamic rules UI).
Non-obvious decisions: $transaction wraps the position update + attribute link replacement — without it, a crash between those two queries would leave the position with no attributes. Access rule values are stored as plain strings regardless of type — simpler schema, type-aware comparison happens in application code (Phase 5) when evaluating whether a candidate qualifies.

-----------------------------------------------------------------------------------------------------------------------------

Defense notes for Phase 4 ->

what was built: Three-tab profile page (Me / Info / Projects). One ProfileAttribute row per (user, attribute) — single master value, upserted on first visit. Built-in attributes seeded via prisma db seed, flagged with isBuiltIn so they can't be deleted. Me and Info tabs auto-save on a 5-second debounce per field with version-checked optimistic locking. Projects use explicit Save with version-checked locking. Tag input with autocomplete (react-tag-autocomplete). Markdown editor/preview (react-markdown + remark-gfm).
Key files: prisma/seed.ts (built-in attributes), src/app/profile/actions.ts (all writes — saveProfileAttribute, add/remove, project CRUD), src/app/profile/me-tab.tsx and info-tab.tsx (auto-save with useRef debounce + version tracking), src/app/profile/projects-tab.tsx (selection toolbar + inline form).
Non-obvious decisions: Projects use explicit Save rather than auto-save — multi-field forms with markdown and tags are hard to auto-save cleanly mid-edit, and the spec's auto-save intent is clearly about attribute values. versionsRef (not versionsState) is used for version numbers in Me/Info so updating versions doesn't trigger unnecessary re-renders.