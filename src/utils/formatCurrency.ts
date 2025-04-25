// src/utils/formatCurrency.ts
import { useSettings } from "../hooks/useSettings";

export const useCurrencyFormatter = () => {
  const { settings } = useSettings();

  const format = (amount: number): string => {
    const symbol = settings?.currencySymbol || "$";
    return `${symbol} ${amount.toFixed(2)}`;
  };

  return { format };
};

// For cases where you can't use hooks (outside React components)
export const formatCurrency = (amount: number, symbol = "$"): string => {
  return `${symbol} ${amount.toFixed(2)}`;
};
