import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';
import { getSessionSecret } from "./auth"
import { fetchPostEncrypted } from "./fetch";

export type CollectionOptions = unknown

export class Collection {
    url: string
    constructor(url) {
        this.url = url
    }
    async findOne(collectionName: string, collectionOptions: CollectionOptions): Promise<any> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.url)
                collectionUrl.pathname = collectionUrl.pathname + "/findone"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { options: undefined }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }
}