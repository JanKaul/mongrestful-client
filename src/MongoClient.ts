import * as jose from "jose"
import { Db } from "./Db";

export class MongoClient {
    url: URL
    db: Db
    serverPublicKey: jose.KeyLike
    constructor(urlString) {
        this.url = new URL(urlString);
        let { username, password } = this.url;
        this.url.username = this.url.password = ""
    }
    async connect() {
        this.serverPublicKey = await fetch(this.url.toString(), { method: "GET" })
            .then(response => { return response.text() })
            .then(text => { return jose.importSPKI(text, 'ES256') })
    }
}