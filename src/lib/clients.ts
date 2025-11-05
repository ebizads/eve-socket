import axios from "axios";
import { Config } from "../config.js";

// CREATE CLIENT CONNECTION TO APIS
export function createClients() {
  return {
    frappe: axios.create({
      baseURL: `${Config.vault.frappe.baseURL ?? ""}/api/resource`,
      headers: {
        Authorization: Config.vault.frappe.token,
        "Content-Type": "application/json",
      },
    }),

    mapbox: axios.create({
      baseURL: Config.vault.mapbox.baseURL ?? "",
      params: {
        access_token: Config.vault.mapbox.token, // 🔥 Automatically appended
      },
    }),

    eveApiTest: axios.create({
      baseURL: "http://192.168.226.64"
      // params: {
      //   access_token: Config.vault.mapbox.token, // 🔥 Automatically appended
      // },
    }),
  }
};