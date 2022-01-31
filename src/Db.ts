import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';

import { Collection, CollectionOptions } from "./Collection"
import { getSessionSecret } from "./auth"
import { fetchPostEncrypted } from "./fetch";

export type DbOptions = unknown

export class Db {
    url: string
    constructor(url: string) {
        this.url = url
    }
    async collection(collectionName: string, collectionOptions: CollectionOptions): Promise<Collection> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let dbUrl = new URL(this.url)
                dbUrl.pathname = dbUrl.pathname + "/collection"

                const result = await fetchPostEncrypted(dbUrl.toString(), { collectionName: collectionName, collectionOptions: collectionOptions }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(new Collection(this.url + "/" + collectionName)))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }
}