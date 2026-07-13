# Frozen legacy v1 release

This directory is an immutable audit input for the lossless v1 migration. It is
not an editable ontology source and is never read by the application or the v2
builder. The three copied artifacts are pinned by SHA-256 in
`freeze-manifest.json` and exist only so the migration bootstrap remains
reproducible after the v2 canonical release replaces the repository-level
generated artifacts.

The only editable domain-semantic source is `ontology/source/**`.
