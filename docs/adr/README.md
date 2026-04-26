# Architecture Decision Records (ADRs)

ADRs document significant architectural decisions, their context, and their consequences.

## Why ADRs?

Future maintainers need to know WHY we chose what we chose, not just WHAT we did. Code shows
the what; ADRs show the why — including the alternatives that were explicitly rejected and the
conditions under which the decision should be revisited.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](./0001-native-dependency-isolation.md) | Native Dependency Isolation Strategy | Accepted |

## Adding a New ADR

1. Copy the template below into `docs/adr/XXXX-short-title.md`
2. Number sequentially (next: `0002`)
3. Set `Status: Proposed` initially
4. Once the team reaches consensus, update to `Accepted` or `Rejected`
5. Do not edit a previously accepted ADR — supersede it with a new one and mark the old as
   `Superseded by ADR-XXXX`

## Template

```markdown
# ADR-XXXX: Title

- Status: Proposed
- Date: YYYY-MM-DD
- Deciders: [names or roles]

## Context

[What is the situation that forces a decision? What constraints exist?]

## Decision

[State the decision clearly in one or two sentences.]

## Rationale

- [Reason 1]
- [Reason 2]

## Consequences

### Positive

- [Benefit 1]

### Negative

- [Drawback 1 — be honest]

## Alternatives Considered

### [Alternative name] (rejected/deferred)

[What it is and why it was not chosen.]

## When to Reconsider

[Specific conditions, not vague ones, that would justify reopening this decision.]

## References

- [file or link] — [one-line description]
```
