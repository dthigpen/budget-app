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
            <h3>New Transaction</h3>
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
                    required="true"
                  />
                </label>
                <div class="form-row">
                  <label>
                    Amount
                    <input
                      type="number"
                      step="any"
                      name="amount"
                      placeholder="0.0"
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
                    name="amount"
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
              onclick="toggleModal(event)"
            >
              Cancel</button
            ><button
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
    // setup initial listeners: validation, buttons
    const cancelEl = document.getElementById('transaction-modal-cancel-btn');
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
      this.setAttribute('open', 'true');
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
      this.removeAttribute('open');
    });
  }

  update() {}
}

export const registerTransactionDialog = () => {
  customElements.define('x-transaction-dialog', TransactionDialog);
};
