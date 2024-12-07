import { registerAppContext } from './components/app-context.js';
import { registerRouteComponent } from './components/route.js';
import { registerNav } from './components/nav.js';
import { registerSettings } from './components/settings.js';
import {
  registerMonthPicker,
  getCurrentYearMonth,
} from './components/month-picker.js';
import { registerCategories } from './components/categories.js';
import { registerTotalsList } from './components/totals-list.js';
import { registerTransactions } from './components/transactions.js';
import { registerTransactionDialog } from './components/transaction-dialog.js';
import { registerBudgetEditor } from './components/budget-editor.js';

// Generate test data and save to local storage
//generateTestData();

const app = () => {
  console.log('Loading app');
  // register custom elements
  registerAppContext();
  registerNav();
  registerSettings();
  registerRouteComponent();
  registerMonthPicker();
  registerCategories();
  registerTotalsList();
  registerTransactions();
  registerTransactionDialog();
  registerBudgetEditor();
  // load data from storage and generate reports
  const appContext = document.querySelector('x-app-context');
  appContext.loadFromLocalStorage();
  appContext.selectedMonth = getCurrentYearMonth();

  console.log('App loaded');
};

document.addEventListener('DOMContentLoaded', app);
