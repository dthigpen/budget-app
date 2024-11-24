import { html } from '../html.js';
import {
  calculateCategoryAmounts,
  categorizeTransactions,
} from '../budget-reporter.js';
import { generateTransactions, generateBudget } from '../test-data.js';
import { CategoryType, GoalFilters } from '../types.js';
import { createCompareTo, groupBy } from '../util.js';

function initCategoriesChart(chartEl) {
  const data = [];
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
  console.log({ chartData: data });
  chart.data.labels = data.map((d) => d.name);
  chart.data.datasets = [
    {
      label: 'Actual',
      data: data.map((d) => d.actual),
    },
  ];
  chart.update();
}

class CategoriesList extends HTMLElement {
  #categoriesChart = null;
  connectedCallback() {
    this.innerHTML = html`
      <div class="top-categories-list">
        <div class="top-categories-item">
          <div class="spread">
            <div class="category">Rent</div>
            <div>
              <span class="spent">1267.95</span> /
              <span class="goal">1267.95</span>
            </div>
          </div>
          <progress class="over" value="1268" max="1268" />
        </div>
      </div>
    `;

    const appContext = this.closest('x-app-context');
    const categoriesChartEl = document.getElementById('categories-chart');
    const categoriesChartMsgEl = document.getElementById(
      'categories-chart-msg',
    );
    const categoriesChart = initCategoriesChart(categoriesChartEl);
    this.#categoriesChart = categoriesChart;
    appContext.addEventListener('transactionsChange', () => this.update());
    appContext.addEventListener('budgetChange', () => this.update());
    appContext.addEventListener('selectedMonthChange', () => this.update());
  }

  // constructor() {
  // 	this.#categoriesChart = null;
  // }
  static get observedAttributes() {
    return ['type', 'progress'];
  }

  attributeChangedCallback() {
    this.update();
  }
  update() {
    // TODO remove add filter buttons if apply to current categories
    // e.g. only add overbudget filter if there are overbudget categories
    const appContext = this.closest('x-app-context');
    const categoriesChartEl = document.getElementById('categories-chart');
    const categoriesChartMsgEl = document.getElementById(
      'categories-chart-msg',
    );
    // const categoriesChart = initCategoriesChart(categoriesChartEl);
    const topCategoriesList = this.querySelector('.top-categories-list');
    // category type is income or expense
    //const selectedCategoryType = categoryTypeSelect.value;
    //const selectedGoalFilter = goalFilterSelect.value;
    const selectedCategoryType = this.getAttribute('type') ?? 'expense';
    const selectedGoalFilter = this.getAttribute('progress') ?? 'all';
    topCategoriesList.scrollTop = 0;
    const rowClass = 'top-categories-item';
    topCategoriesList
      .querySelectorAll(`.${rowClass}`)
      .forEach((e) => e.remove());
    const isAvg = !appContext.selectedMonth;
    const categorizedTransactions = appContext.categorizePeriodTransactions();
    console.log({
      month: appContext.selectedMonth,
      ts: categorizedTransactions,
    });
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

    console.log({ period: appContext.periodTransactions });
    console.log({ categoryAmounts });
    categoriesChartEl.style.height = '300px';
    categoriesChartEl.style.width = '300px';
    categoriesChartMsgEl.style.display =
      (categoryAmounts?.length ?? 0 > 0) ? 'none' : 'block';
    categoriesChartEl.style.display =
      (categoryAmounts?.length ?? 0 > 0) ? 'block' : 'none';
    if (this.#categoriesChart) {
      updateCategoriesChart(this.#categoriesChart, categoryAmounts);
    }

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
    console.log({ groupedByFilterType });
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
        this.setAttribute('disable', 'true');
      } else {
        this.removeAttribute('disable');
      }
    }
    overbudgetOption.textContent = `(${overbudgetCount}) Overbudget`;
    disableElement(overbudgetOption, overbudgetCount === 0);

    onTrackOption.textContent = `(${onTrackCount}) On Track`;
    disableElement(onTrackOption, onTrackCount === 0);

    allOption.textContent = `(${allCount}) All`;
    disableElement(allOption, allCount === 0);
  }
}

export const registerCategoriesList = () => {
  customElements.define('x-categories-list', CategoriesList);
};
