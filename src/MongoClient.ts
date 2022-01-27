import * as jose from "jose"
import { Db } from "./Db";
import { Optional, Some, None } from "optional-typescript"
import { match, select } from 'ts-pattern';

export class MongoClient {
    url: URL
    sessionSecret: Optional<jose.KeyLike>
    db: Optional<Db>
    constructor(urlString) {
        let url = new URL(urlString);
        url.username = url.password = ""
        this.url = url

        this.sessionSecret = None()
        this.db = None()
    }
    async connect(username, password) {

        let publicUrl = this.url
        publicUrl.pathname = "/public_key"

        const serverPublicKey = await fetch(publicUrl.toString(), { method: "GET" })
            .then(response => { return response.text() })
            .then(text => { return jose.importSPKI(decodeURIComponent(text), 'RSA-OAEP-256') })

        const { publicKey, privateKey } = await jose.generateKeyPair('RSA-OAEP-256')

        const jwt = await new jose.EncryptJWT({
            username: encodeURIComponent(username),
            password: encodeURIComponent(password),
            clientPublicKey: encodeURIComponent(await jose.exportSPKI(publicKey))
        })
            .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
            .setIssuedAt()
            .encrypt(serverPublicKey)

        let connectUrl = this.url
        connectUrl.pathname = "/connect"

        const secretToken = await fetch(connectUrl.toString(), {
            method: "POST",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: jwt
        }).then(response => { return response.text() })

        const { payload, protectedHeader } = await jose.jwtDecrypt(secretToken, privateKey)

        const { secret } = payload;

        this.sessionSecret = Some(await jose.importJWK(JSON.parse(decodeURIComponent(secret as string)), 'A256GCM') as jose.KeyLike)
    }
}