import { categorizeTransactions } from '../budget-reporter.js';
import { html } from '../html.js';

class Transactions extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <article class="transactions-section box">
        <header>
          <div class="transactions-section-bar">
            <h3 class="box">Transactions</h3>
            <div>
              <button data-target="transaction-modal" id="new-transaction-btn">
                New
              </button>
              <div>
                <input id="file-upload-input" type="file" hidden />
                <button id="file-upload-btn">Upload</button>
              </div>
            </div>
          </div>
        </header>
        <div class="overflow-auto">
          <table id="transactions-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Amount</th>
                <th scope="col">Account</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </article>
    `;
    const appContext = this.closest('x-app-context');
    const newTransactionBtn = this.querySelector('#new-transaction-btn');
    // const modal = document.getElementById(newTransactionBtn.dataset.target);
    newTransactionBtn.addEventListener('click', (e) => {
      console.debug('New clicked!');
      appContext.openTransactionDialog();
    });

    appContext.addEventListener('budgetChange', () => this.update());
    appContext.addEventListener('transactionsChange', () => this.update());
    appContext.addEventListener('selectedMonthChange', () => this.update());
  }

  update() {
    const appContext = this.closest('x-app-context');
    const tableEl = this.querySelector('table');
    const periodTransactions = appContext.periodTransactions;
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
}

export const registerTransactions = () => {
  customElements.define('x-transactions', Transactions);
};
