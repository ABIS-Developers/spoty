/** Integer pesos → `$80`, `$1,240`. */
export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-MX")}`;
}
