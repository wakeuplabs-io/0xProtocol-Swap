import { Address } from "viem";
import {
    ARBITRUM_TOKENS,
    ARBITRUM_TOKENS_BY_SYMBOL,
    MAINNET_TOKENS,
    MAINNET_TOKENS_BY_SYMBOL,
    SEPOLIA_TESTNET_TOKENS,
    SEPOLIA_TESTNET_TOKENS_BY_SYMBOL,
} from "../../shared/constants";
import { POLYGON_TOKENS } from "../../shared/polygon_tokens";
import { POLYGON_TOKENS_BY_SYMBOL } from "../../shared/polygon_tokens_by_symbol";
import { Token } from "../../shared/types";

export class TokensService {
    static getTokenRecordsByChain(chainId: number): Record<string, Token> {
        switch (chainId) {
            case 137:
                return POLYGON_TOKENS_BY_SYMBOL;
            case 1:
                return MAINNET_TOKENS_BY_SYMBOL;
            case 42161:
                return ARBITRUM_TOKENS_BY_SYMBOL;
            case 11155111:
                return SEPOLIA_TESTNET_TOKENS_BY_SYMBOL;
            default:
                return {};
        }
    }

    static getTokensArrayByChain(chainId: number): Token[] {
        switch (chainId) {
            case 137:
                return POLYGON_TOKENS;
            case 1:
                return MAINNET_TOKENS;
            case 42161:
                return ARBITRUM_TOKENS;
            case 11155111:
                return SEPOLIA_TESTNET_TOKENS;
            default:
                return [];
        }
    }

    static addRecentToken(tokenAddress: Address): void {
        if (typeof localStorage === "undefined") return;
        const RECENT_TOKENS_KEY = "recent_tokens";

        // Get existing tokens from local storage
        const storedTokens = localStorage.getItem(RECENT_TOKENS_KEY);
        let recentTokens: Address[] = storedTokens
            ? JSON.parse(storedTokens)
            : [];

        // Remove the token if it already exists to ensure no duplicates
        recentTokens = recentTokens.filter(
            (addr: Address) => addr !== tokenAddress
        );

        // Add the new token symbol to the beginning of the list
        recentTokens.unshift(tokenAddress);

        // Keep only the latest 10 tokens
        if (recentTokens.length > 10) {
            recentTokens = recentTokens.slice(0, 10);
        }

        localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(recentTokens));
    }

    static getRecentTokens(): Address[] {
        if (typeof localStorage === "undefined") return [];
        const RECENT_TOKENS_KEY = "recent_tokens";
        const storedTokens = localStorage.getItem(RECENT_TOKENS_KEY);
        return storedTokens ? JSON.parse(storedTokens) : [];
    }
}
