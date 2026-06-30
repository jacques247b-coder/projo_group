# Update needed in schema.prisma

The ProductOptionGroup "type" field needs a third value: "TEXT" (free text input, no choices).

No schema change needed structurally — "type" is already a String field that accepts "SINGLE", "MULTI", or now "TEXT".
For TEXT type groups, no ProductOptionChoice records are needed — the customer just types into a field.
