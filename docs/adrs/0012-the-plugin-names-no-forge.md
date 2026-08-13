# The plugin names no forge

Nothing in the plugin **conditions what it does** on which forge is in play. A **change request** is identified by its
URL, and that URL is checked for shape only — that it parses, that it carries no whitespace, and that it is HTTP —
never for a host. The agents work through whichever forge command-line tool the repository's owner has authenticated.

A check for a particular host is what makes a plugin quietly single-forge: it costs nothing to write, and it cannot be
discovered by anyone whose forge is not the one that happened to be tested.

Naming a forge to **illustrate a mechanism** is permitted. An agent told to post a **comment** the forge can mark
**resolved** has been handed a property and no way to obtain it; two worked examples — one on GitHub, one on GitLab —
and the instruction to use the equivalent on any other forge turn that into a translation. The examples teach an
operation. They never decide one.

The line between the two is what the prose does, not which words it holds. An illustration is a named forge a reader
consults to see what an operation looks like: strike it out and the rule still stands, poorer by the how. A host check
is a named forge the behaviour turns on — a rule that holds on one forge and not another, a branch on which one is in
play, an instruction reachable only where a particular tool is installed — and it stays forbidden however it is
phrased, in prose exactly as in code.

The vocabulary rule is untouched by the carve-out. The unit a human merges is a change request, never a pull request or
a merge request, because each of those names belongs to one forge and carries its assumptions along.
