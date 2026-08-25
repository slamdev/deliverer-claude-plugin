# 01 — Say what `plugin/mcp/` holds, before it holds more than a server

Status: ready-for-agent

**Blocked by:** None — can start immediately.

**What to build:** a contributor reading the project tree, the project instructions or the package's own description
finds `plugin/mcp/` described as the plugin's Node code, of which the tools server is one part — rather than as the
tools server itself. Every ticket after this one adds a second entry point to that directory, and each of them would
otherwise have to correct the same three documents on its way past. **Prefactoring**: it lands first so no later ticket
leaves a document lying. Settled as D30 and D31 in `../spec.md`.

- [ ] CONTRIBUTING's project tree describes `plugin/mcp/` as the plugin's Node code, and names the tools server as
      what it holds today rather than as what the directory is.
- [ ] `.claude/CLAUDE.md`'s section on the directory is reworded the same way, and every claim it already makes
      survives intact: that the code ships unbuilt, that `tsc --noEmit` is the only thing holding up the three
      options that allow it, and that the comments in `server/` carry the reasoning.
- [ ] The package's own `description` no longer says the directory is only an MCP server.
- [ ] The package `name` is left alone. Renaming it churns the lockfile and the install for a word, and nothing
      outside this repository reads it.
- [ ] No file moves, no import changes, and the two commands CI runs are untouched.
- [ ] The framing is durable: adding a second entry point later must not require rewriting these sentences again,
      only extending the list of what the directory holds.
- [ ] No ADR is added — this is settled in the spec, not architecture in its own right.
- [ ] The glossary's words are used, and each file's prevailing column width and register are matched.
