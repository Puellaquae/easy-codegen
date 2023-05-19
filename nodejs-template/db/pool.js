import genericPool from "generic-pool"
import { DB } from "./db"
import { config } from "../config/config"

const factory = {
    create: function () {
        return new DB(config.dbPath)
    },
    /**
     * 
     * @param {DB} client 
     */
    destroy: function (client) {
        client.close()
    }
}

const opt = {
    max: 10,
    min: 2
};

const dbPool = genericPool.createPool(factory, opt);

export { dbPool }
