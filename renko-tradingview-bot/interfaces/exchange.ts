export interface IExchange {
    openShortPosition(currencyPair: string): void;
    openLongPosition(currecyPair: string): void;
    buy(currencyPair: string): void;
    sell(currecyPair: string): void;
}