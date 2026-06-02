export function getTransactionStatus(paymentDueDate: string | null, paymentDate: string | null): 'paid' | 'overdue' | 'planned' {
  if (paymentDate) {
    return 'paid';
  }

  if (!paymentDueDate) {
    return 'planned';
  }

  const due = new Date(paymentDueDate);
  const now = new Date();

  if (Number.isNaN(due.getTime())) {
    return 'planned';
  }

  return due.getTime() < now.getTime() ? 'overdue' : 'planned';
}