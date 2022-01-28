import * as jose from "jose"
import { Db } from "./Db";
import { Maybe, nothing, maybe, Either, left, right } from "tsmonads";
import { match, select } from 'ts-pattern';

export let sessionSecret: Maybe<jose.KeyLike> = nothing()

export class MongoClient {
    url: URL
    db: Maybe<Db>
    constructor(urlString) {
        this.url = urlString;
        this.db = nothing()
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

        const { secret } = payload;

        sessionSecret = maybe(await jose.importJWK(JSON.parse(decodeURIComponent(secret as string)), 'A256GCM') as jose.KeyLike)
    }

    async close() {

        await match(sessionSecret)
            .with({ hasValue: false }, async (_) => nothing())
            .with({ hasValue: true }, async (res) => {

                const jwt = await new jose.EncryptJWT({
                    authorized: true
                })
                    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                    .setIssuedAt()
                    .encrypt(res.unsafeLift())

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

                const { payload, protectedHeader } = await jose.jwtDecrypt(successToken, res.unsafeLift())

                const { success } = payload;

                if (success) { sessionSecret = nothing() }

                return nothing()
            })
            .exhaustive()
    }
}