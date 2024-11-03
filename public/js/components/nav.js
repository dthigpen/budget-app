import { html } from '../html.js';

class Nav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html`
      <nav>
        <ul>
          <label>
            <input name="demo-mode-switch" type="checkbox" role="switch" />
            Demo Mode
          </label>
        </ul>
        <ul>
          <strong>Budget App</strong>
        </ul>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#/budget">Budget Editor</a></li>
          <li><a href="#/settings">Settings</a></li>
        </ul>
      </nav>
    `;
  }
}

export const registerNav = () => {
  customElements.define('x-nav', Nav);
};
