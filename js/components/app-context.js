import { generateReports } from '../budget-reporter.js';

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
    const overallReport = generateReports(this.#budget, this.#transactions);
    console.log({ overallReport });
    this.#reports = overallReport?.monthly.reduce((acc, cur) => {
      acc[cur.month] = cur;
      console.log({ cur });
      return acc;
    }, {});
    console.log({ trueReports: this.#reports });
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
  connectedCallback() {
    // TODO find better way to wait for other components to subscribe to app context for initial load
    setTimeout(() => {
      const state = {
        ...DEFAULT_STATE,
        ...(JSON.parse(localStorage.getItem(APP_STATE_STORAGE_KEY)) ?? '{}'),
      };
      console.log('Loading state from local storage');
      console.log(state);
      this.transactions = state.transactions;
      this.budget = state.budget;
      this.settings = state.settings;
      this.refreshReports();
      this.selectedMonth = null;
    }, 200);
  }
  constructor() {
    super();
    this.style.display = 'contents';
  }
}
export const registerAppContext = () =>
  customElements.define('x-app-context', AppContext);
