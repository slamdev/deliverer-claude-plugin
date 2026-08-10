# The review's credentials come from a file the owner names

The plugin forwards no authentication of its own. The owner names a file in `.env` format, and the variables it assigns
are layered over the server's own environment for the review to run under. The option is required, and a file that
cannot be read, does not parse, or assigns nothing at all is a refusal rather than a fallback.

Any fixed set of variables the plugin chose to forward would make it single-provider: the set is decided when the plugin
is published, so an owner authenticated some other way would have no way in, and an owner who wants the review to run as
a different identity than their own session would have no way to say so. A file the owner writes is the general form of
that — whatever the review needs, the owner puts in it, and the plugin neither enumerates nor interprets it.

Layered over the environment rather than replacing it, so the file need only carry what it changes. Read once when the
session starts, so an edit takes effect in the next one, which is what the option's own description promises. Nothing
the plugin reports ever echoes a value out of that file: every diagnostic names a line, and at most a key.
