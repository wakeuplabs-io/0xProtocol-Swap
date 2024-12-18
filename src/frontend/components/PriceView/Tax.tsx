import { formatTax } from "../../../shared/utils";

export const Tax = ({
    symbol,
    buy,
    tax,
}: {
    symbol?: string;
    buy?: boolean;
    tax?: string;
}) => {
    return (
        <div className="text-[#767676] text-5 font-bold ml-5">
            <p>{symbol + ` ${buy ? "Buy" : "Sell"} tax: ${!!tax ? formatTax(tax) : '-'}%`}</p>
        </div>
    );
};
