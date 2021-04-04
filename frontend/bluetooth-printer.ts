export class BluetoothPrinterAPI {
  private characteristic?: BluetoothRemoteGATTCharacteristic = undefined;
  private queue: any[] = [];
  private working: boolean = false;

  async connect() {
    console.log("Requesting Bluetooth Device...");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
      });
      if (!device) {
        throw new Error("No device");
      }
      console.log("Connecting to GATT Server...");

      device.addEventListener(
        "gattserverdisconnected",
        this._disconnect.bind(this)
      );

      if (!device.gatt) {
        throw new Error("No device gatt");
      }

      const server = await device.gatt.connect();
      if (!server) {
        throw new Error("No server");
      }

      const service = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb"
      );
      if (!service) {
        throw new Error("No service");
      }
      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb"
      );
      this.characteristic = characteristic;
      console.log("Ready to print!");
    } catch (error) {
      throw new Error("Could not connect! " + error);
    }
  }

  print(command: Uint8Array) {
    const maxLength = 100;
    let chunks = Math.ceil(command.length / maxLength);

    if (chunks === 1) {
      this._queue(command);
    } else {
      for (let i = 0; i < chunks; i++) {
        let byteOffset = i * maxLength;
        let length = Math.min(command.length, byteOffset + maxLength);
        this._queue(command.slice(byteOffset, length));
      }
    }
  }

  private _queue(commnad: Uint8Array) {
    var that = this;

    const run = () => {
      if (!that.queue.length) {
        that.working = false;
        return;
      }

      that.working = true;
      if (!that.characteristic) {
        throw new Error("Unexpectedly lost connection to printer");
      }
      that.characteristic.writeValue(that.queue.shift()).then(() => run());
    };

    that.queue.push(commnad);

    if (!that.working) run();
  }

  isConnected() {
    return !!this.characteristic;
  }

  _disconnect() {
    console.log("Disconnected from GATT Server...");
    this.characteristic = undefined;
  }
}
