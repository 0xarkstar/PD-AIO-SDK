# ADR-0001: Native Dependency Isolation Strategy

- Status: Accepted
- Date: 2026-04-26
- Deciders: PD-AIO-SDK maintainers

## Context

PD-AIO-SDK is a TypeScript monorepo SDK targeting 16+ perp DEX adapters. It ships native
dependencies today (Lighter WASM signer via precompiled headers for 4 platforms; see
`native/lighter/README.md`) and optionally binds native system libraries via `koffi` FFI
(`package.json:199-200`). The distribution surface includes both Node.js (server-side trading
bots) and browser builds where applicable.

Because the monorepo is adapter-based, future adapters may introduce their own native
dependencies, creating potential version conflicts within the same process.

Two established patterns exist for dealing with native dependency isolation:

**In-process FFI/WASM** — native code is loaded into the host process address space via WASM
or a Node.js FFI binding. Module loading is lazy and on-demand.

**Subprocess IPC** — native code runs in an isolated child process (separate venv or binary),
communicating with the host over stdin/stdout JSON-RPC. This is the pattern used by the
reference Python project `bot-infrastructure` (`exchange_bridge.py`), which spawns a separate
`nado_venv` Python subprocess and exchanges JSON-RPC messages over stdin/stdout to avoid
conflicting native module versions.

## Decision

PD-AIO-SDK uses **in-process FFI/WASM via dynamic imports** for all native dependencies.
Subprocess IPC is NOT used and is not on the roadmap.

## Rationale

- **Lazy loading is preserved.** `factory.ts:89-122` defines adapter loaders as async lambdas;
  `factory.ts:201-229` executes them only at `createExchange()` call time. Subprocess IPC would
  require either an eager process spawn at startup (penalizing memory and startup time for all
  users) or a per-call spawn (adding round-trip latency on every API method invocation).

- **Browser builds remain viable.** `package.json:16-21` declares a browser shim that redirects
  the native Lighter signer to a WASM variant and stubs out Node-only modules. Subprocess IPC
  has no browser equivalent — spawning child processes is not available in browser environments.

- **Tree-shaking is preserved.** `package.json:22` declares `"sideEffects": false`, allowing
  bundlers to eliminate unused adapters entirely. IPC requires bundling subprocess entry-point
  scripts and their dependencies, which breaks static analysis and prevents dead-code elimination.

- **`IExchangeAdapter` contract semantics are unchanged.** Every adapter method is an in-process
  async call. Wrapping each method in an IPC roundtrip would add serialization overhead, require
  every parameter and return type to be JSON-serializable, and change the observable behavior of
  error propagation (native exceptions become stringified error payloads).

- **Current native footprint is small.** The only native dependency today is the Lighter WASM
  signer. The cost-benefit of introducing subprocess process management, IPC framing, and PID
  lifecycle handling does not justify the isolation benefit at this scale.

## Consequences

### Positive

- Startup time and memory are unaffected for adapters that are never loaded.
- Browser-compatible builds work without a separate build pipeline.
- Tree-shaking eliminates unused adapter code from consumer bundles.
- Debugging is straightforward: stack traces are contiguous, no IPC stream parsing.
- Per-call latency is native function-call speed with no serialization overhead.
- No process lifecycle surface: no PID tracking, no zombie cleanup, no restart logic.

### Negative

- A native dependency version conflict (e.g., two adapters requiring incompatible openssl
  versions) cannot be isolated — it will crash or corrupt the host process.
- A buggy or panicking native binding affects the entire SDK consumer; there is no privilege
  boundary between adapters.
- Memory pressure from native modules is shared with the host runtime; a leaking native
  binding leaks into the consumer's heap.
- It is not possible to run two irreconcilable native module versions simultaneously within
  the same SDK instance.

## Alternatives Considered

### Subprocess IPC (rejected)

The `bot-infrastructure` Python reference implementation uses this pattern:
`exchange_bridge.py` spawns an isolated `nado_venv` subprocess and exchanges JSON-RPC messages
over stdin/stdout (`{"id": 1, "method": "get_mark_price", "params": {...}}` →
`{"id": 1, "result": ...}`). This cleanly isolates conflicting native module versions at the
cost of a separate Python process per exchange.

Reasons rejected for this SDK:

- Loses lazy loading — process must be spawned before first call.
- Loses browser support — child processes are unavailable in browser runtimes.
- Adds IPC framing and JSON serialization on every method call.
- Adds process lifecycle management (spawn, restart, PID tracking, exit handling).
- Requires all method parameters and return types to be JSON-serializable, constraining the
  `IExchangeAdapter` contract.
- Changes error propagation: native exceptions become opaque string payloads.

### Worker Threads (deferred)

Node.js Worker Threads would help offload CPU-bound tasks (e.g., signature batching) to a
separate thread without IPC serialization overhead. However, Worker Threads do NOT solve native
module version conflicts — workers share the same native module loading rules and global native
state as the main thread. This option should be reconsidered if a CPU-bound hotpath is
identified in profiling, but it does not address the isolation problem.

## When to Reconsider

Reopen this ADR if any of the following becomes true:

- Two or more adapters require irreconcilable native module versions (e.g., openssl 1.x vs 3.x)
  and no compatible version can be found.
- A security incident demonstrates that the lack of a privilege boundary causes data leakage
  between adapters.
- A native binding crash takes down a production consumer in a way that subprocess isolation
  would demonstrably have prevented.

## References

- `native/lighter/README.md` — current Lighter WASM signer setup and precompiled headers
- `src/factory.ts:89-122` — lazy adapter loader map (async dynamic import lambdas)
- `src/factory.ts:201-229` — `createExchange()` lazy loader invocation
- `package.json:16-21` — browser shim (WASM signer redirect, crypto stub)
- `package.json:22` — `sideEffects: false` (tree-shaking)
- `package.json:199-200` — optional `koffi` FFI dependency
