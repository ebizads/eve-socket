// import fetch from "node-fetch";
import { Config } from "../config.js";
import { clients } from "../server.js";

export async function updateFrappeLocation(
  driver_id: string,
  lat: number,
  lng: number
) {
  const payload = {
    data: {
      latitude: lat,
      longitude: lng,
    }
  };

  const response = await clients.frappe.put(`/Location/${driver_id}`,{
    ...payload
  });

  if (response.status != 200) {
    throw new Error(`Frappe update failed: ${response.statusText}`);
  }
  console.log(response.data.data)

  return await response.data;
}
