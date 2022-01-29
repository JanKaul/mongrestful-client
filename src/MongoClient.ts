import * as jose from "jose"
import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';

import { Db } from "./Db";
import { fetchPostEncrypted } from "./fetch";

export let sessionSecret: Option<jose.KeyLike> = none()

export class MongoClient {
    url: URL
    db: Option<Db>
    constructor(urlString) {
        this.url = urlString;
        this.db = none()
    }
    async connect() {

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

        sessionSecret = await match(result as Result<string, string>)
            .with({ tag: "ok" }, async (x) => some(await jose.importJWK(JSON.parse(decodeURIComponent(x.value as string)), 'A256GCM') as jose.KeyLike))
            .with({ tag: "err" }, async (x) => { console.log(x.value); return none<jose.KeyLike>() })
            .exhaustive()
    }

    async close() {

        await match(sessionSecret)
            .with({ tag: "none" }, async (_) => none())
            .with({ tag: "some" }, async (x) => {

                let closeUrl = new URL(this.url)
                closeUrl.pathname = "/close"

                const result = await fetchPostEncrypted(closeUrl.toString(), { authorized: true }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => { sessionSecret = none(); console.log(x.value); return none() })
                    .with({ tag: "err" }, x => { console.log(x.value); return none() })
                    .exhaustive()
            })
            .exhaustive()
    }
}