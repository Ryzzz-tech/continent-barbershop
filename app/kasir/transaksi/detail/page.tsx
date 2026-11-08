import CashierTransactionDetail from "./transaction-detail";

export default async function CashierTransactionDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return <CashierTransactionDetail transactionId={id ?? ""} />;
}
