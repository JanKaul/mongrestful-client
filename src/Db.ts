export type DbOptions = unknown

export class Db {
    url: string
    constructor(url) {
        this.url = url
    }
}