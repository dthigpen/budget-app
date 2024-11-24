import { html } from '../html.js';

class Name extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html``;
  }
}

export const registerName = () => {
  customElements.define('x-name', Name);
};
