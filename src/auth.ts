import * as jose from 'jose';
import { Option, some, none, Result, ok, err } from "matchingmonads"

let sessionSecret: Option<jose.KeyLike> = none()

export function getSessionSecret(): Option<jose.KeyLike> {
    return sessionSecret
}

export function setSessionSecret(secret: Option<jose.KeyLike>) {
    sessionSecret = secret
}