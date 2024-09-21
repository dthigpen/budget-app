export function generateReports(budget, allTransactions) {
  // read budget from drive
  // read transactions
  // for each transaction
  //   assign to a category
  // treat remaining as uncategorized
  // generate report data
  //   category monthly averages
  //   uncategorized transactions without data field

  // handle actions
  const actions = budget.actions ?? [];
  const preCategorizationActions = actions.filter(
    (a) => a.type === 'split' || a.type === 'replace',
  );
  const postCategorizationActions = actions.filter((a) => a.type === 'hide');
  const unhandledActions = actions.filter(
    (a) =>
      !preCategorizationActions.includes(a) &&
      !postCategorizationActions.includes(a),
  );
  if (unhandledActions.length > 0) {
    unhandledActions.forEach((a) =>
      console.log(`Unknown action type for action: ${JSON.stringify(a)}`),
    );
    throw Error(`Invalid action: ${JSON.stringify(a)}`);
  }

  // handle pre categorization actions
  const removedTransactions = [];
  const addedTransactions = [];
  for (const action of preCategorizationActions) {
    const type = action.type;
    if (type === 'split' || type === 'replace') {
      const includes = action.includes ?? [];
      const excludes = action.excludes ?? [];
      const dummyCategory = { name: 'hidden', includes, excludes };
      const matchingTransactions = allTransactions.filter((t) =>
        transactionMatchesCategory(t, dummyCategory),
      );
      const replacements = action.into ?? [];
      if (replacements.length === 0) {
        console.log(
          `replace/split actions must have an "into" property with replacement transaction details`,
        );
        throw Error(`Invalid action: ${JSON.stringify(action)}`);
      }
      removedTransactions.push(...matchingTransactions);
      matchingTransactions.forEach((t) => {
        const replacementTransactions = [];

        const { data: dd, ...temp } = t;
        console.log(temp);
        const originalAmount = t.amount;
        const signMultiplier = t.amount >= 0 ? 1 : -1;
        const absOriginalAmount = Math.abs(originalAmount);
        for (const {
          amount: replacementAmount = null,
          ...otherReplacementDetails
        } of replacements) {
          const r = {
            ...JSON.parse(JSON.stringify(t)),
            ...JSON.parse(JSON.stringify(otherReplacementDetails)),
          };
          let newAmount = null;
          // TODO be more strict about format/validation
          // a number
          // a percentage string such as 10% 2.5% -40.99%
          // a string that can be a number
          if (typeof replacementAmount === 'number') {
            newAmount = Math.abs(replacementAmount) * signMultiplier;
          } else if (
            typeof replacementAmount === 'string' &&
            /^[\d\.\-]+$/.test(replacementAmount.replaceAll('%', ''))
          ) {
            newAmount =
              absOriginalAmount *
              Math.abs(Number(replacementAmount.replaceAll(/[^0-9\.]/, ''))) *
              signMultiplier;
          } else if (
            replacementAmount === '%' ||
            replacementAmount === '' ||
            replacementAmount === null
          ) {
            // wait till end to evenly distribute remaining
          } else {
            throw new Error(`Invalid action amount value: ${amount}`);
          }
          // if(newAmount !== null) {
          r.amount = newAmount;
          // }
          if (replacementAmount !== null && replacementAmount !== undefined) {
            r.note = `Generated: Split ${replacementAmount} of ${originalAmount}`;
          }
          replacementTransactions.push(r);
        }
        const replacementsWithoutAmounts = replacementTransactions.filter(
          (r) => r.amount === null || r.amount === undefined,
        );
        // assign leftover amount evenly
        if (replacementsWithoutAmounts.length > 0) {
          const absTotalSoFar = replacementTransactions
            .map((r) => r.amount ?? 0)
            .reduce((a, b) => a + b, 0);
          const remaining = absOriginalAmount - absTotalSoFar;
          const newAmount =
            (remaining / replacementsWithoutAmounts.length) * signMultiplier;
          replacementsWithoutAmounts.forEach((r) => {
            r.amount = newAmount;
            r.note = `Generated: Split remaining of ${originalAmount.toFixed(2)}`;
          });
        }
        // verify everything adds up
        const absFinalTotal = Math.abs(
          replacementTransactions
            .map((r) => r.amount ?? 0)
            .reduce((a, b) => a + b, 0),
        );
        if (Math.abs(absOriginalAmount - absFinalTotal) >= 0.01) {
          const r = { ...JSON.parse(JSON.stringify(t)) };
          r.amount =
            Math.abs(absOriginalAmount - absFinalTotal) * signMultiplier;
          r.note = `Generated: Split remaining of ${originalAmount.toFixed(2)}`;
          replacementTransactions.push(r);
          // const {data, ...withoutData} = t
          // console.log(`WARNING: split/replace action does not total up near original amount. Action: ${JSON.stringify(action)} Transaction: ${JSON.stringify(withoutData)}`)
          // throw Error(`Invalid action: ${JSON.stringify(action)}`)
        }
        replacementTransactions.forEach((r) => {
          if (r.note === undefined || r.note === null) r.note = `Generated`;
        });
        console.log(
          JSON.stringify(replacementTransactions.map(({ data, ...t }) => t)),
        );
        addedTransactions.push(...replacementTransactions);
      });
    }
  }

  const preprocessedTransactions = [
    ...allTransactions.filter((t) => !removedTransactions.includes(t)),
    ...addedTransactions,
  ];
  preprocessedTransactions.sort((t1, t2) => {
    return dateStringCompareTo(t1.date, t2.date);
  });

  // categorize transactions
  for (const transaction of preprocessedTransactions.filter(
    (t) => t.category === undefined || t.category === null,
  )) {
    let foundCategory = false;
    for (const category of budget.categories) {
      if (transactionMatchesCategory(transaction, category)) {
        foundCategory = true;
        transaction.category = category.name;
      }
    }
    if (!foundCategory) {
      transaction.category = 'uncategorized';
    }
  }

  // handle post categorization actions
  const hiddenTransactions = [];
  for (const action of postCategorizationActions) {
    const type = action.type;
    if (type === 'hide') {
      const categoriesToHide = action.categories ?? [];
      const includes = action.includes ?? [];
      const excludes = action.excludes ?? [];
      const dummyCategory = { name: 'hidden', includes, excludes };
      const matchingTransactions = [];
      matchingTransactions.push(
        ...preprocessedTransactions.filter((t) =>
          categoriesToHide.includes(t.category),
        ),
      );
      matchingTransactions.push(
        ...preprocessedTransactions.filter((t) =>
          transactionMatchesCategory(t, dummyCategory),
        ),
      );
      hiddenTransactions.push(...matchingTransactions);
    }
  }

  const transactionsAfterPostActions = [
    ...preprocessedTransactions.filter((t) => !hiddenTransactions.includes(t)),
  ];

  // generate report
  const report = {
    monthly: [
      // {
      //   month: '2024-04',
      //   categories: []
      // }
    ],
  };
  // calculate total stats
  const monthGroups = groupBy(transactionsAfterPostActions, ({ date }) =>
    date.slice(0, 7),
  );
  const monthGroupEntries = Object.entries(monthGroups);
  monthGroupEntries.sort((b1, b2) => {
    return dateStringCompareTo(b1[0], b2[0]);
  });
  for (const [yearMonth, monthTransactions] of monthGroupEntries) {
    const monthReport = {
      lastUpdated: new Date().toISOString(),
      month: yearMonth,
      summary: {},
      transactions: {},
    };
    report.monthly.push(monthReport);
    monthTransactions.forEach((t) => delete t['data']);
    const categoryGroups = groupBy(
      monthTransactions,
      ({ category }) => category,
    );
    for (const [categoryName, categoryTranactions] of Object.entries(
      categoryGroups,
    )) {
      let categoryTotal = categoryTranactions
        .map((t) => t.amount)
        .reduce((a, b) => a + b, 0);
      //categoryTotal = FLIP_SIGNS ? categoryTotal * -1 : categoryTotal
      const categoryType =
        categoryName === 'uncategorized'
          ? 'uncategorized'
          : (budget.categories.find((c) => c.name === categoryName)?.type ??
            'expense');
      if (!(categoryType in monthReport.summary)) {
        monthReport.summary[categoryType] = { categories: {} };
      }
      monthReport.summary[categoryType].categories[categoryName] = Number(
        categoryTotal.toFixed(2),
      );
      if (!(categoryType in monthReport.transactions)) {
        monthReport.transactions[categoryType] = {};
      }
      // TODO add count of hidden transactions
      monthReport.transactions[categoryType][categoryName] =
        categoryTranactions.map(({ category = null, ...t }) => t);
    }

    for (const catTypeSummary of Object.values(monthReport.summary)) {
      const catTypeTotal = Object.values(catTypeSummary.categories).reduce(
        (a, b) => a + b,
        0,
      );
      catTypeSummary.total = Number(catTypeTotal.toFixed(2));
    }
    // postActionTransactions.forEach(t => {
    //   if(t.category) {
    //     delete t['category']
    //   }
    // })
    // console.log(JSON.stringify(report))

    // const monthReportFile = getOrCreateFile(budgetFolder, `${yearMonth}-report.json`)
    // monthReportFile.setContent(JSON.stringify(monthReport, null, 2))
  }
  return report;
  // aggregated report
  // const existingFile = getOrCreateFile(budgetFolder, 'report.json')
  // existingFile.setContent(JSON.stringify(report, null, 2))
}

function transactionMatchesCategory(transaction, category) {
  let isMatch = false;
  // if it has includes and one of them matches with all their key/values
  if (category.includes) {
    for (const include of category.includes) {
      let isIncludeMatch = true;
      for (const [columnName, columnPattern] of Object.entries(include)) {
        const columnRegex = new RegExp(columnPattern, 'i');
        const colStr = '' + (transaction?.[columnName] ?? '');
        if (!colStr.match(columnRegex)) {
          isIncludeMatch = false;
          break;
        }
      }
      if (isIncludeMatch) {
        isMatch = true;
        break;
      }
    }
  }
  // filter out excludes
  if (isMatch && category.excludes) {
    for (const exclude of category.excludes) {
      for (const [columnName, columnPattern] of Object.entries(exclude)) {
        const columnRegex = new RegExp(columnPattern);
        const colStr = '' + (transaction?.[columnName] ?? '');
        if (colStr.match(columnRegex)) {
          isMatch = false;
          break;
        }
      }
      if (!isMatch) {
        break;
      }
    }
  }
  return isMatch;
}

function dateStringCompareTo(s1, s2) {
  if (s1 < s2) {
    return -1;
  } else if (s1 > s2) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 *
 * @param list An array of type V.
 * @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
 *                  K is generally intended to be a property key of V.
 *
 * @returns Map of the array grouped by the grouping function.
 */
//export function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
//    const map = new Map<K, Array<V>>();
function groupBy(list, keyGetter) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return Object.fromEntries(map);
}
