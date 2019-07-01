import { IExchange } from '../../interfaces/exchange';

import { CONSTANTS } from '../../utils/constants';
import { CONFIG } from '../../config/config';

import { Debug } from '../../utils/debug';
import { Utils } from '../../utils/utils';

const plnx = require('plnx');
const TelegramBot = require('node-telegram-bot-api');

export class Poloniex implements IExchange {

    private bot: any;

    constructor() {
        this.bot = new TelegramBot('565215625:AAFGEJkLbi1LwYvYMPWPyfxk5qEuCjQOYBk', { polling: true }); // temp telegram bot to send signals

        this.init();
    }

    protected init() {
        console.log('poloniex initied');
    }

    public openShortPosition(currencyPair: string) {
        this.closeCurrentPosition(currencyPair, CONSTANTS.SHORT_POSITION).then(() => {
            this.openPosition(currencyPair, CONSTANTS.SHORT_POSITION);
        }).catch((error: any) => {
            console.log(error);
        });
    }

    public openLongPosition(currencyPair: string) {
        this.closeCurrentPosition(currencyPair, CONSTANTS.LONG_POSITION).then(() => {
            this.openPosition(currencyPair, CONSTANTS.LONG_POSITION);
        }).catch((error: any) => {
            console.log(error);
        });
    }

    private closeCurrentPosition(currencyPair: string, newPosition: string): Promise<any> {
        return new Promise((resolve, reject) => {
            plnx.getMarginPosition({
                currencyPair: currencyPair,
                key: CONFIG.EXCHANGE.POLONIEX.KEY,
                secret: CONFIG.EXCHANGE.POLONIEX.SECRET
            }).then((data: any) => {
                if (data.type == CONSTANTS.NONE_POSITION) {
                    resolve();
                } else if (data.type != newPosition) {
                    plnx.closeMarginPosition({
                        currencyPair: currencyPair,
                        key: CONFIG.EXCHANGE.POLONIEX.KEY,
                        secret: CONFIG.EXCHANGE.POLONIEX.SECRET
                    }).then((data: any) => {
                        resolve();
                    }).catch((error: any) => {
                        reject(error);
                    });
                } else {
                    reject('Current position is already a ' + newPosition + ' position');
                }
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    private openPosition(currencyPair: string, type: string) {
        const ALT = currencyPair.substr(4);

        plnx.returnTradableBalances({
            key: CONFIG.EXCHANGE.POLONIEX.KEY,
            secret: CONFIG.EXCHANGE.POLONIEX.SECRET
        }).then((marginAccount: any) => {
            const totalBTC = marginAccount[currencyPair]['BTC'];
            const totalALT = marginAccount[currencyPair][ALT];

            plnx.returnTicker().then((ticker: any) => {
                const price = ticker[currencyPair].last;
                const highestBid = ticker[currencyPair].highestBid;
                const lowestAsk = ticker[currencyPair].lowestAsk;
                const amountBuy = totalBTC / lowestAsk;
                const amountSell = totalBTC / highestBid;
                const loanRate = 0.02;

                if (type == CONSTANTS.LONG_POSITION) {
                    plnx.marginBuy({
                        currencyPair: currencyPair,
                        rate: lowestAsk,
                        amount: amountBuy,
                        lendingRate: loanRate,
                        key: CONFIG.EXCHANGE.POLONIEX.KEY,
                        secret: CONFIG.EXCHANGE.POLONIEX.SECRET
                    }).then((data: any) => {
                        console.log(data);

                        try {
                            this.bot.sendMessage('-316175439', 'Long Position (' + currencyPair + ') @ ' + price);
                        } catch (error) {
                            throw new Error('Error to send Telegram message: ' + error);
                        }

                    }).catch((error: any) => {
                        console.log(error);
                    });
                    console.log(currencyPair, '@', lowestAsk, amountBuy);

                } else if (type == CONSTANTS.SHORT_POSITION) {
                    plnx.marginSell({
                        currencyPair: currencyPair,
                        rate: highestBid,
                        amount: totalALT,
                        lendingRate: loanRate,
                        key: CONFIG.EXCHANGE.POLONIEX.KEY,
                        secret: CONFIG.EXCHANGE.POLONIEX.SECRET
                    }).then((data: any) => {
                        console.log(data);

                        try {
                            this.bot.sendMessage('-316175439', 'Short Position (' + currencyPair + ') @ ' + price);
                        } catch (error) {
                            throw new Error('Error to send Telegram message: ' + error);
                        }

                    }).catch((error: any) => {
                        console.log(error);
                    });
                    console.log(currencyPair, '@', highestBid, totalALT);
                }

            }).catch((error: any) => {
                Debug.log(error);
            })

        }).catch((error: any) => {
            Debug.log(error);
        });
    }

    public buy(currencyPair: string) {
        this.openOrder(currencyPair, CONSTANTS.BUY);
    }

    public sell(currencyPair: string) {
        this.openOrder(currencyPair, CONSTANTS.SELL);
    }

    private openOrder(currencyPair: string, type: string) {
        plnx.returnCompleteBalances({
            key: CONFIG.EXCHANGE.POLONIEX.KEY,
            secret: CONFIG.EXCHANGE.POLONIEX.SECRET
        }).then((account: any) => {
            const balanceBTC = account['BTC'].available;
            const balanceAltcoin = account[Utils.getAltcoin(currencyPair)].available;

            plnx.returnTicker().then((ticker: any) => {
                const last = ticker[currencyPair].last;
                const lowestAsk = ticker[currencyPair].lowestAsk;
                const highestBid = ticker[currencyPair].highestBid;

                if (type == CONSTANTS.BUY) {
                    if (balanceBTC > 0) {
                        plnx.buy({
                            key: CONFIG.EXCHANGE.POLONIEX.KEY,
                            secret: CONFIG.EXCHANGE.POLONIEX.SECRET,
                            currencyPair: currencyPair,
                            rate: lowestAsk,
                            amount: balanceBTC / lowestAsk
                        }).then((order: any) => {
                            console.log(order);
                        }).catch((error: any) => {
                            console.log(error);
                        });
                        Debug.log('BUY ' + currencyPair + ' @ ' + lowestAsk + ' / ' + balanceBTC / lowestAsk);
                    } else {
                        Debug.log('You must have BTC balance to buy ' + Utils.getAltcoin(currencyPair));
                    }

                    try {
                        this.bot.sendMessage('-316175439', 'BUY ' + currencyPair + ' @ ' + lowestAsk);
                    } catch (error) {
                        throw new Error('Error to send Telegram message: ' + error);
                    }
                } else if (type == CONSTANTS.SELL) {
                    if (balanceAltcoin > 0) {
                        plnx.sell({
                            key: CONFIG.EXCHANGE.POLONIEX.KEY,
                            secret: CONFIG.EXCHANGE.POLONIEX.SECRET,
                            currencyPair: currencyPair,
                            rate: highestBid,
                            amount: balanceAltcoin
                        }).then((order: any) => {
                            console.log(order);
                        }).catch((error: any) => {
                            console.log(error);
                        });
                        Debug.log('SELL ' + currencyPair + ' @ ' + highestBid + ' / ' + balanceAltcoin);
                    } else {
                        Debug.log('You do not have any ' + Utils.getAltcoin(currencyPair) + ' to sell');
                    }

                    try {
                        this.bot.sendMessage('-316175439', 'SELL ' + currencyPair + ' @ ' + highestBid);
                    } catch (error) {
                        throw new Error('Error to send Telegram message: ' + error);
                    }
                };

            }).catch((error: any) => {
                console.log(error);
            });
        }).catch((error: any) => {
            console.log(error);
        });
    }
}