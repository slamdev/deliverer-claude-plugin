# Observation happens out of band, from the records the host already keeps

An **observer** is a separate process, started by the plugin's own hook, that reads what the host writes down about a
session and about every agent **dispatch**ed inside it. Nothing in a **run** is instrumented for it, and nothing in a
run knows it is there: the orchestrator does not dispatch it, is never asked to narrate its own stages, and carries no
task for it. The **trace** an observer judges is distilled from those records and from nothing a run said about
itself.

The plugin could have emitted its own trace instead. A hook per tool call is a subprocess per tool call, run
synchronously, on a delivery that makes thousands of them — a diagnostic that taxes the delivery it is watching — and
what the host hands a hook is less than what it has already written down: no per-turn token counts, and none of an
agent's own prose.

The orchestrator could have reported its own stages through a tool, the way a **round** is driven today. That spends the
context the epic needs, it puts the two documents this product is most careful about in the path of a diagnostic, and it
makes the account of a run depend on the agent whose conduct is in question — which is the one thing an orchestrator
that forms no judgement exists to prevent.

What settles it is which runs matter. The run worth observing is the one that went wrong, and a run that fell over
reports nothing: any mechanism a run has to reach for is a mechanism the interesting runs never reach. The records
outlive the run either way.

The cost accepted is that the format is the host's — undocumented, and free to change without notice. So an observer
treats it as a **claim** it re-checks rather than a contract it holds: what it cannot read costs the **debrief** a
section and costs the run nothing. An observer that has lost the format says so in the debrief, because a diagnostic
nobody can tell has stopped working is worse than one that is plainly absent.
