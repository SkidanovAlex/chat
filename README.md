# NEAR Chat

This is a work-in-progress repo for NEAR chat.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/nearprotocol/chat)

See: 
- `assembly/main.ts` for contract code
- `assembly/model.ts` for data structures
- `src/main.js` for wallet integration and contract use with `nearlib`
- `src/index.html` for HTML part


To deploy:
```
yarn
yarn build
yarn deploy -- --contract nearchat
```
