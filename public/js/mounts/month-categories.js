import {
  calculateCategoryAmounts,
  categorizeTransactions,
} from '../budget-reporter.js';
import { CategoryType, GoalFilters } from '../types.js';
import { createCompareTo, groupBy } from '../util.js';
import { html } from '../html.js';

function initCategoriesChart(chartEl) {
  const data = [
    { year: 2010, count: 10 },
    { year: 2011, count: 20 },
    { year: 2012, count: 15 },
    { year: 2013, count: 25 },
    { year: 2014, count: 22 },
    { year: 2015, count: 30 },
    { year: 2016, count: 28 },
  ];
  return new Chart(chartEl, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => d.year),
      datasets: [
        {
          label: 'Total',
          data: data.map((row) => row.count),
        },
      ],
    },
  });
}
function updateCategoriesChart(chart, data) {
  chart.data.labels = data.map((d) => d.name);
  chart.data.datasets = [
    {
      label: 'Actual',
      data: data.map((d) => d.actual),
    },
  ];
  chart.update();
}
export function MonthCategoriesPanel(el) {
  const appContext = el.closest('x-app-context');
  const categoryFiltersContainer = el.querySelector(
    '.categories-section .filters',
  );
  const categoryTypeSelect = categoryFiltersContainer.querySelector(
    'select[name="category-type-select"]',
  );
  const goalFilterSelect = categoryFiltersContainer.querySelector(
    'select[name="goal-filter-select"]',
  );
  const categoriesChart = initCategoriesChart(
    document.getElementById('categories-chart'),
  );
  function updateTopCategories() {
    // TODO remove add filter buttons if apply to current categories
    // e.g. only add overbudget filter if there are overbudget categories

    const topCategoriesList = el.querySelector(
      '.categories-section .top-categories-list',
    );
    // category type is income or expense
    const selectedCategoryType = categoryTypeSelect.value;
    const selectedGoalFilter = goalFilterSelect.value;
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

    updateCategoriesChart(categoriesChart, categoryAmounts);

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
    const onTrackOption = goalFilterSelect.querySelector(
      'option[value="ontrack"]',
    );
    const overbudgetOption = goalFilterSelect.querySelector(
      'option[value="overbudget"]',
    );
    const allOption = goalFilterSelect.querySelector('option[value="all"]');

    function disableElement(el, disable = true) {
      if (disable) {
        el.setAttribute('disable', 'true');
      } else {
        el.removeAttribute('disable');
      }
    }
    overbudgetOption.textContent = `(${overbudgetCount}) Overbudget`;
    disableElement(overbudgetOption, overbudgetCount === 0);

    onTrackOption.textContent = `(${onTrackCount}) On Track`;
    disableElement(onTrackOption, onTrackCount === 0);

    allOption.textContent = `(${allCount}) All`;
    disableElement(allOption, allCount === 0);
  }

  appContext.addEventListener('transactionsChange', updateTopCategories);
  appContext.addEventListener('budgetChange', updateTopCategories);
  appContext.addEventListener('selectedMonthChange', updateTopCategories);

  // setup event listeners for each btn
  goalFilterSelect.addEventListener('change', () => {
    updateTopCategories();
  });

  categoryTypeSelect.addEventListener('change', () => {
    updateTopCategories();
  });
}

function CategoriesChartPanel(panelEl) {
  function updateChart() {
    const categorizedTransactions = categorizeTransactions(
      appContext.budget?.categories ?? [],
      appContext.periodTransactions,
    );
  }
  appContext.addEventListener('transactionsChange', updateChart);
  appContext.addEventListener('budgetChange', updateChart);
  appContext.addEventListener('selectedMonthChange', updateChart);
}