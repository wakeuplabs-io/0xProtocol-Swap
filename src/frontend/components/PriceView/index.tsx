"use client";
import { useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useBalance } from "wagmi";
import { zeroAddress } from "viem";
import { ConnectButtonCustom } from "../../components/ConnectButton";
import { ApproveButton } from "./ApproveButton";
import { AssetSelector } from "../../components/AssetSelector";
import { useModal } from "../../hooks/useModal";
import { Asset } from "./Asset";
import { PriceViewHeader } from "../../components/Header";
import { use0x } from "../../hooks/use0x";
import { Token } from "../../../shared/types";
import { roundToNDecimals } from "../../../shared/utils";
import { useERC20Approve } from "../../hooks/useERC20Approve";
import { Tax } from "./Tax";
import Button from "../Button";
import { ConnectButtonFooter } from "../ConnectButtonFooter";

export default function PriceView() {
    const [tradeDirection, setTradeDirection] = useState("sell");
    const {
        state,
        dispatch,
        priceData,
        isLoadingPrice,
        swapTxHash,
        swapError,
        isLoadingSwap,
        chainId,
        taker,
        allowanceNotRequired,
        affiliateFee,
        swap,
        isNativeToken
    } = use0x();

    const {
        data,
        isError,
        isLoading: isLoadingBalance,
    } = useBalance({
        address: taker,
        ...(!isNativeToken && {
            token: state.sellToken?.address,
        }),
    });
    const { openModal, closeModal } = useModal("my_modal_1");
    const { allowance } = useERC20Approve(
        state.sellToken?.address || zeroAddress,
        taker || zeroAddress,
        priceData?.issues?.allowance?.spender || zeroAddress
    );

    const handleSellTokenChange = (token: Token) => {
        dispatch({ type: "SET_SELL_TOKEN", payload: token });
        closeModal();
    };

    const handleBuyTokenChange = (token: Token) => {
        dispatch({ type: "SET_BUY_TOKEN", payload: token });
        closeModal();
    };

    const handleSellAmountChange = (amount: string) => {
        dispatch({ type: "SET_SELL_AMOUNT", payload: amount });
    };

    const handleTokenChange = (token: Token) => {
        if (tradeDirection === "sell") {
            handleSellTokenChange(token);
        } else {
            handleBuyTokenChange(token);
        }
    };

    const sellTokenDecimals = state.sellToken?.decimals;
    const buyTokenDecimals = state.buyToken?.decimals;

    const buyAmount = roundToNDecimals(
        priceData?.buyAmount
            ? formatUnits(priceData?.buyAmount, buyTokenDecimals)
            : "0",
        3
    );
    const sellTokenTax = priceData?.tokenMetadata?.sellToken;
    const buyTokenTax = priceData?.tokenMetadata?.buyToken;

    const inSufficientBalance =
        data && state.sellAmount
            ? parseUnits(state?.sellAmount, sellTokenDecimals) > data.value
            : true;

    const handleAssetClick = (direction: string) => {
        setTradeDirection(direction);
        openModal();
    };

    const showSwapButton =
        allowanceNotRequired || (!!allowance && BigInt(allowance) > 0n);

    const isLoading =
        isLoadingPrice || isLoadingSwap || state.isLoading || isLoadingBalance;

    const showApproveButton =
        taker &&
        state.sellToken?.address &&
        priceData?.issues?.allowance?.spender &&
        !showSwapButton;
    return (
        <div className="w-full">
            <AssetSelector
                value={state.sellToken?.symbol.toLocaleLowerCase()}
                onChange={handleTokenChange}
                chainId={chainId}
            />
            <div className="w-full">
                <PriceViewHeader />
                <div className="rounded-md my-10">
                    <section>
                        {state.sellToken && (
                            <Asset
                                title="Pay"
                                token={state.sellToken}
                                amount={state.sellAmount}
                                onAssetClick={() => handleAssetClick("sell")}
                                onAmountChange={handleSellAmountChange}
                            />
                        )}
                    </section>

                    <section className="my-4">
                        {state.buyToken && (
                            <Asset
                                title="Receive"
                                token={state.buyToken}
                                amount={buyAmount}
                                onAssetClick={() => handleAssetClick("buy")}
                                disabled
                                isLoading={isLoadingPrice}
                            />
                        )}
                    </section>

                    {/* Affiliate Fee Display */}
                    <div className="text-[#767676] text-5 font-semibold ml-5">
                        {`Affiliate Fee: ${
                            !!affiliateFee ? affiliateFee : "-"
                        } ${
                            !!state?.buyToken?.symbol
                                ? state?.buyToken?.symbol
                                : ""
                        }`}
                    </div>

                    {/* Tax Information Display */}
                    <Tax
                        symbol={state.buyToken?.symbol}
                        buy={true}
                        tax={buyTokenTax?.buyTaxBps}
                    />
                    <Tax
                        symbol={state.sellToken?.symbol}
                        buy={false}
                        tax={sellTokenTax?.sellTaxBps}
                    />
                </div>
                {showSwapButton && (
                    <Button
                        disabled={inSufficientBalance}
                        onClick={() => swap(isNativeToken)}
                        loading={isLoading}
                    >
                        {inSufficientBalance ? "Insufficient Balance" : "Swap"}
                    </Button>
                )}
                {showApproveButton && (
                    <ApproveButton
                        sellTokenAddress={state.sellToken?.address}
                        taker={taker}
                        disabled={inSufficientBalance}
                        spender={priceData?.issues?.allowance?.spender}
                        inSufficientBalance={inSufficientBalance}
                    />
                )}

                {!taker && <ConnectButtonFooter />}
                {!showSwapButton && !showApproveButton && taker && (
                    <Button disabled>Swap</Button>
                )}
            </div>
        </div>
    );
}
