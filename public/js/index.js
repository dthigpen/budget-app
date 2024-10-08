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

const CategoryType = {
  EXPENSE: 'expense',
  INCOME: 'income',
};

const GoalFilters = {
  ALL: 'all',
  OVERBUDGET: 'overbudget',
  ON_TRACK: 'ontrack',
};
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
    const transactions = appContext.transactions ?? [];
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
    const yearMonths = [...new Set(transactions.map((t) => t.date.slice(0, 7)))]
      .sort()
      .reverse();
    for (const yearMonth of yearMonths) {
      const btn = document.createElement('button');
      const [yr, mo] = yearMonth.split('-');
      btn.textContent = `${yr} ${monthNames[mo - 1]}`;
      btn.setAttribute('data-value', yearMonth);
      if (selected !== yearMonth) {
        btn.classList.add('outline');
      }
      setupBtn(btn, () => {
        appContext.selectedMonth = yearMonth;
      });
      monthContainerEl.appendChild(btn);
    }
  }
  appContext.addEventListener('transactionsChange', updateMonthButtons);
}

function MonthPicker(monthPickerEl) {
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
  const appContext = monthPickerEl.closest('x-app-context');
  const searchEl = monthPickerEl.querySelector('.search');
  const resultsEl = monthPickerEl.querySelector('.results');
  const summaryEl = monthPickerEl.querySelector('summary');

  function applySearchFilter() {
    monthPickerEl.querySelectorAll('button').forEach((btnEl) => {
      const searchString = searchEl.value.trim();
      if (
        searchString === '' ||
        btnEl.textContent.toLowerCase().includes(searchString)
      ) {
        btnEl.classList.remove('-gone');
      } else {
        btnEl.classList.add('-gone');
      }
    });
  }
  // monthPickerEl.querySelector('summary').textContent = 'Select a month';

  function getCurrentYearMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  function yearMonthToText(yearMonth) {
    const [yr, mo] = yearMonth.split('-');
    return `${yr} ${monthNames[Number(mo) - 1]}`;
  }
  const summaryTextNode = document.createTextNode(
    yearMonthToText(getCurrentYearMonth()),
  );
  summaryEl.innerHTML = '';
  summaryEl.appendChild(summaryTextNode);
  // On search input, filter results
  searchEl.addEventListener('keyup', applySearchFilter);

  function updateMonthButtons() {
    const curMonthYear = getCurrentYearMonth();
    // Remove old buttons
    monthPickerEl.querySelectorAll('button').forEach((btnEl) => {
      if (!btnEl.classList.contains('outline')) {
        selected = btnEl.getAttribute('data-value');
      }
      btnEl.remove();
    });

    function setupBtn(e, text, dataValue, onClick) {
      // unselected state will be only outline
      e.classList.add('outline');
      e.textContent = text;
      if (dataValue) {
        e.setAttribute('data-value', dataValue);
      }
      // create summary text from data value or text
      let summaryText = 'Select a Month';
      if (dataValue && dataValue !== 'average') {
        const [yr, mo] = dataValue.split('-');
        // e.g. 2024 September
        summaryText = `${yr} ${monthNames[Number(mo) - 1]}`;
      } else {
        summaryText = text;
      }
      e.addEventListener('click', () => {
        // update summary text
        monthPickerEl.querySelector('summary').textContent = summaryText;
        // update highlighted button
        [...monthPickerEl.querySelectorAll('button')]
          .filter((b) => b !== e)
          .forEach((b) => b.classList.add('outline'));
        e.classList.remove('outline');
        monthPickerEl.removeAttribute('open');
        // run onClick
        if (onClick) {
          onClick(e);
        }
      });
      return e;
    }
    const transactions = appContext.transactions ?? [];
    // Setup Average btn
    const avgBtn = document.createElement('button');
    setupBtn(avgBtn, 'Average', null, () => {
      appContext.selectedMonth = null;
    });
    resultsEl.appendChild(avgBtn);

    const curMonthBtn = document.createElement('button');
    setupBtn(curMonthBtn, 'Current Month', curMonthYear, () => {
      appContext.selectedMonth = curMonthYear;
    });
    resultsEl.appendChild(curMonthBtn);

    // Setup month buttons
    const yearMonths = [...new Set(transactions.map((t) => t.date.slice(0, 7)))]
      .sort()
      .reverse();
    for (const yearMonth of yearMonths) {
      if (yearMonth === curMonthYear) {
        continue;
      }
      const btn = document.createElement('button');
      setupBtn(btn, yearMonthToText(yearMonth), yearMonth, () => {
        appContext.selectedMonth = yearMonth;
      });
      resultsEl.appendChild(btn);
    }
    applySearchFilter();
  }

  appContext.addEventListener('transactionsChange', updateMonthButtons);
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

function isButtonSelected(btnEl) {
  return !btnEl.classList.contains('outline');
}

function selectButton(btnEl) {
  btnEl.classList.remove('outline');
  btnEl.classList.add('selected');
}

function unselectButton(btnEl) {
  btnEl.classList.add('outline');
  btnEl.classList.remove('selected');
}

function displayElement(el, display = true) {
  if (display) {
    el.classList.remove('-gone');
  } else {
    el.classList.add('-gone');
  }
}
function MonthCategoriesPanel(el) {
  const appContext = el.closest('x-app-context');
  const categoryFiltersContainer = el.querySelector(
    '.categories-section .filters',
  );
  // const incomeExpensesButtons = categoryFiltersContainer.querySelectorAll('.types button');
  const incomeFilterBtn = categoryFiltersContainer.querySelector(
    'button[data-value="income"]',
  );
  const expenseFilterBtn = categoryFiltersContainer.querySelector(
    'button[data-value="expense"]',
  );

  const categoryTypeFilterBtns = [incomeFilterBtn, expenseFilterBtn];

  const allFilterBtn = categoryFiltersContainer.querySelector(
    'button[data-value="all"]',
  );
  const overbudgetFilterBtn = categoryFiltersContainer.querySelector(
    'button[data-value="overbudget"]',
  );
  const onTrackFilterBtn = categoryFiltersContainer.querySelector(
    'button[data-value="ontrack"]',
  );
  const categoryGoalFilterBtns = [
    allFilterBtn,
    overbudgetFilterBtn,
    onTrackFilterBtn,
  ];

  function updateTopCategories() {
    // TODO remove add filter buttons if apply to current categories
    // e.g. only add overbudget filter if there are overbudget categories

    const topCategoriesList = el.querySelector(
      '.categories-section .top-categories-list',
    );
    // category type is income or expense
    const selectedCategoryType =
      categoryFiltersContainer
        .querySelector('.types button.selected')
        ?.getAttribute('data-value') ?? 'expense';

    const selectedGoalFilter =
      categoryGoalFilterBtns
        .find((b) => isButtonSelected(b))
        ?.getAttribute('data-value') ?? 'all';
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
    let itemsHtml = '';
    const categoryAmounts = Object.entries(
      calculateCategoryAmounts(
        categorizedTransactions,
        true, // TODO should this be hardcoded or not?
      ),
    )
      .map(([categoryName, categoryAmount]) => {
        let category = null;
        if (categoryName === 'uncategorized') {
          category = { name: 'uncategorized', goal: 0.0 };
        } else {
          category =
            appContext.budget?.categories?.find(
              (c) => c.name === categoryName,
            ) ?? null;
          if (category) {
            category = JSON.parse(JSON.stringify(category));
          } else {
            category = { name: 'Unknown' };
            console.error(
              `Category with name not found in budget file: ${categoryName}`,
            );
          }
        }
        category.actual = categoryAmount;
        return category;
      })
      // filter out null/Unknown
      // filter in categories with selected type (or no type meaning expense)
      .filter(
        (c) =>
          c !== null &&
          c.name !== 'Unknown' &&
          (c.type === selectedCategoryType ||
            (!c.type && selectedCategoryType === CategoryType.EXPENSE)),
      )
      .sort(
        createCompareTo((budgetCategory) => {
          // treat no goal as always being under the goal
          const goalAmount = budgetCategory.goal ?? Infinity;
          return budgetCategory.actual - goalAmount;
        }, true),
      );

    const groupedByFilterType = groupBy(categoryAmounts, (category) => {
      if (!isNaN(category.goal)) {
        // check if actual is within goal amount
        if (
          (!category.type || category.type === CategoryType.EXPENSE) &&
          category.actual > category.goal
        ) {
          return GoalFilters.OVERBUDGET;
        }
        // TODO add filter when adding income (underbudget) filter
      }
      return GoalFilters.ON_TRACK;
    });
    const overbudgetCount =
      groupedByFilterType?.[GoalFilters.OVERBUDGET]?.length ?? 0;
    const onTrackCount =
      groupedByFilterType?.[GoalFilters.ON_TRACK]?.length ?? 0;
    const allCount = categoryAmounts?.length ?? 0;
    const filteredCategoryAmounts =
      selectedGoalFilter === GoalFilters.ALL
        ? categoryAmounts
        : (groupedByFilterType?.[selectedGoalFilter] ?? []);
    filteredCategoryAmounts.forEach((category) => {
      const categoryAmount = category.actual;
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
        } else {
          if (categoryAmount <= 0.5 * goal) {
            progStatus = 'low';
          }
        }
      }
      itemsHtml += html`
        <div class="top-categories-item">
          <div class="spread">
            <div class="category">${category.name}</div>
            ${amounts}
          </div>
          <progress
            class="${progStatus}"
            value="${hasGoal ? Math.round(categoryAmount) : 0}"
            max="${Math.round(hasGoal ? category.goal : 100)}"
          />
        </div>
      `;
    });

    topCategoriesList.innerHTML = itemsHtml;

    overbudgetFilterBtn.textContent = `(${overbudgetCount}) Overbudget`;
    onTrackFilterBtn.textContent = `(${onTrackCount}) On Track`;
    allFilterBtn.textContent = `(${allCount}) All`;

    // hide overbudget category if type fitler is Income
    if (selectedCategoryType === CategoryType.EXPENSE) {
      displayElement(overbudgetFilterBtn, true);
    } else {
      displayElement(overbudgetFilterBtn, false);
    }
  }

  appContext.addEventListener('transactionsChange', updateTopCategories);
  appContext.addEventListener('budgetChange', updateTopCategories);
  appContext.addEventListener('selectedMonthChange', updateTopCategories);

  // setup event listeners for each btn
  categoryTypeFilterBtns.forEach((typeBtn) => {
    unselectButton(typeBtn);
    typeBtn.addEventListener('click', () => {
      categoryTypeFilterBtns.forEach((b) => unselectButton(b));
      selectButton(typeBtn);
      // reset goal filter to "All"
      categoryGoalFilterBtns.forEach((b) => unselectButton(b));
      selectButton(allFilterBtn);
      updateTopCategories();
    });
  });
  // select Expenses by default
  selectButton(expenseFilterBtn);

  categoryGoalFilterBtns.forEach((filterBtn) => {
    unselectButton(filterBtn);
    filterBtn.addEventListener('click', () => {
      categoryGoalFilterBtns.forEach((b) => unselectButton(b));
      selectButton(filterBtn);
      updateTopCategories();
    });
  });
  // select All by default
  selectButton(allFilterBtn);
}

const app = () => {
  console.log('Loading app');
  // register custom elements
  registerAppContext();
  // Setup mount function components
  MonthPicker(document.querySelector('.month-picker'));
  MonthTotalsPanel(document.querySelector('.totals-section'));
  MonthCategoriesPanel(document.querySelector('.breakdown-sections-container'));
  TransactionsPanel(document.querySelector('.transactions-section table'));
  TransactionsUpload(document.getElementById('file-upload-btn'));
  // load data from storage and generate reports
  const appContext = document.querySelector('x-app-context');
  appContext.loadFromLocalStorage();
  appContext.refreshReports();
};

document.addEventListener('DOMContentLoaded', app);
