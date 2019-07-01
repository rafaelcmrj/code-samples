## TradingView Bot

## How to setup this script
`npm install`

`npm start`

## Setup Typescript and Node
https://basarat.gitbooks.io/typescript/docs/quick/nodejs.html

## Common Errors

*/usr/bin/env: ‘node’: No such file or directory*
ln -s /usr/bin/nodejs /usr/bin/node

# Make sure you have installed

NodeJS
Forever
Nodemon

# Gmail tips

Activate non-secure apps on your Gmail Settings

## Run using Forever

`forever start ./node_modules/.bin/nodemon --exitcrash --exec ./node_modules/.bin/ts-node -- ./tradingview-bot.ts`