import * as jose from 'jose';
import { Option, some, none, Result, ok, err } from "matchingmonads"

export let sessionSecret: Option<jose.KeyLike> = none()