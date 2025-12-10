# assert-safe-chain

Assert that you are using a proxy when installing dependencies
At the moment, it works with @aikidosec/safe-chain and sfw proxies

To make sure that the command is run with one of these proxies, add the following to your package.json

```json
{
  "scripts": {
    "preinstall": "pnpm dlx @lcdp/assert-safe-chain@1.0.8"
  }
}
```

Using pnpm in the example, because it also gives you the minimal release age.

We recommend fixing the version of this package to avoid potential security issues.

## How it works

This package exposes a `bin` that will be called by `pnpm dlx`, `npx`, ...

This script builds a tree of the system processes, so when you run `pnpm install` without a proxy, it will look something like this :

│ Process tree: [
│ 'node ./script/preinstall.mjs',
│ 'node ~/.config/nvm/versions/node/v22.18.0/bin/pnpm install',
│ '-zsh',
│ '/usr/bin/tmux'
│ ]

The script then parses each process to figure out if one is using aikido or sfw.

If it does, then the script exits successfully, so does the preinstall, and the installation can continue.
If it doesn't, the script exits with an error, and the preinstall fails with a nice message.
