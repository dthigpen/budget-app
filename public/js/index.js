import { registerAppContext } from './components/app-context.js';
import { generateTestData } from './test-data.js';
import { MonthPicker, getCurrentYearMonth } from './mounts/month-picker.js';
import { MonthTotalsPanel } from './mounts/month-totals.js';
import { TransactionsPanel } from './mounts/month-transactions.js';
import { MonthCategoriesPanel } from './mounts/month-categories.js';
import { TransactionDialog } from './mounts/transaction-dialog.js';

// Generate test data and save to local storage
generateTestData();

const app = () => {
  console.log('Loading app');
  // register custom elements
  registerAppContext();
  // Setup mount function components
  MonthPicker(document.querySelector('.month-picker'));
  MonthTotalsPanel(document.querySelector('.overall-section-totals-list'));
  MonthCategoriesPanel(document.querySelector('.breakdown-sections-container'));
  TransactionsPanel(document.querySelector('.transactions-section'));
  TransactionDialog(document.querySelector('#transaction-modal'));
  // load data from storage and generate reports
  const appContext = document.querySelector('x-app-context');
  appContext.selectedMonth = getCurrentYearMonth();
  appContext.loadFromLocalStorage();
  appContext.refreshReports();
  console.log('App loaded');
};

document.addEventListener('DOMContentLoaded', app);