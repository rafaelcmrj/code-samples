import { CONSTANTS } from './constants';

export class Utils {
    static parseMessage(message: string): object {
        let pattern = new RegExp('(-p) (.*) (-c) (.*)');
        let matches = pattern.exec(message);

        if (matches) {

            if (matches[2] == CONSTANTS.SHORT_POSITION) {

                return {
                    success: true,
                    type: CONSTANTS.SHORT_POSITION,
                    currencyPair: matches[4]
                };

            } else if (matches[2] == CONSTANTS.LONG_POSITION) {

                return {
                    success: true,
                    type: CONSTANTS.LONG_POSITION,
                    currencyPair: matches[4]
                };

            } else if (matches[2] == CONSTANTS.BUY) {

                return {
                    success: true,
                    type: CONSTANTS.BUY,
                    currencyPair: matches[4]
                };

            } else if (matches[2] == CONSTANTS.SELL) {

                return {
                    success: true,
                    type: CONSTANTS.SELL,
                    currencyPair: matches[4]
                };

            } else {

                return {
                    success: false
                };

            }

        } else {
            return {
                success: false
            };
        }
    }

    static getAltcoin(currencyPair: string) {
        return currencyPair.substr(4);
    }
}