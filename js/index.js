import { registerAppContext } from './components/app-context.js';
import {
  generateMonthReports,
  generateReport,
  categorizeTransactions,
} from './budget-reporter.js';
import { generateTestData } from './test-data.js';
import { createCompareTo, groupBy, sum } from './util.js';
import { html } from './html.js';

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
    const transactions = appContext.transactions ?? [];
    const periodTransactions = isAvg
      ? transactions
      : transactions.filter((t) => t.date.startsWith(appContext.selectedMonth));
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
  appContext.addEventListener('budgetChange', updateTable);
  appContext.addEventListener('transactionsChange', updateTable);
  appContext.addEventListener('selectedMonthChange', updateTable);
}

function TransactionsUpload(el) {
  el.addEventListener('click', () => {
    document.getElementById('file-upload-input').click();
  });
}

function MonthTotalsPanel(totalsEl) {
  const appContext = totalsEl.closest('x-app-context');
  function updateTotals() {
    if ((appContext.budget?.categories ?? []).length === 0) {
      // TODO display message when no categories
      return;
    }
    const totalsListEl = totalsEl.querySelector('.overall-section-totals-list');
    const categorizedTransactions = categorizeTransactions(
      appContext.budget?.categories ?? [],
      appContext.periodTransactions,
    );
    const categoryAmounts = calculateCategoryAmounts(categorizedTransactions);
    const categoryTypeTotals = Object.entries(categoryAmounts)
      .map(([categoryName, categoryAmount]) => {
        let categoryType = null;
        if (categoryName === 'uncategorized') {
          categoryType = 'uncategorized';
        } else {
          const budgetCategories = appContext.budget?.categories ?? [];
          const category = budgetCategories.find(
            (c) => c.name === categoryName,
          );
          if (!category) {
            console.warn(`Unrecognized transaction category: ${categoryName}`);
          } else {
            categoryType = category.type ?? 'expense';
          }
        }
        return [categoryType, categoryAmount];
      })
      .filter((e) => e[0] !== null) // filter out unknown categories
      .reduce((acc, cur) => {
        const [categoryType, categoryAmount] = cur;
        if (!(categoryType in acc)) {
          acc[categoryType] = 0.0;
        }
        acc[categoryType] += categoryAmount;
        return acc;
      }, {});
    console.log({ categoryTypeTotals });
    const numMonths = Object.values(
      groupBy(categorizedTransactions, (t) => t.date.slice(0, 7)),
    ).length;
    // change amounts from totals to monthly avg
    Object.keys(categoryTypeTotals).forEach((c) => {
      categoryTypeTotals[c] = categoryTypeTotals[c] / numMonths;
    });
    const currencySymbol = appContext.settings.currencySymbol;
    const uncategorizedTotal = categoryTypeTotals.uncategorized ?? 0.0;
    const incomeTotal = categoryTypeTotals.income ?? 0.0;
    const expenseTotal = categoryTypeTotals.expense ?? 0.0;
    const savingsTotal = incomeTotal - expenseTotal;
    const savingsPercent =
      incomeTotal > 0 ? Math.round((savingsTotal / incomeTotal) * 100) : 0;
    function formatMoney(num) {
      const sign = num < 0 ? '-' : '';
      return sign + currencySymbol + Math.abs(num).toFixed(2);
    }

    totalsListEl.innerHTML = html`
      <div>
        <div>Income</div>
        <div>${formatMoney(incomeTotal)}</div>
      </div>
      <div>
        <div>Expenses</div>
        <div>${formatMoney(expenseTotal)}</div>
      </div>
      <div>
        <div>Savings</div>
        <div>(${savingsPercent}%) ${formatMoney(savingsTotal)}</div>
      </div>
      <div>
        <div>Uncategorized</div>
        <div>${formatMoney(incomeTotal)}</div>
      </div>
    `;
  }
  appContext.addEventListener('transactionsChange', updateTotals);
  appContext.addEventListener('budgetChange', updateTotals);
  appContext.addEventListener('selectedMonthChange', updateTotals);
  /*
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
	    */
}

function calculateCategoryAmounts(categorizedTransactions, monthAvg = false) {
  const transactionsByCategory = groupBy(
    categorizedTransactions,
    (t) => t.category,
  );
  const categoryAmounts = Object.fromEntries(
    Object.entries(transactionsByCategory).map(([c, ts]) => [
      c,
      sum(...ts.map((t) => t.amount)),
    ]),
  );

  if (monthAvg) {
    // create avg report
    const numMonths = Object.values(
      groupBy(categorizedTransactions, (t) => t.date.slice(0, 7)),
    ).length;
    // change amounts from totals to monthly avg
    Object.keys(categoryAmounts).forEach((c) => {
      categoryAmounts[c] = categoryAmounts[c] / numMonths;
    });
  }
  // convert to 2 decimals
  Object.keys(categoryAmounts).forEach((c) => {
    categoryAmounts[c] = Number(categoryAmounts[c].toFixed(2));
  });
  return categoryAmounts;
}

function MonthCategoriesPanel(el) {
  const appContext = el.closest('x-app-context');

  function updateTopCategories() {
    const topCategoriesList = el.querySelector('.top-categories-list');
    topCategoriesList.scrollTop = 0;
    const rowClass = 'top-categories-item';
    topCategoriesList
      .querySelectorAll(`.${rowClass}`)
      .forEach((e) => e.remove());
    const isAvg = !appContext.selectedMonth;
    if (
      appContext.periodTransactions.length === 0 ||
      appContext.budget?.categories === undefined ||
      appContext.budget?.categories === null
    ) {
      // TODO show message when no transactions
      return;
    }
    const categorizedTransactions = categorizeTransactions(
      appContext.budget?.categories ?? [],
      appContext.periodTransactions,
    );
    const categoryAmounts = calculateCategoryAmounts(
      categorizedTransactions,
      true,
    );

    console.log({ categoryAmounts });

    let itemsHtml = '';
    Object.entries(categoryAmounts).forEach(
      ([categoryName, categoryAmount]) => {
        const category =
          appContext.budget?.categories?.find((c) => c.name === categoryName) ??
          {};
        const goal = category.goal;
        const hasGoal = goal !== undefined && goal !== null;
        const amounts = hasGoal
          ? html`
              <div>
                <span class="spent">${categoryAmount}</span>
                <span class="divider"> / </span>
                <span class="goal">${category.goal}</span>
              </div>
            `
          : html`
              <div>
                <span class="spent">${categoryAmount}</span>
              </div>
            `;
        let progStatus = '';
        if (hasGoal) {
          if (categoryAmount > goal) {
            progStatus = 'over';
          } else if (categoryAmount <= 0.5 * goal) {
            progStatus = 'low';
          }
        }
        itemsHtml += html`
          <div class="top-categories-item">
            <div class="spread">
              <div class="category">${categoryName}</div>
              ${amounts}
            </div>
            <progress
              class="${progStatus}"
              value="${Math.round(categoryAmount)}"
              max="${Math.round(hasGoal ? category.goal : categoryAmount)}"
            />
          </div>
        `;
      },
    );
    topCategoriesList.innerHTML = itemsHtml;
  }
  /*
  const categoryTotals = Object.values(summary)
    .map((x) => Object.entries(x.categories))
    .flat()
    .sort(createCompareTo((e) => e[1], true));

  let childrenHtml = '';
  for (let [name, total] of categoryTotals) {
    if (isAvg) {
      total = Number((total / numMonths).toFixed(2));
    }
    const hasGoal = false;
    const amounts = hasGoal
      ? html`
          <div>
            <span class="spent">${total}</span>
            <span class="divider"> / </span>
            <span class="goal">${total}</span>
          </div>
        `
      : html`
          <div>
            <span class="spent">${total}</span>
          </div>
        `;
    let progStatus = '';
    if (hasGoal) {
      if (total > goal) {
        progStatus = 'over';
      } else if (total <= 0.25 * goal) {
        progStatus = 'low';
      }
    }

    const row = html`
      <div class="top-categories-item">
        <div class="spread">
          <div class="category">${name}</div>
          ${amounts}
        </div>
        <progress
          class="${progStatus}"
          value="${Math.round(total)}"
          max="${Math.round(total)}"
        />
      </div>
    `;
    childrenHtml += row;
  }
  parentEl.innerHTML = childrenHtml;
  */
  appContext.addEventListener('transactionsChange', updateTopCategories);
  appContext.addEventListener('budgetChange', updateTopCategories);
  appContext.addEventListener('selectedMonthChange', updateTopCategories);
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
    // updateMonthTotalsPanel(
    //   el.querySelector('.overall-section-totals'),
    //   reports,
    //   selectedMonth,
    //   currencySymbol,
    // );
    // updateMonthCategoriesPanel(
    //   el.querySelector('.top-categories'),
    //   reports,
    //   budget,
    //   selectedMonth,
    // );
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
  MonthCategoriesPanel(document.querySelector('.top-categories'));
  MonthTotalsPanel(document.querySelector('.overall-section-totals'));
  // load data from storage and generate reports
  const appContext = document.querySelector('x-app-context');
  appContext.loadFromLocalStorage();
  appContext.refreshReports();
};

document.addEventListener('DOMContentLoaded', app);
