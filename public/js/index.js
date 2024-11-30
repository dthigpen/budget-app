import { registerAppContext } from './components/app-context.js';
import { registerRouteComponent } from './components/route.js';
import { registerNav } from './components/nav.js';
import {
  registerMonthPicker,
  getCurrentYearMonth,
} from './components/month-picker.js';
import { registerCategoriesList } from './components/categories-list.js';
import { registerCategories } from './components/categories.js';
import { registerTotalsList } from './components/totals-list.js';
import { registerTransactions } from './components/transactions.js';
import { registerTransactionDialog } from './components/transaction-dialog.js';
import { BudgetEditor } from './mounts/budget-editor.js';

// Generate test data and save to local storage
//generateTestData();

const app = () => {
  console.log('Loading app');
  // register custom elements
  registerRouteComponent();
  registerNav();
  registerMonthPicker();
  // registerCategoriesList();
  registerAppContext();
  registerCategories();
  registerTotalsList();
  registerTransactions();
  registerTransactionDialog();
  // Setup mount function components
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
