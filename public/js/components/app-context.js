import {
  generateMonthReports,
  categorizeTransactions,
} from '../budget-reporter.js';
import { mergeDeep, createCompareTo } from '../util.js';
import { saveTestDataIntoStorage } from '../test-data.js';

// local storage key where all state is located under
const APP_STATE_STORAGE_KEY = 'budget-app-state';
// local storage key for whether to load in demo mode or not
const DEMO_MODE_ENABLED_KEY = 'budget-app-demo-mode-enabled';
// local storage key for where all DEMO state is located under
const APP_STATE_DEMO_MODE_STORAGE_KEY = 'budget-app-demo-mode-state';

const DEFAULT_SETTINGS = {
  currencySymbol: '$',
};

class AppContext extends HTMLElement {
  #transactions = [];
  get transactions() {
    return this.#transactions.sort(createCompareTo((t) => t.date, false));
  }
  set transactions(value) {
    this.#transactions = value;
    this.dispatchEvent(new CustomEvent('transactionsChange'));
  }

  #budget = {};
  get budget() {
    return this.#budget;
  }
  set budget(value) {
    this.#budget = value;
    this.dispatchEvent(new CustomEvent('budgetChange'));
  }
  #settings = {};
  get settings() {
    return this.#settings;
  }
  set settings(value) {
    this.#settings = value;
    this.dispatchEvent(new CustomEvent('settingsChange'));
  }

  #reports = {};
  get reports() {
    return this.#reports;
  }

  get periodTransactions() {
    const month = this.selectedMonth;
    return (
      (!month
        ? this.#transactions
        : this.#transactions.filter((t) => t.date.startsWith(month))) ?? []
    );
  }

  #transactionDialogData = null;
  #transactionDialogOpen = false;

  get transactionDialogData() {
    return this.#transactionDialogData;
  }

  updateTransaction(transactionDataToReplace, transactionData) {
    const transactions = this.transactions;
    const index = transactions.findIndex((t) => {
      return (
        t.date === transactionDataToReplace.date &&
        t.description === transactionDataToReplace.description &&
        t.amount === transactionDataToReplace.amount &&
        t.account === transactionDataToReplace.account
      );
    });
    if (index >= 0) {
      transactions[index] = transactionData;
      this.transactions = [...transactions];
    }
  }

  deleteTransaction(transactionData) {
    const transactions = this.transactions;
    const index = transactions.findIndex((t) => {
      return (
        t.date === transactionData.date &&
        t.description === transactionData.description &&
        t.amount === transactionData.amount &&
        t.account === transactionData.account
      );
    });
    if (index >= 0) {
      transactions[index] = transactionData;
      this.transactions = transactions.toSpliced(index, 1);
    }
  }

  openTransactionDialog(data = null) {
    this.#transactionDialogOpen = true;
    this.#transactionDialogData = data;
    this.dispatchEvent(new CustomEvent('openTransactionDialog'));
  }
  closeTransactionDialog(clear = true) {
    this.#transactionDialogOpen = false;
    if (clear) {
      this.#transactionDialogData = null;
    }
    this.dispatchEvent(new CustomEvent('closeTransactionDialog'));
  }
  categorizeTransactions() {
    return categorizeTransactions(this.#budget, this.#transactions);
  }
  categorizePeriodTransactions() {
    return categorizeTransactions(
      this.#budget?.categories ?? [],
      this.periodTransactions ?? [],
    );
  }
  refreshReports() {
    const overallReport = generateMonthReports(
      this.#budget,
      this.#transactions,
    );
    // turn monthly array into a map
    overallReport.monthly = overallReport?.monthly.reduce((acc, cur) => {
      acc[cur.month] = cur;
      return acc;
    }, {});
    this.#reports = overallReport;
    this.dispatchEvent(new CustomEvent('reportsChange'));
  }

  #selectedMonth = null;
  get selectedMonth() {
    // if valid selected month return it
    if (this.#selectedMonth) {
      return this.#selectedMonth;
    }
    // otherwise
    return null;
  }
  set selectedMonth(value) {
    this.#selectedMonth = value;
    this.dispatchEvent(new CustomEvent('selectedMonthChange'));
  }

  get demoMode() {
    return JSON.parse(localStorage.getItem(DEMO_MODE_ENABLED_KEY) ?? 'true');
  }

  set demoMode(value) {
    localStorage.setItem(DEMO_MODE_ENABLED_KEY, JSON.stringify(value === true));
    this.loadFromLocalStorage();
  }
  contextToString() {
    return JSON.stringify({
      budget: this.#budget,
      transactions: this.#transactions,
      settings: this.#settings,
    });
  }
  contextFromString(value) {
    const state = JSON.parse(value) ?? {};
    this.transactions = state.transactions ?? [];
    this.budget = state.budget ?? {};
    this.settings = mergeDeep(DEFAULT_SETTINGS, state.settings ?? {});
    this.selectedMonth = null;
  }

  saveToLocalStorage() {
    // TODO if this is true, user needs a way to "reset" demo data
    const allowDemoModeSaving = true;
    const isDemoMode = this.demoMode;
    // return early if not going to save to demo area
    // this allows demo data to remain unchanged on refreshes
    if (isDemoMode && !allowDemoModeSaving) {
      return;
    }
    const key = isDemoMode
      ? APP_STATE_DEMO_MODE_STORAGE_KEY
      : APP_STATE_STORAGE_KEY;
    const stateStr = this.contextToString();
    localStorage.setItem(key, stateStr);
  }
  loadFromLocalStorage() {
    console.info('Loading state from local storage');
    // default to demo mode
    const isDemoMode = this.demoMode;
    const key = isDemoMode
      ? APP_STATE_DEMO_MODE_STORAGE_KEY
      : APP_STATE_STORAGE_KEY;
    let stateStr = localStorage.getItem(key) ?? '{}';
    console.debug(`Demo mode enabled: ${isDemoMode}`);
    // if demo mode and no demo data, create demo data
    if (isDemoMode && stateStr === '{}') {
      console.debug(`Generating demo data`);
      saveTestDataIntoStorage();
      stateStr = localStorage.getItem(key) ?? '{}';
    }
    this.contextFromString(stateStr);
  }

  connectedCallback() {
    const changeEvents = [
      'transactionsChange',
      'budgetChange',
      'reportsChange',
      'settingsChange',
    ];
    changeEvents.forEach((e) => {
      this.addEventListener(e, () => {
        this.saveToLocalStorage();
      });
    });
  }
  constructor() {
    super();
    this.style.display = 'contents';
  }
}
export const registerAppContext = () => {
  customElements.define('x-app-context', AppContext);
};
