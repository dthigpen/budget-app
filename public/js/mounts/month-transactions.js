import { categorizeTransactions } from '../budget-reporter.js';

export function TransactionsPanel(panelEl) {
  const appContext = panelEl.closest('x-app-context');
  // setup buttons
  const fileUploadBtn = document.getElementById('file-upload-btn');
  fileUploadBtn.addEventListener('click', () => {
    document.getElementById('file-upload-input').click();
  });
  const transactionDialogId = 'transaction-modal';
  const newTransactionBtn = panelEl.querySelector('#new-transaction-btn');
  newTransactionBtn.setAttribute('data-target', transactionDialogId);
  newTransactionBtn.addEventListener('click', (e) => {
    console.log('New clicked!');
  });
  const transactionDialogEl = document.getElementById(transactionDialogId);
  const cancelEl = document.getElementById('transaction-modal-cancel-btn');
  const createEl = document.getElementById('transaction-modal-create-btn');
  cancelEl.addEventListener('click', (e) => {
    console.log('Cancel clicked!');
  });
  createEl.addEventListener('click', (e) => {
    console.log('Create clicked!');
  });
  function updateTable() {
    const tableEl = panelEl.querySelector('table');
    const isAvg =
      appContext.selectedMonth === undefined ||
      appContext.selectedMonth === null;
    const transactions = appContext.transactions ?? [];
    const periodTransactions = isAvg
      ? transactions
      : transactions.filter((t) => t.date.startsWith(appContext.selectedMonth));
    // remove existing transaction rows
    tableEl
      .querySelector('tbody')
      .querySelectorAll('tr')
      .forEach((rowEl) => {
        rowEl.parentNode.removeChild(rowEl);
      });
    if (!appContext.budget || periodTransactions.length === 0) {
      return;
    }
    const categorizedTransactions = categorizeTransactions(
      appContext.budget?.categories ?? [],
      periodTransactions,
    );
    categorizedTransactions.reverse();
    for (const transaction of categorizedTransactions) {
      const row = tableEl.querySelector('tbody').insertRow();
      const data = [
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.account,
        transaction.category ?? 'Uncategorized',
        'Entered',
      ];
      data.forEach((d) =>
        row.insertCell().appendChild(document.createTextNode(d)),
      );
    }
  }
  appContext.addEventListener('budgetChange', updateTable);
  appContext.addEventListener('transactionsChange', updateTable);
  appContext.addEventListener('selectedMonthChange', updateTable);
}
