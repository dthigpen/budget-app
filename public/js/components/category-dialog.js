import { html } from '../html.js';
import { checkValidity } from '../util.js';

class CategoryDialog extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <dialog id="category-dialog" open>
        <article>
          <header>
            <button
              id="category-dialog-close-btn"
              aria-label="Close"
              rel="prev"
              data-target="category-dialog"
              onclick="toggleModal(event)"
            ></button>
            <h3 class="title">New Category</h3>
          </header>
          <div class="form-container">
            <form>
                <label>
                  Name
                  <input
                    name="name"
                    placeholder="Name"
                    minlength="1"
                    required
                  />
                </label>
                	<fieldset>
                	<legend>Type</legend>
                <div class="form-row">
                	<input type="radio" id="income" name="category-type"/>
                	<label htmlFor="income">Income</label>
                	<input type="radio" id="expense" name="category-type" checked/>
                	<label htmlFor="expense">Expense</label>
                </div>
                </fieldset>
                <div class="form-row">
                  <label>
                    Goal
                    <p>(Under)</p>
                    <input
	                    type="number"
	                    name="goal"
	                    min="0.01"
	                    step="0.01"
	                    placeholder="0.0"
	                  />
                  </label>
                </div>
            </form>
          </div>
          <footer>
            <button
              id="category-dialog-cancel-btn"
              role="button"
              class="secondary"
              data-target="category-dialog"
            >
              Cancel
            </button>
            <button class="-gone" id="category-dialog-delete-btn">
              Delete
            </button>

            <button
              id="category-dialog-create-btn"
              autofocus
              data-target="category-dialog"
            >
              Create
            </button>
          </footer>
        </article>
      </dialog>
    `;
    return
    const appContext = this.closest('x-app-context');
    const dialog = this.querySelector('dialog');
    // setup initial listeners: validation, buttons
    const cancelEl = document.getElementById('category-dialog-cancel-btn');
    const deleteEl = document.getElementById('category-dialog-delete-btn');
    const createEl = document.getElementById('category-dialog-create-btn');
    const nameInput = this.querySelector('[name="name"]');
    const typeInput = this.querySelector('[name="type"]');
    const goalInut = this.querySelector('[name="goal"]');


    appContext.addEventListener('closeCategoryDialog', () => {
      dialog.removeAttribute('open');
    });
  }

  update() {}
}

export const registerCategoryDialog = () => {
  customElements.define('x-category-dialog', CategoryDialog);
};
