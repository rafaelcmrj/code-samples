import { CONFIG } from '../../config/config';
import { EVENTS, TradingViewBotEvent } from '../../utils/events';

import { Debug } from '../../utils/debug';

const MailListener = require('mail-listener2');

export class Email extends TradingViewBotEvent {
    private mailListener: any;

    constructor() {
        super();

        this.init();
        this.events();
    }

    private init() {
        this.mailListener = new MailListener({
            username: CONFIG.EMAIL.username,
            password: CONFIG.EMAIL.password,
            host: CONFIG.EMAIL.host,
            port: CONFIG.EMAIL.port,
            tls: CONFIG.EMAIL.tls,
            connTimeout: 10000,
            authTimeout: 5000,
            //debug: console.log,
            tlsOptions: { rejectUnauthorized: false },
            mailbox: "INBOX",
            searchFilter: ["UNSEEN"],
            markSeen: true,
            fetchUnreadOnStart: false
        });

        this.mailListener.start();
    }

    private events() {
        this.mailListener.on('server:connected', () => {
            Debug.log('imap server connected');

            // debug
            //this.emit(EVENTS.NEW_MESSAGE, 'TradingView Alert: -p sell -c BTC_ETH');
            //this.emit(EVENTS.NEW_MESSAGE, 'TradingView Alert: -p buy -c BTC_ETH');
        });

        this.mailListener.on('server:disconnected', () => {
            Debug.log('imap server disconnected');

            throw new Error('Restart app due to IMAP disconnection');
        });

        this.mailListener.on('error', (error: string) => {
            Debug.log(error);
        });

        this.mailListener.on('mail', (mail: any, seqno: any, attrs: any) => {
            Debug.log('new email received (' + mail.subject + ')');

            this.emit(EVENTS.NEW_MESSAGE, mail.subject);
        });
    }
}