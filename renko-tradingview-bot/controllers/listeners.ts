import { Email } from '../models/listeners/email';
import { SMS } from '../models/listeners/sms';

import { Debug } from '../utils/debug';

import { EVENTS, TradingViewBotEvent } from '../utils/events';
import { CONSTANTS } from '../utils/constants';
import { Utils } from '../utils/utils';

export class Listeners extends TradingViewBotEvent {
    private email: Email;
    private sms: SMS;

    private emitter: any;

    constructor() {
        super();

        this.email = new Email();
        this.sms = new SMS();

        this.events();
    }

    private events() {

        this.email.on(EVENTS.NEW_MESSAGE, (message: string) => {
            this.onReceiveNewMessage(message);
        })
    }

    private onReceiveNewMessage(message: string) {
        let parsedMessage: any = Utils.parseMessage(message);
        if (parsedMessage.success) {
            if (parsedMessage.type == CONSTANTS.SHORT_POSITION) {
                this.emit(EVENTS.NEW_SHORT_POSITION, parsedMessage.currencyPair);
            } else if (parsedMessage.type == CONSTANTS.LONG_POSITION) {
                this.emit(EVENTS.NEW_LONG_POSITION, parsedMessage.currencyPair);
            } else if (parsedMessage.type == CONSTANTS.BUY) {
                this.emit(EVENTS.NEW_BUY, parsedMessage.currencyPair);
            } else if (parsedMessage.type == CONSTANTS.SELL) {
                this.emit(EVENTS.NEW_SELL, parsedMessage.currencyPair);
            }
        }
    }
}