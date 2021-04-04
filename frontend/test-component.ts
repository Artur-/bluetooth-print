import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
} from "lit-element";
import { BluetoothPrinterAPI } from "./bluetooth-printer";

import EscPosEncoder from "esc-pos-encoder";

const encoder = new EscPosEncoder();
const printer = new BluetoothPrinterAPI();

@customElement("test-component")
export class TestComponent extends LitElement {
  @internalProperty()
  private connected: boolean = false;

  render() {
    return html`
      <button @click="${this.connect}">Connect</button>
      <button
        ?disabled=${!this.connected}
        @click="${() => this.print("hello")}"
      >
        Print
      </button>
    `;
  }
  async connect() {
    await printer.connect();
    this.connected = true;
  }

  print(msg: string) {
    if (!printer.isConnected()) {
      window.alert("Printer is not connected!");
      return;
    }

    // normal text: 32 characters per line
    // small text: 42 characters per line
    const command = encoder
      .text(msg)
      .newline()
      .text("8<------------------------------")
      .newline()
      .newline()
      .newline()
      .encode();
    printer.print(command);
  }
}
