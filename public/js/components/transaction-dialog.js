import { html } from '../html.js';

class TransactionDialog extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <dialog id="transaction-modal">
        <article>
          <header>
            <button
              id="transaction-modal-close-btn"
              aria-label="Close"
              rel="prev"
              data-target="transaction-modal"
              onclick="toggleModal(event)"
            ></button>
            <h3 class="title">New Transaction</h3>
          </header>
          <div class="form-container">
            <form>
              <fieldset>
                <label>
                  Description
                  <input
                    name="description"
                    placeholder="Description"
                    minlength="1"
                    required
                  />
                </label>
                <div class="form-row">
                  <label>
                    Amount
                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      placeholder="0.0"
                      required
                    />
                  </label>
                </div>
                <div class="form-row">
                  <label>
                    Date
                    <input
                      id="date-input"
                      type="date"
                      name="date"
                      placeholder="Date"
                      required
                    />
                  </label>
                  <button name="today">Today</button>
                </div>
                <label>
                  Account
                  <input
                    type="text"
                    name="account"
                    placeholder="Account"
                    list="accounts-list"
                    required
                  />
                  <datalist id="accounts-list">
                    <option value="Some Credit Card"></option>
                    <option value="Some Checking Account"></option>
                  </datalist>
                </label>
                <label>
                  Category
                  <input
                    type="text"
                    name="category"
                    placeholder="Uncategorized"
                    disabled
                  />
                </label>
              </fieldset>
            </form>
          </div>
          <footer>
            <button
              id="transaction-modal-cancel-btn"
              role="button"
              class="secondary"
              data-target="transaction-modal"
            >
              Cancel
            </button>
            <button class="-gone" id="transaction-modal-delete-btn">
              Delete
            </button>

            <button
              id="transaction-modal-create-btn"
              autofocus
              data-target="transaction-modal"
            >
              Create
            </button>
          </footer>
        </article>
      </dialog>
    `;
    const appContext = this.closest('x-app-context');
    const dialog = this.querySelector('dialog');
    // setup initial listeners: validation, buttons
    const cancelEl = document.getElementById('transaction-modal-cancel-btn');
    const deleteEl = document.getElementById('transaction-modal-delete-btn');
    const createEl = document.getElementById('transaction-modal-create-btn');
    const descriptionInput = this.querySelector('[name="description"]');
    const amountInput = this.querySelector('[name="amount"]');
    const accountInput = this.querySelector('[name="account"]');
    const dateInput = this.querySelector('[name="date"]');
    const todayButton = this.querySelector('[name="today"]');

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
    deleteEl.addEventListener('click', () => {
      console.debug('Delete clicked!');
      const confirmDialog = document.querySelector(
        '#delete-transaction-confirm-dialog',
      );
      const confirmBtn = confirmDialog.querySelector(
        '#delete-transaction-confirm-dialog-confirm-btn',
      );
      confirmBtn.addEventListener(
        'click',
        () => {
          console.debug('Delete confirmed!');
          appContext.deleteTransaction(appContext.transactionDialogData);
          appContext.closeTransactionDialog();
        },
        { once: true },
      );
      // Open confirmation dialog
      confirmDialog.setAttribute('open', 'true');
    });
    cancelEl.addEventListener('click', () => {
      console.debug('Cancel clicked!');
      appContext.closeTransactionDialog();
    });
    const inputElements = [
      descriptionInput,
      amountInput,
      dateInput,
      accountInput,
    ];
    createEl.addEventListener('click', (e) => {
      console.debug('Clicked Update!');
      const validityStates = inputElements.map((el) => {
        return setValidity(el);
      });
      if (validityStates.includes(false)) {
        console.debug('Invalid data!');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const transactionData = {
        description: descriptionInput.value,
        amount: Number(Number(amountInput.value).toFixed(2)),
        date: dateInput.value,
        account: accountInput.value,
      };
      // TODO Find a better way of finding the transaction to update.
      const transactionDataToReplace = appContext.transactionDialogData;
      if (!transactionDataToReplace) {
        appContext.transactions = [...appContext.transactions, transactionData];
      } else {
        appContext.updateTransaction(transactionDataToReplace, transactionData);
      }
      console.debug('Closing transaction dialog');
      appContext.closeTransactionDialog();
    });
    appContext.addEventListener('openTransactionDialog', () => {
      dialog.setAttribute('open', 'true');
      const data = appContext.transactionDialogData;
      if (!data) {
        inputElements.forEach((inputEl) => {
          inputEl.value = '';
          inputEl.removeAttribute('aria-invalid');
          dateInput.valueAsDate = new Date();
          this.querySelector('header .title').textContent = 'New Transaction';
          createEl.textContent = 'Create';
          deleteEl.classList.add('-gone');
        });
      } else {
        descriptionInput.value = data.description;
        amountInput.value = data.amount;
        dateInput.value = data.date;
        accountInput.value = data.account;
        this.querySelector('header .title').textContent = 'Edit Transaction';
        createEl.textContent = 'Update';
        deleteEl.classList.remove('-gone');
      }
    });
    appContext.addEventListener('closeTransactionDialog', () => {
      dialog.removeAttribute('open');
    });
  }

  update() {}
}

export const registerTransactionDialog = () => {
  customElements.define('x-transaction-dialog', TransactionDialog);
};
