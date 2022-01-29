import * as jose from "jose"
import { Db } from "./Db";
import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';

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

        const jwt = await new jose.EncryptJWT({
            url: encodeURIComponent(this.url.toString()),
            clientPublicKey: encodeURIComponent(await jose.exportSPKI(publicKey))
        })
            .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
            .setIssuedAt()
            .encrypt(serverPublicKey)

        let connectUrl = new URL(this.url)
        connectUrl.pathname = "/connect"

        const secretToken = await fetch(connectUrl.toString(), {
            method: "POST",
            credentials: "include",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: jwt
        }).then(response => { return response.text() })

        const { payload, protectedHeader } = await jose.jwtDecrypt(secretToken, privateKey)

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

                const jwt = await new jose.EncryptJWT({
                    authorized: true
                })
                    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                    .setIssuedAt()
                    .encrypt(x.value)

                let closeUrl = new URL(this.url)
                closeUrl.pathname = "/close"

                const successToken = await fetch(closeUrl.toString(), {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: jwt
                }).then(response => { return response.text() })

                const { payload, protectedHeader } = await jose.jwtDecrypt(successToken, x.value)

                const { result } = payload;

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => { sessionSecret = none(); console.log(x.value); return none() })
                    .with({ tag: "err" }, x => { console.log(x.value); return none() })
                    .exhaustive()
            })
            .exhaustive()
    }
}