import { Option, some, none, Result, ok, err } from "matchingmonads"
import { match, select } from 'ts-pattern';
import { getSessionSecret } from "./auth"
import { fetchPostEncrypted } from "./fetch";
import { FindCursor } from "./FindCursor";

export type CollectionOptions = unknown

type Filter = unknown
type FindOptions = unknown

type InsertOneOptions = unknown

type DeleteOptions = unknown

export class Collection {
    url: string

    constructor(url) {
        this.url = url
    }

    async findOne<T>(filter?: Filter, options?: FindOptions): Promise<T> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.url)
                collectionUrl.pathname = collectionUrl.pathname + "/findone"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { filter: filter, options: options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }

    find(filter?: Filter, options?: FindOptions): FindCursor {
        return new FindCursor(this.url, filter, options)
    }

    async insertOne<T>(doc: T, options?: InsertOneOptions): Promise<any> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.url)
                collectionUrl.pathname = collectionUrl.pathname + "/insertone"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { doc: doc, options: options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }

    async insertMany<T>(docs: T[], options?: InsertOneOptions): Promise<any> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.url)
                collectionUrl.pathname = collectionUrl.pathname + "/insertmany"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { docs: docs, options: options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }

    async deleteOne<T>(filter?: Filter, options?: DeleteOptions): Promise<T> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.url)
                collectionUrl.pathname = collectionUrl.pathname + "/deleteone"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { filter: filter, options: options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }

    async deleteMany<T>(filter?: Filter, options?: DeleteOptions): Promise<T> {
        return await (await match(getSessionSecret())
            .with({ tag: "none" }, async (_) => err("Error: The MongoClient has no active session. Try to connect to a server."))
            .with({ tag: "some" }, async (x) => {

                let collectionUrl = new URL(this.url)
                collectionUrl.pathname = collectionUrl.pathname + "/deletemany"

                const result = await fetchPostEncrypted(collectionUrl.toString(), { filter: filter, options: options }, x.value)

                return match(result as Result<string, string>)
                    .with({ tag: "ok" }, x => ok(x.value))
                    .with({ tag: "err" }, x => err(x.value))
                    .exhaustive()
            })
            .exhaustive())
            .toPromise()
    }
}