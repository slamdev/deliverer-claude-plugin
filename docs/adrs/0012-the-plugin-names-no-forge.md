# The plugin names no forge

Nothing in the plugin names GitHub, GitLab or any other forge. A **change request** is identified by its URL, and that
URL is checked for shape only — that it parses, that it carries no whitespace, and that it is HTTP — never for a host.
The agents work through whichever forge command-line tool the repository's owner has authenticated.

A check for a particular host is what makes a plugin quietly single-forge: it costs nothing to write, and it cannot be
discovered by anyone whose forge is not the one that happened to be tested.

The vocabulary follows the same rule. The unit a human merges is a change request, never a pull request or a merge
request, because each of those names belongs to one forge and carries its assumptions along.
