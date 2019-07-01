import { Event } from "typescript.events";

export class TradingViewBotEvent extends Event { }

export const EVENTS: any = {
    NEW_MESSAGE: 'tradingviewbot:new_message',
    NEW_SHORT_POSITION: 'tradingviewbot:new_short_position',
    NEW_LONG_POSITION: 'tradingviewbot:new_long_position',
    NEW_BUY: 'tradingviewbot:new_buy',
    NEW_SELL: 'tradingviewbot:new_sell'
};