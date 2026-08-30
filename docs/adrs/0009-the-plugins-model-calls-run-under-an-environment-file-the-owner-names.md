# The plugin's model calls run under an environment file the owner names

The plugin forwards no authentication of its own. The owner names one file of `KEY=value` assignments, and the variables
it assigns are layered over the environment of every model call the plugin makes: each **round**'s review, and the
observation's **dispatch note**s and its synthesis. The review was the first consumer, and for a while the only one,
which is history rather than the decision — one file authenticates the whole plugin.

Any fixed set of variables the plugin chose to forward would make it single-provider: the set is decided when the plugin
is published, so an owner authenticated some other way would have no way in, and an owner who wants the plugin's own
calls to run as a different identity than their session would have no way to say so. A file the owner writes is the
general form of that — whatever those calls need, the owner puts in it, and the plugin neither enumerates nor
interprets it.

Layered over the environment rather than replacing it, so the file need only carry what it changes. Read once, when the
process that will use it starts, so an edit takes effect the next time — which is what the option's own description
promises. Nothing the plugin reports ever echoes a value out of that file: every diagnostic names a line, and at most a
key.

**Widening it from the review to the whole plugin costs no configuration and buys a redirection.** The option is
required, so every install that works already names a file: a host that withholds its credential from the observation is
fixed by a plugin update, with nothing to discover and no upgrade step. Against that, a host that authenticated those
calls by inheritance is redirected to the provider the file names wherever the file assigns the same variables, and the
owner's only recourse for a model that provider refuses is the option that names the model. That was taken over an
observation-only option nobody would find, on the ground that the case which needs nothing is the common one.

**And it accepts a wider exposure.** One file now authenticates two unrestricted agents rather than one, and the second
runs unattended: nothing reads the synthesis's output before it is written, and the prompt it runs on carries content
distilled from the owner's own repository. Every other assignment in the file — a cloud token, a registry token,
whatever else the owner keeps there — is in that agent's environment too. Filtering the file down to the variables the
plugin recognises is the narrowing that suggests itself, and it is refused on the ground the decision already rests on:
a recognised set is a set decided when the plugin ships, which is the single-provider trap again by another route. So
the exposure is stated here rather than narrowed away.

**The review refuses where the observation degrades.** A file that cannot be read, does not parse, or assigns nothing at
all is a refusal for every review; the same file leaves the observation running on the environment it inherited, saying
that the named source was unusable and why. The postures differ because the stakes do. A review running as an identity
nobody chose is worse than no review — it writes in the owner's repository and posts in their name. An observation
that judged something is better than one that judged nothing, and nothing it does reaches the **run** either way.
