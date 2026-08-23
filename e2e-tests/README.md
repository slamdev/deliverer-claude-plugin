# The end-to-end harness

`harness/` is what the tests are written against, `tests/` is the three of them, and `fixtures/` is what they run
against. **CONTRIBUTING.md § The end-to-end tests** is the entry point: what the three tests assert, what they take,
what they need, how to run them and what a **run directory** holds. Nothing here repeats it.

This file is the other half — **how to read what a run cost out of the records it left**. The harness reports one
number per run and that number is not the whole bill, so working out where the money went means going to the session
records by hand. It took a session to do the first time. It should take minutes now.

## What one run costs, and how to work it out again

### What the harness's own figure is

`RunOutcome.costUsd` is `result.total_cost_usd` from the orchestrator's session (`harness/run.ts`) — the
**orchestrator** and every agent it **dispatched**, and nothing else. Measured against the records, that is exactly
what it is: the orchestrator plus its dispatches reconstructs to within 0.25% of the reported figure for both runs
below.

Three kinds of **spend** sit outside it, and each is outside for its own reason:

- **The review rounds.** A **round** runs as its own `claude` process, spawned by the tools server through the Agent
  SDK, so it writes its own top-level session record and its cost never reaches the orchestrator's total. This is
  documented in `plugin/mcp/server/agent-backend.ts`, with a figure from a bigger epic: *"the parent accounting sees
  the poller that waited, which on one measured epic was $0.50 against the $8.61 the review behind it spent."*
- **The responder.** It answers in the human's seat, beside the run rather than inside it. The harness counts it
  separately and holds the pair to one ceiling (`harness/ceilings.ts`) — this one is by design, not a gap.
- **The verifier.** It judges what the run delivered once the run is over, carries its own ceiling and reports its own
  cost. Out of scope for anything called "what the run cost".

**So the spend ceiling cannot see review spend at all.** On the delivery below that is $0.32 against a $25 ceiling —
but the harness deliberately configures the cheapest review there is (`REVIEW_OPTIONS` in `harness/install.ts`: `low`
effort on `sonnet`, against a shipped default of `opus[1m]`), and the plugin's own measurement above is $8.61 for one
epic's reviews. The number is small here because of how the harness is configured, not because the gap is small.

### The four things that make the arithmetic wrong if you skip them

1. **`costUSD` is `null` on every assistant line.** Cost comes from `message.usage` × per-model price, computed by you.
2. **One API request is written as several lines.** A response with a text block and two tool calls becomes three
   assistant lines, all carrying the same `requestId` and the same request-level usage — and only the last one (the
   one with a `stop_reason`) carries the request's total `output_tokens`; the earlier ones carry a partial count.
   Summing lines roughly doubles the answer. **Group by `requestId` and keep the line with the highest
   `output_tokens`.** The delivery's 349 assistant lines are 176 requests.
3. **Cache is nearly all of it, and the four token classes are priced differently.** Fresh input is a rounding error
   (324 tokens in a whole delivery); cache reads are ~91% of the tokens and ~26% of the money; cache **writes** are ~7%
   of the tokens and ~40% of the money. Both runs wrote **1-hour** cache exclusively — the `ephemeral_5m` half of
   `usage.cache_creation` is zero on every line — and a 1-hour write is 2× input where a 5-minute write is 1.25×.
4. **Prices go stale.** Take them from the `claude-api` skill, never from memory, and then verify them — see next.

### Verify the price table before trusting any total

The tools server records the **round**'s own cost, from the SDK, in the `code_review_status` result the `code-reviewer`
**dispatch** reads — and the reviewer repeats it in its report:

```
"stats":{...,"costUsd":0.2175945,"turns":1,"inputTokens":4,"outputTokens":4620,
         "cacheReadTokens":17835,"cacheCreationTokens":23822,"model":"claude-sonnet-5",...}
```

That is a free oracle. Reconstruct that one round from its own session record and compare: if the token counts match
exactly, the deduplication rule is right, and if the dollars match to the cent, the price table is right. On
2026-08-15 both matched exactly — which is also what settled that Sonnet 5 was billed at the standard $3/$15 rather
than the $2/$10 introductory rate then in force. **Do this first, every time.** Everything below rests on it.

### Prices, as verified on 2026-08-15

| model | input | output | cache write 5m | cache write 1h | cache read |
|---|---|---|---|---|---|
| `claude-opus-5` | $5.00 / MTok | $25.00 / MTok | ×1.25 = $6.25 | ×2 = $10.00 | ×0.1 = $0.50 |
| `claude-sonnet-5` | $3.00 / MTok | $15.00 / MTok | ×1.25 = $3.75 | ×2 = $6.00 | ×0.1 = $0.30 |

### The script

Not checked in: it is no part of the harness, and its price table goes stale between runs — the oracle above is how
you re-establish it. Write it to a scratch file, point it at a run directory, and it prints one line per session
record and per dispatch.

```python
import json, glob, os, sys, collections

PRICE = {"claude-opus-5": (5.0, 25.0), "claude-sonnet-5": (3.0, 15.0), "claude-haiku-4-5": (1.0, 5.0)}

def cost(model, u):                                  # input, output, 5m write, 1h write, read
    pin, pout = PRICE[model]
    cc = u.get("cache_creation") or {}
    w5m = cc.get("ephemeral_5m_input_tokens", 0) or (0 if cc else u.get("cache_creation_input_tokens", 0))
    return (u.get("input_tokens", 0) * pin + u.get("output_tokens", 0) * pout
            + w5m * pin * 1.25 + cc.get("ephemeral_1h_input_tokens", 0) * pin * 2.0
            + u.get("cache_read_input_tokens", 0) * pin * 0.1) / 1e6

def requests(path):                                  # one usage record per API request, not per line
    best = {}
    for line in open(path):
        o = json.loads(line)
        if o.get("type") != "assistant":
            continue
        rid = o.get("requestId") or o["message"]["id"]
        prev = best.get(rid)
        if prev is None or o["message"]["usage"]["output_tokens"] > prev["message"]["usage"]["output_tokens"]:
            best[rid] = o
    return list(best.values())

def what(path):                                      # what this record is: sidecar first, then the prompt
    meta = path.replace(".jsonl", ".meta.json")
    if os.path.exists(meta):
        m = json.load(open(meta))
        return f"{m.get('agentType', '?')} — {m.get('description', '')}"
    for line in open(path):
        o = json.loads(line)
        if o.get("type") != "user":
            continue
        content = o["message"]["content"]
        if isinstance(content, list):
            content = " ".join(b.get("text", "") for b in content if isinstance(b, dict))
        if content.strip():
            return " ".join(content.split())
    return ""

total = 0.0
root = os.path.join(sys.argv[1], "config", "projects")
for path in sorted(glob.glob(root + "/*/*.jsonl") + glob.glob(root + "/*/*/subagents/*.jsonl")):
    reqs = requests(path)
    spent = sum(cost(o["message"]["model"], o["message"]["usage"]) for o in reqs)
    total += spent
    tokens = collections.Counter()
    for o in reqs:
        u = o["message"]["usage"]
        tokens.update({k: u.get(k, 0) for k in
                       ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")})
    print(f"${spent:8.4f}  {len(reqs):3} req  {os.path.basename(path)[:28]:30} {dict(tokens)}"
          f"\n            {what(path)[:100]}")
print(f"${total:8.4f}  ALL RECORDS (run + review + responder + verifier)")
```

It labels each record as it goes; group them into buckets — run, reviews, responder, verifier — with the map below.

### Which record is which

Records live at `config/projects/<cwd-slug>/<session-uuid>.jsonl`, with each dispatched agent's own record under
`<session-uuid>/subagents/agent-*.jsonl`.

**Every dispatch names itself.** Beside each `agent-*.jsonl` is an `agent-*.meta.json` holding the stage outright —
read those first and skip the prompt archaeology entirely:

```
{"agentType":"deliverer:assumption-reviewer","description":"Adjudicate assumptions on CR",
 "name":"assumption-reviewer-1","toolUseId":"toolu_01Ecz…","spawnDepth":1}
```

The delivery's nine sidecars name three `implementer`s, one `change-request-creator`, two `code-reviewer`s, one
`assumption-reviewer` and two `comments-addresser`s — the whole stage list, in one `cat`. Top-level sessions have no
sidecar, so those are still read by their first user message:

- **the orchestrator** — its prompt is the `/deliverer:build` or `/deliverer:refine` command, and every assistant line
  it wrote carries `attributionSkill`.
- **a review round** — a top-level session with **no assistant lines of its own**, holding one subagent whose prompt
  opens `Review target: https://…/pull/N` and whose sidecar says `general-purpose` (it is spawned by `/code-review`,
  not by the plugin). The round's prose is in the wrapper as a `local_command` system line.
- **the responder** — under the `…-session/` slug, prompt opening `You are standing in for the human who wrote the
  brief below`. One record per round of questions.
- **the verifier** — prompt opening `A delivery run has just implemented…` or `A refinement run has just turned one
  idea into an epic…`.

And one thing to know before it costs you an hour: **some sessions make a request that leaves no assistant line.** A
session carrying an `ai-title` line generated that title with a model call which bills into `total_cost_usd` and writes
no usage anywhere. It is the likeliest explanation for the only figure below that does not reconcile — six responder
rounds reconstruct to $0.1607 against $0.18 reported, and only the responder and verifier sessions carry `ai-title`
lines.

## What the two runs of 2026-08-15 cost

From `build-typescript-library-2026-08-15T17-36-58-LZuUAH` and `refine-typescript-library-2026-08-15T17-36-58-orWyMT`,
both of which passed. The headline figures in CONTRIBUTING.md are from earlier pairs the same day and are the
**harness-reported** ones, so they under-count a delivery by its review spend for the reason given above.

### The delivery — `/deliverer:build column-alignment`, 18m 44s

| stage | model | $ | req | output | 1h write | cache read |
|---|---|---:|---:|---:|---:|---:|
| orchestrator (in-session) | sonnet-5 | 0.5374 | 16 | 8,164 | 33,934 | 704,085 |
| implementer — ticket 01 | opus-5 | 0.6227 | 17 | 7,831 | 26,041 | 332,612 |
| implementer — ticket 02 | opus-5 | 0.6853 | 16 | 10,055 | 24,844 | 370,606 |
| implementer — ticket 03 | opus-5 | 0.6795 | 18 | 9,326 | 24,574 | 400,833 |
| change-request-creator | sonnet-5 | 0.4883 | 26 | 6,432 | 32,957 | 646,536 |
| assumption-reviewer | opus-5 | **1.4477** | 21 | 20,248 | 66,024 | 562,191 |
| code-reviewer — round 1 (the poller) | sonnet-5 | 0.1928 | 10 | 1,691 | 19,917 | 159,708 |
| comments-addresser — fix wave 1 | opus-5 | 0.5376 | 12 | 7,144 | 23,578 | 246,185 |
| code-reviewer — round 2 (the poller) | sonnet-5 | 0.1413 | 12 | 1,772 | 8,988 | 202,259 |
| comments-addresser — fix wave 2 | opus-5 | 0.3939 | 9 | 5,153 | 17,836 | 173,247 |
| **the harness's figure** | | **5.7265** | | | | (reported: $5.74) |
| round 1, the review itself | sonnet-5 | 0.2176 | 2 | 4,620 | 23,822 | 17,835 |
| round 2, the review itself | sonnet-5 | 0.1007 | 3 | 4,892 | 1,275 | 65,479 |
| **what the delivery actually cost** | | **6.0448** | | | | |
| the verifier, charged separately | opus-5 | 0.3709 | 4 | 5,680 | 21,054 | 36,601 |

Where it goes: the three **implementers** are $1.99 (33%); everything after the code was written — adjudicating the
**assumptions**, two rounds, two **fix waves** — is $3.03 (50%); opening the **change request** $0.49 (8%); the
orchestrator's own context $0.54 (9%). The single most expensive agent is the **assumption-reviewer at $1.45 (24%)**
for ten assumption comments — more than any implementer, and more than both fix waves together. By model: opus-5 $4.37
(72%), sonnet-5 $1.68 (28%).

### The refinement — `/deliverer:refine word-wrap`, 20m 07s

| stage | model | $ | req | output | 1h write | cache read |
|---|---|---:|---:|---:|---:|---:|
| orchestrator — the grilling, in-session | sonnet-5 | 1.8634 | 29 | 36,671 | 136,639 | 1,644,312 |
| spec-writer | opus-5 | 1.2904 | 20 | 23,321 | 43,581 | 542,664 |
| spec-writer — fold the answers in | opus-5 | 1.0741 | 22 | 15,656 | 35,439 | 656,179 |
| tickets-writer | opus-5 | 1.1971 | 17 | 18,498 | 43,551 | 597,874 |
| **the harness's figure** | | **5.4249** | | | | (reported: $5.42) |
| responder × 6 rounds, beside the run | sonnet-5 | 0.1607 | 6 | 2,311 | 21,015 | 0 |
| **what the refinement actually cost** | | **5.5857** | | | | |
| the verifier, charged separately | opus-5 | 0.4302 | 6 | 6,448 | 22,601 | 85,779 |

Nothing is hidden here — a refinement drives no review. The grilling (orchestrator plus responder) is $2.02 (36%), the
spec $2.36 (42%) across writing it and amending it for the two answers, the tickets $1.20 (21%). A third of a
refinement sits in the orchestrator's own context because the grilling happens in-session, which is the shape's one
real difference from a delivery. By model: opus-5 $3.56 (66%), sonnet-5 $2.02 (34%).

### Where the money goes, in both

| token class | delivery | refinement |
|---|---|---|
| cache write (1h, ×2) | $2.55 — 42% | $2.17 — 39% |
| output | $1.91 — 32% | $2.02 — 36% |
| cache read (×0.1) | $1.58 — 26% | $1.39 — 25% |
| fresh input | $0.0013 — 0.0% | $0.0008 — 0.0% |

The delivery moved 4.27M tokens for $6.04, of which 3.88M were cache reads. **The bill is re-priming context, not
writing code**: nine dispatches each pay a 1-hour cache write for their own prefix, and that 2× multiplier is the
single largest line in both runs, while the 87K tokens the delivery actually produced are a third of it. Neither run
made a web search.

### What is not reconciled

- The delivery reconstructs 0.24% under its reported figure and the refinement 0.09% over — sub-cent-per-request
  noise, most likely SDK-level retries and the same untracked calls as the `ai-title` ones.
- The responder reconstructs to $0.1607 against $0.18 reported. The record set is complete — six `AskUserQuestion`
  calls, six records, one request each — so the gap is spend that left no usage line; see the `ai-title` note above.
