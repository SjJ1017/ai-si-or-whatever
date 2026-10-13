# GitHub release

1. Publish this extension folder in a dedicated repository. Exclude credentials, `node_modules`, and browser profiles.
2. Run `node --test tests/engine.test.js` and the browser test.
3. Run `node tools/package.cjs`.
4. Create the `v0.1.1` release and attach `dist/ai-si-or-whatever-v0.1.1.zip`.

The separate `-source.zip` contains the self-contained repository source. Installation is documented in both READMEs.

For a new release, update the manifest version, then test and package again.
