import { useState } from "react";
import { handleError } from "../../shared/utils/errors";
import { GaslessService } from "../services/gaslessService";
import { useSendTransaction, useAccount, useSignTypedData } from "wagmi";
import { Hex, numberToHex, concat, size } from "viem";
import { useTxHelpers } from "./useTxHelpers";
import { QuoteResponse } from "../../shared/types";
import { publicClient } from "../client";

interface UseSwapParams {
    quote: QuoteResponse | undefined; // Swap quote object
    chainId: number;
    gaslessEnabled: boolean;
}

export const use0xSwap = ({ quote, chainId, gaslessEnabled }: UseSwapParams) => {
    const [isLoading, setIsLoading] = useState(false);
    const [transactionHash, setTransactionHash] = useState<Hex | undefined>();
    const [error, setError] = useState<any | undefined>();
    const { address } = useAccount();
    const { signTypedDataAsync } = useSignTypedData();

    const {
        signApprovalObject,
        signTradeObject,
        standardApproval,
        approvalSplitSignDataToSubmit,
        tradeSplitSignDataToSubmit,
    } = useTxHelpers();

    const { sendTransaction } = useSendTransaction();

    const swapNormal = async () => {
        if (!quote) {
            throw new Error("No quote");
        }

        // On click, (1) Sign the Permit2 EIP-712 message returned from quote
        if (quote.permit2?.eip712) {
            let signature: Hex | undefined;
            signature = await signTypedDataAsync(quote.permit2.eip712);
            // (2) Append signature length and signature data to calldata
            if (signature && quote?.transaction?.data) {
                const signatureLengthInHex = numberToHex(size(signature), {
                    signed: false,
                    size: 32,
                });

                const transactionData = quote.transaction.data as Hex;
                const sigLengthHex = signatureLengthInHex as Hex;
                const sig = signature as Hex;

                quote.transaction.data = concat([
                    transactionData,
                    sigLengthHex,
                    sig,
                ]);
            } else {
                throw new Error(
                    "Failed to obtain signature or transaction data"
                );
            }
        }

        // (3) Submit the transaction with Permit2 signature
        sendTransaction &&
            sendTransaction(
                {
                    account: address,
                    gas: !!quote?.transaction.gas
                        ? BigInt(quote?.transaction.gas)
                        : undefined,
                    to: quote?.transaction.to,
                    data: quote.transaction.data, // submit
                    value: quote?.transaction.value
                        ? BigInt(quote.transaction.value)
                        : undefined, // value is used for native tokens
                    chainId: chainId,
                },
                {
                    onError: (error: any) => {
                        handleError(error);
                    },
                    onSuccess: (txHash) => {
                        setTransactionHash(txHash);
                    },
                }
            );
    };

    async function executeTrade(
        tokenApprovalRequired: boolean,
        gaslessApprovalAvailable: boolean
    ) {
        let approvalSignature: Hex | null = null;
        let approvalDataToSubmit: any = null;
        let tradeDataToSubmit: any = null;
        let tradeSignature: any = null;

        if (tokenApprovalRequired) {
            if (gaslessApprovalAvailable && quote?.approval) {
                approvalSignature = await signApprovalObject(quote?.approval); // Function to sign approval object
            } else {
                await standardApproval(quote); // Function to handle standard approval
            }
        }

        if (approvalSignature && quote?.approval) {
            approvalDataToSubmit = await approvalSplitSignDataToSubmit(
                approvalSignature,
                quote?.approval
            );
        }

        if (!quote?.trade) {
            throw new Error("No trade");
        }
        tradeSignature = await signTradeObject(quote?.trade); // Function to sign trade object
        tradeDataToSubmit = await tradeSplitSignDataToSubmit(
            tradeSignature,
            quote?.trade
        );

        const successfulTradeHash = await submitTrade(
            tradeDataToSubmit,
            approvalDataToSubmit
        ); // Function to submit trade

        setIsLoading(false);
        return successfulTradeHash;
    }

    // 4. Make a POST request to submit trade with tradeObject (and approvalObject if available)
    async function submitTrade(
        tradeDataToSubmit: any,
        approvalDataToSubmit: any
    ): Promise<void> {
        let successfulTradeHash;
        const requestBody: any = {
            trade: tradeDataToSubmit,
            chainId: publicClient.chain.id,
        };
        if (approvalDataToSubmit) {
            requestBody.approval = approvalDataToSubmit;
        }
        const data = await GaslessService.submit(
            tradeDataToSubmit,
            approvalDataToSubmit,
            chainId
        );
        successfulTradeHash = data?.tradeHash;

        return successfulTradeHash;
    }
    const swapGasless = async () => {
        if (!quote) {
            throw new Error("No quote");
        }
        setIsLoading(true);
        // 3. Check if token approval is required and if gasless approval is available
        const tokenApprovalRequired = quote?.issues?.allowance != null;
        const gaslessApprovalAvailable = quote?.approval != null;
        let successfulTradeHash: any = null;

        successfulTradeHash = await executeTrade(
            tokenApprovalRequired,
            gaslessApprovalAvailable
        );
        if (successfulTradeHash) {
            setTransactionHash(successfulTradeHash);
        }
        return;
    };

    const swap = async (isNativeToken: boolean) => {
        try {
            if (!quote) {
                setError(new Error("Quote is required"));
                return null;
            }
            return !gaslessEnabled || isNativeToken
                ? await swapNormal()
                : await swapGasless();
        } catch (error) {
            handleError(error);
            setError(error);
        }
    };

    return {
        swap,
        isLoading,
        transactionHash,
        error,
    };
};
