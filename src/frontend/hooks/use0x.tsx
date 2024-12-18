"use client";
import React, {
    createContext,
    useReducer,
    useContext,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";
import { GaslessService } from "../services/gaslessService";
import { useAccount, useChainId } from "wagmi";
import { Address, formatUnits } from "viem";
import { PriceResponse, QuoteResponse, Token } from "../../shared/types";
import { TokensService } from "../services/tokensService";
import {
    AFFILIATE_FEE,
    FEE_RECIPIENT,
    MAX_ALLOWANCE,
} from "../../shared/constants";
import { isNativeToken } from "../../shared/utils";
import { SwapService } from "../services/swapService.ts";
import { use0xPrice } from "./use0xPrice";
import { use0xSwap } from "./use0xSwap";

type State0x = {
    sellToken: Token | undefined;
    buyToken: Token | undefined;
    sellAmount: string;
    tradeDirection: string;
    quote: QuoteResponse | undefined;
    finalized: boolean;
    isLoading: boolean;
    gaslessEnabled: boolean;
};

type Actions0x =
    | { type: "SET_SELL_TOKEN"; payload: Token }
    | { type: "SET_BUY_TOKEN"; payload: Token }
    | { type: "SET_SELL_AMOUNT"; payload: string }
    | { type: "SET_TRADE_DIRECTION"; payload: string }
    | { type: "SET_CHAIN_ID"; payload: number | null }
    | { type: "SET_QUOTE"; payload: any }
    | { type: "SET_FINALIZED"; payload: boolean }
    | { type: "RESET" }
    | { type: "LOADING"; payload: boolean }
    | { type: "SET_USE_GASLESS"; payload: boolean };

const initialState: State0x = {
    sellToken: undefined,
    buyToken: undefined,
    sellAmount: "0",
    tradeDirection: "sell",
    quote: undefined,
    finalized: false,
    isLoading: false,
    gaslessEnabled: true,
};

const Context0x = createContext<{
    state: State0x;
    dispatch: React.Dispatch<Actions0x>;
    priceData: PriceResponse | null | undefined;
    isLoadingPrice: boolean;
    chainId: number | undefined;
    taker: Address | undefined;
    allowanceNotRequired: boolean;
    affiliateFee: number | undefined;
    swap: (isNativeToken: boolean) => void;
    isLoadingSwap: boolean;
    swapTxHash: Address | undefined;
    swapError: any | undefined;
    lastQuoteFetch: number | undefined;
    isNativeToken: boolean;
}>({
    state: initialState,
    dispatch: () => null,
    priceData: null,
    isLoadingPrice: false,
    chainId: undefined,
    taker: undefined,
    allowanceNotRequired: false,
    affiliateFee: 0,
    swap: () => Promise<void | null>,
    swapTxHash: undefined,
    swapError: undefined,
    lastQuoteFetch: undefined,
    isLoadingSwap: false,
    isNativeToken: false,
});

const reducer = (state: State0x, action: Actions0x): State0x => {
    switch (action.type) {
        case "SET_SELL_TOKEN":
            return { ...state, sellToken: action.payload };
        case "SET_BUY_TOKEN":
            return { ...state, buyToken: action.payload };
        case "SET_SELL_AMOUNT":
            return { ...state, sellAmount: action.payload };
        case "SET_TRADE_DIRECTION":
            return { ...state, tradeDirection: action.payload };
        case "SET_QUOTE":
            return { ...state, quote: action.payload };
        case "SET_FINALIZED":
            return { ...state, finalized: action.payload };
        case "LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_USE_GASLESS":
            return { ...state, gaslessEnabled: action.payload };
        case "RESET":
            return initialState;
        default:
            return state;
    }
};

export const Provider0x = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [lastQuoteFetch, setLastQuoteFetch] = useState<number | undefined>(
        undefined
    );
    const chainId = useChainId();
    const { address } = useAccount();
    const {
        swap,
        isLoading: isLoadingSwap,
        transactionHash: swapTxHash,
        error: swapError,
    } = use0xSwap({
        quote: state.quote,
        chainId,
        gaslessEnabled: state.gaslessEnabled,
    });

    const { priceData, isLoading: isLoadingPrice } = use0xPrice({
        sellToken: state.sellToken,
        buyToken: state.buyToken,
        sellAmount: state.sellAmount,
        chainId,
        taker: address,
        gaslessEnabled: state.gaslessEnabled,
    });

    const chainTokens = useMemo(() => {
        return chainId ? TokensService.getTokenRecordsByChain(chainId) : {};
    }, [chainId]);

    const isNative = isNativeToken(state.sellToken?.address as string);
   
    useEffect(() => {
        if (!!Object.keys(chainTokens)) {
            dispatch({
                type: "SET_SELL_TOKEN",
                payload: chainTokens[Object.keys(chainTokens)[0]],
            });

            dispatch({
                type: "SET_BUY_TOKEN",
                payload: chainTokens[Object.keys(chainTokens)[1]],
            });
        }
    }, [chainId]);

    useEffect(() => {
        if (swapTxHash && !swapError) {
            dispatch({ type: "SET_FINALIZED", payload: true });
        }
    }, [swapTxHash, swapError]);

    useEffect(() => {
            dispatch({ type: "SET_USE_GASLESS", payload: !priceData?.issues.balance });
    }, [priceData?.issues.balance]);


    // Periodic fetch for quote data
    useEffect(() => {
        const fetchQuote = async (isNativeToken = false) => {
            if (
                !!state.sellToken?.address &&
                !!state.buyToken?.address &&
                !!priceData?.sellAmount &&
                !!chainId &&
                !!address
            ) {
                dispatch({ type: "LOADING", payload: true });
                const params = {
                    chainId: chainId,
                    sellToken: state.sellToken.address,
                    buyToken: state.buyToken.address,
                    sellAmount: priceData.sellAmount,
                    taker: address,
                    swapFeeRecipient: FEE_RECIPIENT,
                    swapFeeBps: AFFILIATE_FEE,
                    swapFeeToken: state.buyToken.address,
                    tradeSurplusRecipient: FEE_RECIPIENT,
                };

                const data =
                    !state.gaslessEnabled || isNative
                        ? await SwapService.getQuote(params)
                        : await GaslessService.getQuote(params);
                dispatch({ type: "SET_QUOTE", payload: data });
                setLastQuoteFetch(Date.now());
                dispatch({ type: "LOADING", payload: false });
            }
        };
     
        fetchQuote(isNative);
        const interval = setInterval(() => {
            if (state.finalized) {
                clearInterval(interval);
            } else {
                fetchQuote(isNative);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [
        state.sellToken?.address,
        state.buyToken?.address,
        priceData?.sellAmount,
        priceData?.issues.balance,
        chainId,
        address,
        isNative,
        state.finalized
    ]);

    const affiliateFee = useMemo(() => {
        return state.buyToken?.decimals &&
            priceData &&
            priceData?.fees?.integratorFee?.amount
            ? Number(
                  formatUnits(
                      BigInt(priceData.fees.integratorFee.amount),
                      state.buyToken?.decimals
                  )
              )
            : undefined;
    }, [state.buyToken?.decimals, priceData?.fees?.integratorFee?.amount]);

    return (
        <Context0x.Provider
            value={{
                state,
                swap,
                dispatch,
                priceData,
                isLoadingPrice,
                isLoadingSwap,
                swapTxHash,
                swapError,
                chainId,
                taker: address,
                allowanceNotRequired: priceData?.issues?.allowance === null,
                lastQuoteFetch,
                affiliateFee,
                isNativeToken: isNative,
            }}
        >
            {children}
        </Context0x.Provider>
    );
};

export const use0x = () => useContext(Context0x);
