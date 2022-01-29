import * as jose from "jose"
import { Option, some, none, Result, ok, err } from "matchingmonads"

export async function fetchPostEncrypted(url: string, content: jose.JWTPayload, sessionSecret: jose.KeyLike): Promise<Result<unknown, string>> {
    const jwt = await new jose.EncryptJWT(content)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .encrypt(sessionSecret)

    const responseToken = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            'Content-Type': 'text/plain'
        },
        body: jwt
    }).then(response => { return response.text() })

    const { payload, protectedHeader } = await jose.jwtDecrypt(responseToken, sessionSecret)

    const { result } = payload;

    return result as Result<unknown, string>
}