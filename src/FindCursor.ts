import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';
import { getSessionSecret } from "./auth"
import { fetchPostEncrypted } from "./fetch";

export type CollectionOptions = unknown

type Filter = unknown
type FindOptions = unknown

export class FindCursor {
    collectionUrl: string
    filter: Filter
    options: FindOptions

    constructor(url: string, filter: Filter, options?: FindOptions) {
        this.collectionUrl = url
        this.filter = filter
        this.options = options
    }

    async next<T>(): Promise<T> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.collectionUrl)
                collectionUrl.pathname = collectionUrl.pathname + "/find/next"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { filter: this.filter, options: this.options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }
}