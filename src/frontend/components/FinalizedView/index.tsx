import { use0x } from "../../hooks/use0x";
import Button from "../Button";
import { use0xStatus } from "../../hooks/use0xStatus";
import Status from "./Status";

export default function FinalizedView() {
    const { dispatch, swapTxHash, state, chainId, isNativeToken } = use0x();
    const { status } = use0xStatus({
        txHash: swapTxHash,
        isNative: isNativeToken,
        chainId: chainId,
        gaslessEnabled: state.gaslessEnabled,
    });

    const handleClick = () => {
        dispatch({
            type: "SET_FINALIZED",
            payload: false,
        });
    };
    return (
        <div className="flex-grow w-full h-full flex flex-col items-center justify-center text-center">
            <div className="flex-grow h-full flex items-center justify-center">
                <Status status={status} />
            </div>
            <div className="w-full">
                <Button onClick={handleClick}>Back to home</Button>
            </div>
        </div>
    );
}
