import { registerAppContext } from './components/app-context.js';
import { registerRouteComponent } from './components/route.js';
import { MonthPicker, getCurrentYearMonth } from './mounts/month-picker.js';
import { MonthTotalsPanel } from './mounts/month-totals.js';
import { TransactionsPanel } from './mounts/month-transactions.js';
import { MonthCategoriesPanel } from './mounts/month-categories.js';
import { TransactionDialog } from './mounts/transaction-dialog.js';
import { BudgetEditor } from './mounts/budget-editor.js';

// Generate test data and save to local storage
//generateTestData();

const app = () => {
  console.log('Loading app');
  // register custom elements
  registerRouteComponent();
  registerAppContext();
  // Setup mount function components
  MonthPicker(document.querySelector('.month-picker'));
  MonthTotalsPanel(document.querySelector('.overall-section-totals-list'));
  MonthCategoriesPanel(document.querySelector('.breakdown-sections-container'));
  TransactionsPanel(document.querySelector('.transactions-section'));
  TransactionDialog(document.querySelector('#transaction-modal'));
  // budget editor
  BudgetEditor(document.querySelector('.budget-editor-container'));
  // load data from storage and generate reports
  const appContext = document.querySelector('x-app-context');
  appContext.selectedMonth = getCurrentYearMonth();
  appContext.loadFromLocalStorage();
  appContext.refreshReports();

  const demoModeSwitch = document.querySelector(
    'nav [name="demo-mode-switch"]',
  );
  demoModeSwitch.checked = appContext.demoMode;
  demoModeSwitch.addEventListener('click', function () {
    const checked = this.checked;
    appContext.demoMode = checked;
  });

  console.log('App loaded');
};

document.addEventListener('DOMContentLoaded', app);
