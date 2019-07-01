import { ITradingViewBot } from './interfaces/tradingview-bot';

import { Listeners } from './controllers/listeners';
import { Exchanges } from './controllers/exchanges';

import { EVENTS } from './utils/events';

class TradingViewBot implements ITradingViewBot {

    private listeners: Listeners = new Listeners();
    private exchanges: Exchanges = new Exchanges();

    constructor() {
        this.events();
    }

    private events() {
        this.listeners.on(EVENTS.NEW_SHORT_POSITION, (currencyPair) => {
            this.exchanges.openShortPosition(currencyPair);
        });

        this.listeners.on(EVENTS.NEW_LONG_POSITION, (currencyPair) => {
            this.exchanges.openLongPosition(currencyPair);
        });

        this.listeners.on(EVENTS.NEW_BUY, (currencyPair) => {
            this.exchanges.buy(currencyPair);
        });

        this.listeners.on(EVENTS.NEW_SELL, (currencyPair) => {
            this.exchanges.sell(currencyPair);
        });
    }
}

const tradingViewBot = new TradingViewBot();