# The server's dependencies and source are installed into the plugin's own data directory

The directory the plugin is installed into is treated as read-only. Everything the tools server needs in order to run —
its dependencies, and a copy of its own source — is installed into the persistent data directory the host gives the
plugin, once per host, and the server runs from there rather than from where it was installed.

Two constraints force this. A plugin's installed directory may be a read-only cache, so nothing may be written beside
the shipped source; and pointing Node at dependencies installed elsewhere through the environment resolves only the
older module system, not the one this server uses. Source and dependencies therefore have to sit beside one another, and
the only writable place that survives a plugin update is the data directory.

## Consequences

The install is paid once per host rather than once per session or once per repository, so it needs a marker meaning "a
completed install of exactly these dependencies". The presence of a dependency tree says nothing on its own: an update
that changes the dependency list leaves one exactly as present as before, and a tree is equally present halfway through
being rewritten.

Publishing the source into that directory happens every session, must be atomic, and must be safe against several
sessions doing it at once. The directory outlives sessions, plugin updates and reboots — so anything left behind in it
is left behind for good, and anything half-written in it is what every later session runs.
