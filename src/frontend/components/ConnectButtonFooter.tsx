import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "./Button";

export const ConnectButtonFooter = ({}: {}) => {
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
                return !connected ? (
                    <Button onClick={openConnectModal} type="button">
                        <span className="group-hover:text-black">
                            Connect Wallet
                        </span>
                    </Button>
                ) : null;
            }}
        </ConnectButton.Custom>
    );
};
