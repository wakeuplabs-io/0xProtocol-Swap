import { useQuery } from "@tanstack/react-query";
import { parseUnits } from "ethers";
import { AFFILIATE_FEE, FEE_RECIPIENT } from "../../shared/constants";
import { isNativeToken } from "../../shared/utils";
import { GaslessService } from "../services/gaslessService";
import { Token, PriceResponse } from "../../shared/types";
import { SwapService } from "../services/swapService.ts";
import { Address } from "viem";

interface UsePriceParams {
    sellToken: Token | undefined;
    buyToken: Token | undefined;
    sellAmount: string;
    chainId: number | undefined;
    taker: Address | undefined;
    gaslessEnabled: boolean
}

const getPrice = async (
    sellToken: Token | undefined,
    buyToken: Token | undefined,
    sellAmount: string,
    chainId: number,
    taker: Address | undefined,
    gaslessEnabled: boolean
): Promise<PriceResponse | null> => {
    if (!sellToken || !buyToken || !sellAmount || !chainId || !taker) return null;

    const parsedSellAmount = parseUnits(sellAmount, sellToken.decimals).toString();

    const params = {
        chainId,
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        sellAmount: parsedSellAmount,
        taker,
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps: AFFILIATE_FEE,
        swapFeeToken: buyToken.address,
        tradeSurplusRecipient: FEE_RECIPIENT,
    };

    return !gaslessEnabled || isNativeToken(sellToken.address)
        ? SwapService.getTokenSwapPrice(params)
        : GaslessService.getTokenGaslessPrice(params);
};

export const use0xPrice = ({
    sellToken,
    buyToken,
    sellAmount,
    chainId,
    taker,
    gaslessEnabled
}: UsePriceParams) => {
    const enabled  = !!sellToken && !!buyToken && !!sellAmount && !!chainId && !!taker
    const { data: priceData, isLoading } = useQuery({
        queryKey: ["getPrice", sellToken, buyToken, sellAmount, chainId, taker, gaslessEnabled],
        queryFn: () => getPrice(sellToken, buyToken, sellAmount, chainId!, taker, gaslessEnabled),
        enabled: enabled,
    });

    return { priceData, isLoading : isLoading && enabled };
};
