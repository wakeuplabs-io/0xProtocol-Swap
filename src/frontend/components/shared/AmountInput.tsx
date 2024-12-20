import { useEffect, useState } from "react";
import useDebounce from "../../hooks/useDebounce";

export const AmountInput = ({
    onChange,
    defaultValue = "0",
    disabled
}: {
    onChange?: (value: string) => void;
    defaultValue?: string;
    disabled?: boolean
}) => {
    const [value, setValue] = useState(defaultValue || "0");
    const debouncedSearchTerm = useDebounce(value, 500);

    useEffect(() => {
        setValue(defaultValue || "0");
    }, [defaultValue]);
    // Simulate a search function
    const handleChange = (value: string) => {
        if (onChange) onChange(value);
    };

    // Trigger search when the debounced value changes
    useEffect(() => {
        handleChange(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    return (
        <input
            value={value} 
            className="xl:max-w-[15rem] text-end w-full bg-transparent xl:text-4xl text-xl font-semibold text-black ring-0 outline-none"
            type="number"
            step=".1"
            placeholder="0"
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
        />
    );
};
