import { Debug } from '../utils/debug';

import { Poloniex } from '../models/exchanges/poloniex';

export class Exchanges {
    private poloniex: Poloniex = new Poloniex();

    private exchange: any;

    constructor() {
        this.init();
    }

    private init() {
        this.exchange = this.poloniex; // set a default variable to handle multiple exchanges
    }

    public openShortPosition(currencyPair: string) {
        Debug.log('openShortPosition');

        this.exchange.openShortPosition(currencyPair);
    }

    public openLongPosition(currencyPair: string) {
        Debug.log('openLongPosition');

        this.exchange.openLongPosition(currencyPair);
    }

    public buy(currencyPair: string) {
        Debug.log('buy');

        this.exchange.buy(currencyPair);
    }

    public sell(currencyPair: string) {
        Debug.log('sell');

        this.exchange.sell(currencyPair);
    }
}