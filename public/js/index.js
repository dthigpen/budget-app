import { registerAppContext } from './components/app-context.js';
import { generateMonthReports } from './budget-reporter.js';
import { generateTestData } from './test-data.js';
import { createCompareTo } from './util.js';

// Generate test data and save to local storage
generateTestData();

// Mount functions

function MonthSelectorBar(monthContainerEl) {
  const appContext = monthContainerEl.closest('x-app-context');
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  function updateMonthButtons() {
    let selected = null;
    // Remove old buttons
    monthContainerEl.querySelectorAll('button').forEach((btnEl) => {
      if (!btnEl.classList.contains('outline')) {
        selected = btnEl.getAttribute('data-value');
      }
      btnEl.remove();
    });
    if (!appContext.reports) {
      return;
    }

    function setupBtn(e, onClick) {
      e.addEventListener('click', () => {
        [...monthContainerEl.querySelectorAll('button')]
          .filter((b) => b !== e)
          .forEach((b) => b.classList.add('outline'));
        e.classList.remove('outline');
        if (onClick) {
          onClick(e);
        }
      });
    }
    // Setup Average btn
    const avgBtn = document.createElement('button');
    setupBtn(avgBtn, () => {
      appContext.selectedMonth = null;
    });
    avgBtn.textContent = 'Average';
    if (selected) {
      avgBtn.classList.add('outline');
    }
    monthContainerEl.appendChild(avgBtn);
    // Setup month buttons
    const sortedReports = Object.values(appContext.reports.monthly).sort(
      createCompareTo((r) => r.month, true),
    );
    for (const report of sortedReports) {
      const btn = document.createElement('button');
      const [yr, mo] = report.month.split('-');
      btn.textContent = `${yr} ${monthNames[mo - 1]}`;
      btn.setAttribute('data-value', report.month);
      if (selected !== report.month) {
        btn.classList.add('outline');
      }
      setupBtn(btn, () => {
        appContext.selectedMonth = report.month;
      });
      monthContainerEl.appendChild(btn);
    }
  }
  appContext.addEventListener('reportsChange', updateMonthButtons);
}
function TransactionsPanel(tableEl) {
  const appContext = tableEl.closest('x-app-context');

  function updateTable() {
    const isAvg =
      appContext.selectedMonth === undefined ||
      appContext.selectedMonth === null;

    const transactions =
      (isAvg
        ? appContext.reports.transactions
        : appContext.reports.monthly[appContext.selectedMonth].transactions
      )?.sort(createCompareTo((t) => t.date, true)) ?? [];

    console.log('Updating table');
    console.log({ transactions, isAvg });
    tableEl
      .querySelector('tbody')
      .querySelectorAll('tr')
      .forEach((rowEl) => {
        rowEl.parentNode.removeChild(rowEl);
      });

    for (const transaction of transactions) {
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
  appContext.addEventListener('reportsChange', updateTable);
  appContext.addEventListener('transactionsChange', updateTable);
  appContext.addEventListener('selectedMonthChange', updateTable);
}

function TransactionsUpload(el) {
  el.addEventListener('click', () => {
    document.getElementById('file-upload-input').click();
  });
}

function updateMonthTotalsPanel(
  totalsEl,
  reports,
  selectedMonth,
  currencySymbol,
) {
  const isAvg = selectedMonth === undefined || selectedMonth === null;
  const summary = isAvg
    ? reports.summary
    : reports.monthly[selectedMonth].summary;
  const totalOrAvgKey = isAvg ? 'average' : 'total';
  const incomeTotal = summary?.income?.[totalOrAvgKey] ?? 0.0;
  const expensesTotal = summary?.expense?.[totalOrAvgKey] ?? 0.0;
  const savingsTotal = incomeTotal - expensesTotal;
  const savingsPercent =
    incomeTotal > 0 ? Math.round((savingsTotal / incomeTotal) * 100) : 0;

  function formatMoney(num) {
    const sign = num < 0 ? '-' : '';
    return sign + currencySymbol + Math.abs(num).toFixed(2);
  }
  totalsEl.querySelector('[data-field="income"]').textContent =
    formatMoney(incomeTotal);
  totalsEl.querySelector('[data-field="expenses"]').textContent =
    formatMoney(expensesTotal);
  totalsEl.querySelector('[data-field="savings"]').textContent =
    `(${savingsPercent}%)  ` + formatMoney(savingsTotal);
}

function updateMonthCategoriesPanel(el, reports, budget, selectedMonth) {
  const parentEl = el.querySelector('.overall-section-categories-rows');
  parentEl.scrollTop = 0;
  const rowClass = 'overall-section-categories-row';
  parentEl.querySelectorAll(`.${rowClass}`).forEach((e) => e.remove());

  const isAvg = selectedMonth === undefined || selectedMonth === null;
  const summary = isAvg
    ? reports?.summary
    : reports?.monthly?.[selectedMonth]?.summary;
  const numMonths = Object.keys(reports?.monthly ?? {}).length;

  if (!summary) {
    return;
  }
  const categories = Object.values(summary)
    .map((x) => Object.entries(x.categories))
    .flat()
    .sort(createCompareTo((e) => e[1], true));

  for (let [name, total] of categories) {
    if (isAvg) {
      total = Number((total / numMonths).toFixed(2));
    }
    const row = document.createElement('div');
    row.classList.add(rowClass);
    const nameEl = document.createElement('div');
    // TODO convert to titlecase
    nameEl.textContent = name;
    row.appendChild(nameEl);
    const totalEl = document.createElement('div');
    totalEl.textContent = total;
    row.appendChild(totalEl);
    parentEl.appendChild(row);
  }
}
function MonthPanel(el) {
  const appContext = el.closest('x-app-context');

  function updateMonth() {
    const selectedMonth = appContext.selectedMonth;
    const isAvg = selectedMonth === undefined || selectedMonth === null;
    const reports = appContext.reports ?? {};
    const budget = appContext.budget;
    const currencySymbol = appContext.settings.currencySymbol;
    const transactions = isAvg
      ? reports.transactions
      : reports.monthly[selectedMonth].transactions;
    console.log({ reports });
    if (!budget || (budget?.categories ?? []).length === 0) {
      console.warn(
        'Unable to update panel, budget, transactions, reports are required.',
      );
      return;
    }
    updateMonthTotalsPanel(
      el.querySelector('.overall-section-totals'),
      reports,
      selectedMonth,
      currencySymbol,
    );
    updateMonthCategoriesPanel(
      el.querySelector('.overall-section-categories'),
      reports,
      budget,
      selectedMonth,
    );
  }

  appContext.addEventListener('transactionsChange', updateMonth);
  appContext.addEventListener('reportsChange', updateMonth);
  appContext.addEventListener('selectedMonthChange', updateMonth);
}

const app = () => {
  console.log('Loading app');
  registerAppContext();
  TransactionsUpload(document.getElementById('file-upload-btn'));
  MonthPanel(document.querySelector('.month-sections'));
  MonthSelectorBar(document.querySelector('.month-bar'));
  TransactionsPanel(document.querySelector('.transactions-section table'));

  // load data from storage and generate reports
  const appContext = document.querySelector('x-app-context');
  appContext.loadFromLocalStorage();
  appContext.refreshReports();
};

document.addEventListener('DOMContentLoaded', app);
