import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const ConnectButtonCustom = ({
    showConnected = true,
}: {
    showConnected?: boolean;
}) => {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === "authenticated");
                return (
                    <div
                        {...(!ready && {
                            "aria-hidden": true,
                            style: {
                                opacity: 0,
                                pointerEvents: "none",
                                userSelect: "none",
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        type="button"
                                    >
                                        <div className="flex gap-2 items-center group">
                                            <span className="group-hover:text-black">Disconnected</span>
                                            <ChevronDownIcon className="h-4 w-4 group-hover:text-black" />
                                        </div>
                                    </button>
                                );
                            }
                            if (chain.unsupported) {
                                return (
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                    >
                                        Wrong network
                                    </button>
                                );
                            }
                            return (
                                <div className="flex gap-4 items-center text-sm text-black">
                                    <button
                                        onClick={openChainModal}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                        type="button"
                                    >
                                        {chain.hasIcon && (
                                            <div
                                                style={{
                                                    background:
                                                        chain.iconBackground,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 999,
                                                    overflow: "hidden",
                                                    marginRight: 4,
                                                }}
                                            >
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={
                                                            chain.name ??
                                                            "Chain icon"
                                                        }
                                                        src={chain.iconUrl}
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {/* {chain.name} */}
                                    </button>
                                    <button
                                        onClick={openAccountModal}
                                        type="button"
                                    >
                                        {account.displayName}
                                        {/* account.displayBalance
                      ? ` (${account.displayBalance})`
                      : '' */}
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};
