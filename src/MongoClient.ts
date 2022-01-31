import * as jose from "jose"
import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';

import { Db, DbOptions } from "./Db";
import { fetchPostEncrypted } from "./fetch";
import { setSessionSecret, getSessionSecret } from "./auth";

export class MongoClient {
    url: URL
    constructor(urlString) {
        this.url = urlString;
    }
    async connect(): Promise<MongoClient> {

        let publicUrl = new URL(this.url)
        publicUrl.pathname = "/public_key"

        const serverPublicKey = await fetch(publicUrl.toString(), { method: "GET", credentials: "include" })
            .then(response => { return response.text() })
            .then(text => { return jose.importSPKI(decodeURIComponent(text), 'RSA-OAEP-256') })

        const { publicKey, privateKey } = await jose.generateKeyPair('RSA-OAEP-256')

        let connectUrl = new URL(this.url)
        connectUrl.pathname = "/connect"

        const jwt = await new jose.EncryptJWT({
            url: encodeURIComponent(this.url.toString()),
            clientPublicKey: encodeURIComponent(await jose.exportSPKI(publicKey))
        })
            .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
            .setIssuedAt()
            .encrypt(serverPublicKey)

        const responseToken = await fetch(connectUrl.toString(), {
            method: "POST",
            credentials: "include",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: jwt
        }).then(response => { return response.text() })

        const { payload, protectedHeader } = await jose.jwtDecrypt(responseToken, privateKey)

        const { result } = payload;

        setSessionSecret(await match(result as Result<string, string>)
            .with({ tag: "ok" }, async (x) => some(await jose.importJWK(JSON.parse(decodeURIComponent(x.value as string)), 'A256GCM') as jose.KeyLike))
            .with({ tag: "err" }, async (x) => none<jose.KeyLike>())
            .exhaustive())

        return await match(result as Result<string, string>)
            .with({ tag: "ok" }, (x) => ok(this))
            .with({ tag: "err" }, (x) => err(x.value))
            .exhaustive()
            .toPromise()
    }

    async db(dbName: string, options?: DbOptions): Promise<Db> {

        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let dbUrl = new URL(this.url)
                dbUrl.pathname = "/db"

                const result = await fetchPostEncrypted(dbUrl.toString(), { dbName: dbName, dbOptions: options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(new Db(this.url + "/" + dbName)))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()

    }

    async close(): Promise<void> {

        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let closeUrl = new URL(this.url)
                closeUrl.pathname = "/close"

                const result = await fetchPostEncrypted(closeUrl.toString(), { authorized: true }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => { setSessionSecret(none()); return ok(undefined) })
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }
}