import vault from "node-vault";
import dotenv from "dotenv";

dotenv.config();

const client = vault({
    endpoint: process.env.VAULT_ADDR ?? "",
    token: process.env.VAULT_TOKEN ?? "",
});

// load token from vault server
export async function loadVaultSecrets() {

    // GET tokens for each API endpoint
    const frappe = await client.read("secret/frappe");
    const mapbox = await client.read("secret/mapbox");

    return {
        frappe: frappe.data,
        mapbox: mapbox.data,
    };
}

export default client;