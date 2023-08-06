import { Injectable } from '@angular/core';
import * as fcl from "@onflow/fcl";

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  connected: boolean | undefined;
  wallet: string | undefined;
  account: string | undefined;

  constructor() {
    this.checkConnection()
  }

  async connect(){
    if (window.fuel) {
      try {
        await window.fuel.connect();
        const [account] = await window.fuel.accounts();
        this.account = account;
        this.wallet = account;
        this.connected = true;
        console.log(`Connected ${this.connected}, Account ${this.account}`)
      } catch(err) {
        console.log("error connecting: ", err);
      }
     }
     else {
      alert("Fuel Wallet is not installed, please download and install here: https://wallet.fuel.network/docs/install/")
    }
  }

  async disconnect(){
    // fcl.unauthenticate();
    // this.connected = false;
    // this.wallet = "";
  }

  async checkConnection() {
    if (window.fuel) {
      const isConnected = await window.fuel.isConnected();
      if (isConnected) {
        const [account] = await window.fuel.accounts();
        this.account = account;
        this.connected = true;
        this.wallet = account;
      }
    }
  }

}
