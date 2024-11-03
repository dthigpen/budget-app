export function TransactionDialog(transactionDialogEl) {
  const appContext = transactionDialogEl.closest('x-app-context');
  // setup initial listeners: validation, buttons
  const transactionDialogId = 'transaction-modal';
  const cancelEl = document.getElementById('transaction-modal-cancel-btn');
  const createEl = document.getElementById('transaction-modal-create-btn');
  const descriptionInput = transactionDialogEl.querySelector(
    '[name="description"]',
  );
  const amountInput = transactionDialogEl.querySelector('[name="amount"]');
  const accountInput = transactionDialogEl.querySelector('[name="account"]');
  const dateInput = transactionDialogEl.querySelector('[name="date"]');
  const todayButton = transactionDialogEl.querySelector('[name="today"]');

  function setValidity(el) {
    const isValid = el.checkValidity();
    const invalidStr = isValid ? 'false' : 'true';
    el.setAttribute('aria-invalid', invalidStr);
    return isValid;
  }
  function setupValidityListener(inputEl) {
    return () => setValidity(inputEl);
  }

  descriptionInput.addEventListener(
    'input',
    setupValidityListener(descriptionInput),
  );
  amountInput.addEventListener('input', setupValidityListener(amountInput));
  dateInput.addEventListener('input', setupValidityListener(dateInput));
  accountInput.addEventListener('input', setupValidityListener(accountInput));
  dateInput.valueAsDate = new Date();
  todayButton.addEventListener('click', (e) => {
    // NOTE not thrilled about having to include preventDefault here, should be logic in modal.js to do that automatically
    e.preventDefault();
    dateInput.valueAsDate = new Date();
  });
  cancelEl.addEventListener('click', (e) => {
    console.log('Cancel clicked!');
  });
  const inputElements = [
    descriptionInput,
    amountInput,
    dateInput,
    accountInput,
  ];
  createEl.addEventListener('click', (e) => {
    const validityStates = inputElements.map((el) => {
      return setValidity(el);
    });
    if (validityStates.includes(false)) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      toggleModal(e);
    }
    const newTransaction = {
      description: descriptionInput.value,
      amount: Number(Number(amountInput.value).toFixed(2)),
      date: dateInput.value,
      account: accountInput.value,
    };
    appContext.transactions = [...appContext.transactions, newTransaction];
    console.log('Transaction created: ' + newTransaction);
  });
  appContext.addEventListener('openTransactionDialog', () => {
    transactionDialogEl.setAttribute('open', 'true');
    const data = appContext.transactionData;
    if (!data) {
      inputElements.forEach((inputEl) => {
        inputEl.value = '';
        inputEl.removeAttribute('aria-invalid');
        dateInput.valueAsDate = new Date();
      });
    } else {
      descriptionInput.value = data.description;
      amountInput.value = data.amount;
      dateInput.value = data.date;
      accountInput.value = data.account;
    }
  });
  appContext.addEventListener('closeTransactionDialog', () => {
    transactionDialogEl.removeAttribute('open');
  });
}
