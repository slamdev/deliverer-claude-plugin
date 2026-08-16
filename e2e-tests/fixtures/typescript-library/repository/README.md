# terminal-text-kit

Helpers for laying text out in a fixed-width terminal, without cutting an ANSI escape in half.

```ts
import { truncate, visibleWidth } from "./src/index.ts";

visibleWidth("\u001B[31mred\u001B[0m"); // 3 — the colour codes cost nothing
truncate("hello world", 8); // "hello w…"
```

Runs unbuilt on Node 24: `npm run typecheck` and `npm test`.
