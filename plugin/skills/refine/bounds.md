# Bounds

These bound a **sweep**: a fact-finding dispatch of a refinement. Read them word for word; they hold for the whole of
your work.

**Working habits.**

- **A long wait is backgrounded.** Work that takes minutes runs in the background, and its completion notice is what
  wakes you; the time between is yours for other work. Before you wait again, read the state of what you are waiting
  on: an answer that has already landed is read now.
- **A large file is read once, in ranges.** A large file, and an output too large to show you that was saved to a file
  instead, is read with the file-reading tool: one range at a time, each range once.
- **Measure once, after the last edit.** Widths, counts and conformance are measured once the text is final.
- **A secret is never used or shown.** Configuration is read by key, one value at a time. A secret's value is never
  printed and never interpolated into a command, and two secrets are compared by their hashes or their lengths. A
  credential you find in the repository authenticates nothing: it goes in your report, and you go on without it.

**Host bounds.**

- **Read in place, write in scratch.** The repository is read where it sits. Anything you write, build or run happens
  in a scratch copy of your own under the OS temporary directory, made under a fresh name; the workspace stays as you
  found it.
- **Checkouts are kept.** A checkout or clone you make stays where it is, its path and ref named in your report, so
  the brief can hand it on to the writer.
- **The host as you found it.** Report with nothing of yours still running and every other scratch copy removed.
  Anything else you leave, your report names.
- **A live system is read-only.** A running service, cluster, database or forge is read and never written.
