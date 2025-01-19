import { html } from '../html.js';
import { checkValidity } from '../util.js';

class AssignCategoryDialog extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <dialog id="assign-category-dialog">
        <article>
          <header>
            <button
              id="assign-category-dialog-close-btn"
              aria-label="Close"
              rel="prev"
              data-target="assign-category-dialog"
              onclick="toggleModal(event)"
            ></button>
            <h3 class="title">Assign Category</h3>
          </header>
          <div class="form-container">
            <form>
              <fieldset>
                <div class="form-row">
                  <label>
                    Category
                    <select
                      name="category-name"
                      aria-label="Select your a category"
                      required
                    >
                      <option selected disabled value="">
                        Select a category
                      </option>
                      <option>Category 1</option>
                      <option>Category 2</option>
                      <option>Category 3</option>
                    </select>
                  </label>
                  <!--<button>New</button> -->
                </div>
                <div class="content">
                  <label>Includes</label>
                  <div class="includes-list">
                    <div class="form-row">
                      <input
                        type="checkbox"
                        name="include-description"
                        checked
                      />
                      <div role="group" class="category-edit">
                        <input
                          name="description-label"
                          value="Description"
                          disabled
                        />
                        <input name="description-text" value="Costco Gas" />
                      </div>
                    </div>
                    <div class="form-row">
                      <input type="checkbox" name="include-date" checked />
                      <div role="group" class="category-edit">
                        <input name="date-label" value="Date" disabled />
                        <input name="date-text" value="2024-12-13" />
                      </div>
                    </div>
                    <div class="form-row">
                      <input type="checkbox" name="include-amount" />
                      <div role="group" class="category-edit">
                        <input name="amount-label" value="Amount" disabled />
                        <input name="amount-text" value="254.35" />
                      </div>
                    </div>
                    <div class="form-row">
                      <input type="checkbox" name="include-account" />
                      <div role="group" class="category-edit">
                        <input name="account-label" value="Account" disabled />
                        <input name="account-text" value="Some Credit Card" />
                      </div>
                    </div>
                  </div>
                  <label>Excludes</label>
                  <div class="excludes-list">
                    <div class="form-row">
                      <input type="checkbox" name="exclude-description" />
                      <div role="group" class="category-edit">
                        <input
                          name="description-label"
                          value="Description"
                          disabled
                        />
                        <input name="description-text" value="Costco Gas" />
                      </div>
                    </div>
                    <div class="form-row">
                      <input type="checkbox" name="exclude-date" />
                      <div role="group" class="category-edit">
                        <input name="date-label" value="Date" disabled />
                        <input name="date-text" value="2024-12-13" />
                      </div>
                    </div>
                    <div class="form-row">
                      <input type="checkbox" name="exclude-amount" />
                      <div role="group" class="category-edit">
                        <input name="amount-label" value="Amount" disabled />
                        <input name="amount-text" value="254.35" />
                      </div>
                    </div>
                    <div class="form-row">
                      <input type="checkbox" name="exclude-account" />
                      <div role="group" class="category-edit">
                        <input name="account-label" value="Account" disabled />
                        <input name="account-text" value="Some Credit Card" />
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
          <footer>
            <button
              id="assign-category-dialog-cancel-btn"
              role="button"
              class="secondary"
              data-target="assign-category-dialog"
            >
              Cancel
            </button>
            <button class="-gone" id="assign-category-dialog-delete-btn">
              Delete
            </button>

            <button
              id="assign-category-dialog-save-btn"
              autofocus
              data-target="assign-category-dialog"
            >
              Save
            </button>
          </footer>
        </article>
      </dialog>
    `;
    const appContext = this.closest('x-app-context');
    const dialog = this.querySelector('dialog');
    // setup initial listeners: validation, buttons
    const cancelEl = document.getElementById(
      'assign-category-dialog-cancel-btn',
    );
    const deleteEl = document.getElementById(
      'assign-category-dialog-delete-btn',
    );
    const saveEl = document.getElementById('assign-category-dialog-save-btn');
    const categorySelect = this.querySelector('[name="category-name"]');
    const checkboxes = [];
    // const fieldsMap = {include: {}, exclude: {}};
    const fields = [];
    ['include', 'exclude'].forEach((fieldType) => {
      ['description', 'date', 'amount', 'account'].forEach((fieldName) => {
        const elements = {
          type: fieldType,
          name: fieldName,
          checkbox: this.querySelector(`[name="${fieldType}-${fieldName}"]`),
          label: this.querySelector(`[name="${fieldName}-label"]`),
          text: this.querySelector(`[name="${fieldName}-text"]`),
        };
        fields.push(elements);
        console.log(
          `${fieldType}-${fieldName}`,
          elements.checkbox.value,
          elements.label.value,
          elements.text.value,
        );
      });
    });

    categorySelect.addEventListener('input', () => {
      checkValidity(categorySelect);
    });
    cancelEl.addEventListener('click', () => {
      console.debug('Cancel clicked!');
      appContext.closeAssignCategoryDialog();
    });
    appContext.addEventListener('closeAssignCategoryDialog', () => {
      dialog.removeAttribute('open');
    });
    saveEl.addEventListener('click', () => {
      console.debug('Save clicked!');
      if (checkValidity(categorySelect)) {
        // const existingCategory = (appContext.budget?.categories ?? [])

        appContext.closeAssignCategoryDialog();
      }
    });

    appContext.addEventListener('openAssignCategoryDialog', () => {
      dialog.setAttribute('open', 'true');
      const data = appContext.assignCategoryDialogData;
      // TODO TODO TODO fix pressing asign category button refreshes page
      if (!data) {
        // empty
      } else {
        // TODO populate with data values
      }
    });
  }
}

export const registerAsignCategoryDialog = () => {
  customElements.define('x-assign-category-dialog', AssignCategoryDialog);
};
