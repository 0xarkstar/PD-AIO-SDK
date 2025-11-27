# Vibe Coding Workflow for Building the Perp DEX SDK

**Claude Code handles architecture and complexity; Cursor handles speed and refinement.** This comprehensive workflow leverages both AI tools strategically to build a production-ready TypeScript Perpetual DEX SDK with async support, multiple exchange adapters, and WebSocket management. Developers using this dual-tool approach report **20-50% productivity gains** over single-tool workflows, with Claude Code excelling at multi-file operations and deep reasoning while Cursor dominates in rapid iteration and inline completions.

## The strategic division: terminal-native depth meets IDE speed

The core insight from real-world case studies is clear: Claude Code and Cursor serve fundamentally different purposes. Builder.io engineers switched to Claude Code after it successfully modified an **18,000-line React component** that other AI tools couldn't handle. Meanwhile, Cursor's tab completions and inline edits remain unmatched for moment-to-moment coding flow. For the Perp DEX SDK, this means using Claude Code for architectural scaffolding, complex WebSocket management, and multi-exchange adapter coordination—while Cursor handles implementation details, quick fixes, and iterative refinement.

The term "vibe coding" was coined by Andrej Karpathy in February 2025, describing a workflow where you "fully give in to the vibes, embrace exponentials, and forget that the code even exists." However, for production SDK development, we adapt this concept into **structured vibe coding**: AI handles implementation while you maintain architectural oversight, review security-critical code, and ensure test coverage.

## Tool capabilities determine task allocation

### Claude Code excels at foundation work

Claude Code operates as a terminal-native agentic assistant with **200K token context** (up to 1M with Sonnet 4.5). Its four core tools—bash commands, file editing, file creation, and file search—enable autonomous multi-file operations that make it ideal for SDK scaffolding:

- **Project initialization**: Generate entire directory structures, boilerplate, TypeScript configs
- **Multi-file refactoring**: Coordinate changes across exchange adapters and shared utilities
- **Test-driven development**: Write comprehensive test suites, run them, iterate until passing
- **Git integration**: 90%+ of git operations at Anthropic are handled by Claude Code
- **Documentation generation**: Automatic README.md, CLAUDE.md, API documentation

The `/init` command generates a CLAUDE.md file providing persistent project context. For the Perp DEX SDK, this should include exchange adapter patterns, WebSocket connection requirements, and type conventions.

### Cursor dominates implementation flow

Cursor's VS Code foundation combined with AI integration (supporting GPT-4.1, Claude 3.7 Sonnet, Claude Opus 4.5) makes it the superior choice for rapid development:

- **Tab completion**: Multi-line edits with diff preview, accepting with Tab or word-by-word with Cmd+→
- **Agent mode**: Up to 25 tool calls per request with automatic checkpoints
- **Composer/Cmd+K**: Targeted inline edits on selected code
- **Context awareness**: Codebase indexing for semantic search across the entire repository
- **YOLO mode**: Autonomous terminal command execution with allowlist/denylist

Cursor's `.cursor/rules/` directory enables granular project configuration—essential for maintaining consistent patterns across the SDK's multiple exchange adapters.

## Module-by-module implementation plan

The Perp DEX SDK architecture requires careful dependency ordering. Each module builds on previous foundations, with clear handoff points between Claude Code and Cursor.

### Phase 1: Project foundation (2-3 hours)

**Tool: Claude Code (primary)**

Start by having Claude Code scaffold the entire project structure. Create a CLAUDE.md file with these specifications:

```markdown
# Perp DEX SDK Project Context

## Architecture
- Monorepo structure with packages/core, packages/adapters, packages/websocket
- Hexagonal architecture: domain logic separated from external exchange APIs
- Repository pattern for exchange adapters with common interface

## Code Style
- TypeScript strict mode, ES modules syntax
- Zod validation for all external API responses
- Async/await with proper error boundaries
- Comprehensive JSDoc documentation

## Exchange Adapters
- Each adapter implements IExchangeAdapter interface
- Adapters handle authentication, rate limiting, reconnection
- Mock adapters for testing without live connections
```

**Tasks for Claude Code:**
1. Generate directory structure: `/src/core`, `/src/adapters`, `/src/websocket`, `/src/types`
2. Create base TypeScript configuration with strict mode
3. Set up ESLint, Prettier, Jest configurations
4. Initialize git repository with proper .gitignore
5. Create package.json with appropriate dependencies

**Prompt strategy:**
```
Create a TypeScript SDK project structure for a perpetual DEX trading library.
Use hexagonal architecture with clear separation between domain logic and 
exchange adapters. Include: core trading primitives, WebSocket management,
exchange adapter interfaces, and comprehensive test setup. Think through
the architecture step-by-step before creating files.
```

### Phase 2: Core type system (1-2 hours)

**Tool: Claude Code → Cursor handoff**

Claude Code defines the foundational types; Cursor refines and extends them.

**Claude Code tasks:**
1. Define core trading primitives: `Position`, `Order`, `Trade`, `Market`
2. Create exchange adapter interface: `IExchangeAdapter`
3. Design WebSocket message types with discriminated unions
4. Implement Zod schemas for runtime validation

**Cursor tasks:**
1. Add JSDoc documentation to all types
2. Refine generic constraints for type safety
3. Create type utility helpers
4. Tab-complete repetitive type patterns

**Type system structure:**
```typescript
// src/types/trading.ts - Claude Code generates
export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: Decimal;
  entryPrice: Decimal;
  unrealizedPnl: Decimal;
  leverage: number;
}

// src/types/adapter.ts - Claude Code generates interface
export interface IExchangeAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getPositions(): Promise<Position[]>;
  placeOrder(order: OrderRequest): Promise<Order>;
  subscribeToTicker(symbol: string): Observable<Ticker>;
}
```

### Phase 3: WebSocket infrastructure (3-4 hours)

**Tool: Claude Code (complex multi-file operations)**

WebSocket management is the SDK's most complex subsystem—ideal for Claude Code's deep reasoning capabilities. The reconnection logic, heartbeat management, and message routing require coordinated changes across multiple files.

**Claude Code tasks:**
1. Implement WebSocket connection manager with automatic reconnection
2. Create message routing system with type-safe handlers
3. Build heartbeat/ping-pong mechanism
4. Design subscription management for multiple streams
5. Implement exponential backoff retry logic

**Critical prompt for WebSocket module:**
```
Implement a robust WebSocket management system for cryptocurrency exchange connections.
Requirements:
- Automatic reconnection with exponential backoff (max 5 retries, 30s cap)
- Heartbeat mechanism with configurable intervals
- Type-safe message routing using discriminated unions
- Subscription management supporting market data and private channels
- Connection state machine: connecting → connected → disconnecting → disconnected
- Event emitter pattern for connection state changes

Think hard about edge cases: network interruptions during order placement,
partial message delivery, authentication timeout during reconnection.
```

**Cursor refinement tasks:**
1. Add inline comments for complex logic
2. Implement remaining message handlers via tab completion
3. Quick fixes for TypeScript strict mode errors

### Phase 4: Exchange adapters (4-6 hours)

**Tool: Parallel Claude Code instances + Cursor**

For multiple exchange adapters (Hyperliquid, dYdX, GMX), use Claude Code's git worktree feature to develop in parallel:

```bash
git worktree add ../perp-sdk-hyperliquid -b feature/hyperliquid-adapter
git worktree add ../perp-sdk-dydx -b feature/dydx-adapter
git worktree add ../perp-sdk-gmx -b feature/gmx-adapter
```

Run separate Claude Code instances in each worktree. Each adapter follows the `IExchangeAdapter` interface, ensuring consistent patterns while allowing exchange-specific optimizations.

**Adapter implementation prompt:**
```
Implement the Hyperliquid exchange adapter following IExchangeAdapter interface.
Reference the API documentation at [docs URL]. Include:
- REST API client with rate limiting (10 requests/second)
- WebSocket connection for market data and order updates
- Authentication using API key signature
- Position and order mapping to SDK types
- Comprehensive error handling with typed errors

Write tests first—confirm they fail—then implement until tests pass.
```

**Cursor's role during adapter development:**
1. Quick type fixes as interfaces evolve
2. Tab completion for repetitive API method implementations
3. Inline edits for response parsing logic

### Phase 5: Testing infrastructure (2-3 hours)

**Tool: Claude Code (TDD workflow)**

Claude Code excels at test-driven development. The workflow follows Anthropic's recommended pattern:

1. **Write tests first**: "Write tests for the WebSocket reconnection logic. Be explicit: we're doing TDD—avoid mock implementations."
2. **Confirm tests fail**: "Run the tests and confirm they fail. Do not write implementation code yet."
3. **Commit failing tests**: Establish the contract before implementation
4. **Implement**: "Write code to pass the tests. Don't modify the tests. Keep going until all tests pass."
5. **Verify with subagent**: Use Claude Code's subagent feature to review implementation

**Test structure by layer:**

| Layer | Testing Approach | Tool |
|-------|------------------|------|
| Domain (types, calculations) | Pure unit tests, no mocks | Claude Code |
| Application (business logic) | Integration tests with mock adapters | Claude Code |
| Adapters (exchange APIs) | Contract tests, VCR recordings | Claude Code + Cursor |
| E2E (full flow) | Testnet integration | Cursor (manual oversight) |

### Phase 6: Documentation and polish (1-2 hours)

**Tool: Claude Code (documentation generation)**

Claude Code generates comprehensive documentation that Cursor can't match. Use custom slash commands for consistent documentation:

```markdown
# .claude/commands/document.md
Generate comprehensive documentation for $ARGUMENTS:
- Module-level overview explaining purpose and usage
- All public API functions with parameters and return types
- Code examples for common use cases
- Error handling patterns and edge cases
- Integration with other SDK modules
```

**Documentation deliverables:**
1. README.md with quick start guide
2. API reference generated from JSDoc
3. Exchange-specific adapter guides
4. WebSocket subscription examples
5. Error handling and troubleshooting guide

## Workflow decision tree

When starting any task, follow this decision process:

```
┌─────────────────────────────────────────────────────────────┐
│                    TASK ASSESSMENT                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Does task involve      │
              │  >3 files or complex    │───Yes──▶ CLAUDE CODE
              │  multi-step reasoning?  │          (Terminal)
              └─────────────────────────┘
                            │
                           No
                            ▼
              ┌─────────────────────────┐
              │  Is it a quick fix,     │
              │  <50 lines, or needs    │───Yes──▶ CURSOR
              │  visual feedback?       │          (IDE)
              └─────────────────────────┘
                            │
                           No
                            ▼
              ┌─────────────────────────┐
              │  Does task need         │
              │  documentation or       │───Yes──▶ CLAUDE CODE
              │  git operations?        │
              └─────────────────────────┘
                            │
                           No
                            ▼
              ┌─────────────────────────┐
              │  Is real-time           │
              │  completion helpful?    │───Yes──▶ CURSOR
              └─────────────────────────┘
```

## Prompting strategies for each tool

### Claude Code prompting patterns

**Architecture planning:**
```
Before coding, analyze the existing codebase patterns. Then propose 3 different 
approaches for implementing [feature]. Use extended thinking (think hard) to 
evaluate tradeoffs. Create a PLAN.md documenting your recommendation.
```

**Multi-file operations:**
```
Refactor the exchange adapter authentication to use a shared credential manager.
Update Hyperliquid, dYdX, and GMX adapters to use the new pattern. Ensure all 
existing tests still pass after changes.
```

**TDD cycle:**
```
Write tests for [feature] that doesn't exist yet. Be explicit: we're doing TDD.
Run the tests and confirm they fail. Then implement until all tests pass.
Don't modify the tests during implementation.
```

### Cursor prompting patterns

**Inline edit (Cmd+K):**
```
Add Zod validation to this API response type. Include proper error messages
for each field validation failure.
```

**Agent mode feature:**
```
Implement the remaining order types (stop-loss, take-profit, trailing-stop)
following the existing market order pattern. Create tests for each.
```

**Plan mode:**
```
Create a plan to add rate limiting to all exchange adapters. Show file-by-file
changes needed without implementing yet.
```

## Quality assurance checkpoints

Integrate these checkpoints throughout development to maintain code quality despite AI-generated code volume.

### Checkpoint 1: Post-scaffolding (Phase 1 complete)

- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes with zero warnings
- [ ] Directory structure matches architectural plan
- [ ] CLAUDE.md accurately reflects project conventions
- [ ] Git repository initialized with proper .gitignore

### Checkpoint 2: Type system review (Phase 2 complete)

- [ ] All public types have JSDoc documentation
- [ ] Zod schemas match TypeScript interfaces
- [ ] No `any` types except where explicitly justified
- [ ] Generic constraints properly bounded
- [ ] Exchange-specific types inherit from base interfaces

### Checkpoint 3: WebSocket security review (Phase 3 complete)

- [ ] Reconnection doesn't leak subscriptions
- [ ] Authentication tokens properly refreshed
- [ ] No hardcoded credentials
- [ ] Rate limiting prevents connection spam
- [ ] Error states don't expose sensitive information

### Checkpoint 4: Adapter integration tests (Phase 4 complete)

- [ ] Each adapter passes contract tests
- [ ] Mock adapters available for offline testing
- [ ] API response validation catches malformed data
- [ ] Error handling covers all documented API errors
- [ ] Rate limiting respects exchange limits

### Checkpoint 5: Full test coverage (Phase 5 complete)

- [ ] Unit test coverage >80%
- [ ] Integration tests cover critical paths
- [ ] E2E tests pass on testnet
- [ ] Performance benchmarks meet targets
- [ ] No flaky tests in CI

### Checkpoint 6: Release readiness (Phase 6 complete)

- [ ] README includes quick start guide
- [ ] API documentation complete
- [ ] CHANGELOG updated
- [ ] npm package.json properly configured
- [ ] GitHub Actions CI/CD pipeline passing

## Time estimates by phase

| Phase | Primary Tool | Estimated Time | Key Deliverables |
|-------|-------------|----------------|------------------|
| 1. Foundation | Claude Code | 2-3 hours | Project structure, configs |
| 2. Type System | Claude Code → Cursor | 1-2 hours | Core types, interfaces |
| 3. WebSocket | Claude Code | 3-4 hours | Connection manager, routing |
| 4. Adapters | Parallel Claude Code | 4-6 hours | 3+ exchange adapters |
| 5. Testing | Claude Code | 2-3 hours | Test suites, CI setup |
| 6. Documentation | Claude Code | 1-2 hours | README, API docs |

**Total estimated time: 13-20 hours** (versus 40-60 hours without AI assistance)

## File organization optimized for AI context

Structure the codebase to maximize AI tool effectiveness:

```
perp-dex-sdk/
├── .claude/
│   ├── settings.json        # Claude Code permissions
│   └── commands/            # Custom slash commands
│       ├── test.md          # TDD workflow command
│       └── document.md      # Documentation generation
├── .cursor/
│   └── rules/               # Cursor project rules
│       ├── typescript.md    # TS conventions
│       └── adapters.md      # Adapter patterns
├── CLAUDE.md                # Project context for Claude Code
├── PLAN.md                  # Development roadmap
├── src/
│   ├── core/                # Domain logic (no external deps)
│   │   ├── types/           # Trading primitives
│   │   ├── calculations/    # PnL, liquidation math
│   │   └── validation/      # Zod schemas
│   ├── adapters/            # Exchange implementations
│   │   ├── base/            # Shared adapter logic
│   │   ├── hyperliquid/
│   │   ├── dydx/
│   │   └── gmx/
│   ├── websocket/           # WebSocket infrastructure
│   │   ├── manager.ts
│   │   ├── reconnection.ts
│   │   └── handlers/
│   └── index.ts             # Public API exports
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── api/                 # Generated API docs
    └── guides/              # Usage guides
```

## Maximizing productivity with the dual-tool workflow

### Run Claude Code inside Cursor's terminal

Open Cursor's integrated terminal and run `claude`. This provides Claude Code's deep reasoning within Cursor's visual environment—see file changes immediately while benefiting from terminal-native operations.

### Use git worktrees for parallel development

When implementing multiple exchange adapters, create separate worktrees:

```bash
git worktree add ../perp-sdk-hyperliquid -b feature/hyperliquid
cd ../perp-sdk-hyperliquid && claude
```

Run up to 3-4 Claude Code instances simultaneously, each handling a different adapter.

### Context management prevents degradation

Both tools degrade as context grows. Reset strategically:

- **Claude Code**: Use `/clear` between unrelated tasks, `/compact` when approaching limits
- **Cursor**: Start new chat sessions for major phase transitions
- **Both**: Keep CLAUDE.md and Cursor rules lean—every line is reprocessed

### The "both tools, same prompt" technique

For complex decisions, give both Claude Code and Cursor the same prompt. Developer Ed Wentworth recommends: "Give both sides the same prompt or plan, watch two minds work, then diff their opinions." Merge Claude Code's edge-case analysis with Cursor's structural approach.

## Common pitfalls and mitigation strategies

**Pitfall 1: Context pollution across modules**
- *Solution*: Use `/clear` in Claude Code when switching between adapters; start fresh Cursor sessions for new phases

**Pitfall 2: Inconsistent patterns across adapters**
- *Solution*: Define patterns in CLAUDE.md before any implementation; reference existing adapter code explicitly

**Pitfall 3: Security vulnerabilities in AI-generated auth code**
- *Solution*: Manual review checkpoint for all authentication logic; never trust AI with credential handling without review

**Pitfall 4: Over-engineering from AI suggestions**
- *Solution*: Constrain prompts with explicit scope; reject suggestions that add unnecessary complexity

**Pitfall 5: Test coverage gaps**
- *Solution*: TDD workflow with Claude Code; require tests before any implementation

## Conclusion: orchestrated AI development

The Perp DEX SDK development workflow leverages Claude Code's **deep architectural reasoning** and **multi-file coordination** alongside Cursor's **rapid iteration** and **inline completion excellence**. This isn't about choosing one tool—it's about orchestrating both for maximum velocity without sacrificing code quality.

The key insights for successful implementation:

1. **Claude Code owns the terminal**: Project scaffolding, complex multi-file refactoring, TDD cycles, documentation generation, and git operations
2. **Cursor owns the flow**: Tab completions, quick fixes, visual feedback, and inline refinements
3. **Parallel development accelerates adapters**: Git worktrees with separate Claude Code instances enable simultaneous adapter development
4. **Quality gates prevent AI debt**: Six checkpoints ensure AI-generated code meets production standards
5. **Context discipline prevents degradation**: Strategic resets and lean configuration files maintain AI effectiveness

With this structured approach, the full Perp DEX SDK—complete with multiple exchange adapters, robust WebSocket management, and comprehensive testing—can be delivered in **13-20 hours** of focused development time. The vibe is strong, but the architecture is sound.