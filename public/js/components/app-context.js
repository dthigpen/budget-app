import { generateMonthReports } from '../budget-reporter.js';

const APP_STATE_STORAGE_KEY = 'budget-app-state';
const DEFAULT_STATE = {
  transactions: [],
  budget: {},
  settings: [],
};
class AppContext extends HTMLElement {
  #transactions = [];
  get transactions() {
    return this.#transactions;
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
  #settings = [];
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
    // console.log({ overallReport });
    this.#reports = overallReport;
    this.dispatchEvent(new CustomEvent('reportsChange'));
  }

  #selectedMonth = null;
  get selectedMonth() {
    return this.#selectedMonth;
  }
  set selectedMonth(value) {
    this.#selectedMonth = value;
    this.dispatchEvent(new CustomEvent('selectedMonthChange'));
  }

  loadFromLocalStorage() {
    const state = {
      ...DEFAULT_STATE,
      ...(JSON.parse(localStorage.getItem(APP_STATE_STORAGE_KEY)) ?? '{}'),
    };
    console.log('Loading state from local storage');
    this.transactions = state.transactions;
    this.budget = state.budget;
    this.settings = state.settings;
    this.selectedMonth = null;
  }
  connectedCallback() {}
  constructor() {
    super();
    this.style.display = 'contents';
  }
}
export const registerAppContext = () =>
  customElements.define('x-app-context', AppContext);
