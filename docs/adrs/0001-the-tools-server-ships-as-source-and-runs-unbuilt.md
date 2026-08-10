# The tools server ships as source and runs unbuilt

The plugin distributes the tools server as TypeScript source, and the user's own Node runs it directly by stripping the
types as it loads them. There is no build step, no bundle and no compiled artifact anywhere in the pipeline.

The plugin is published straight from the default branch with no release step, so a built artifact would be a second
thing to keep in step with the source — and nothing in the project would catch the two drifting apart.

## Consequences

The server may only use TypeScript that a stripper can erase: no construct that carries meaning at runtime, every import
naming the extension the file really has, and every type-only import marked as one. Nothing enforces those while the
server runs. The type checker is the only gate, which is why it runs in continuous integration even though there is
nothing to compile — and why a violation is invisible here and surfaces as a syntax error in a user's session.

It also puts a floor under the Node version a user must have. That floor is a support cost the plugin carries rather
than one it can paper over.
