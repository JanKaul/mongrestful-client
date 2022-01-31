import { expect } from '@esm-bundle/chai';
import { MongoClient } from "../dist/index"

let client = new MongoClient("http://localhost:3000");

describe("connect to server", () => {
    it('', (done) => {
        client.connect().then(x => { expect(x.url).to.equal("http://localhost:3000"); done() })
            .catch(x => { expect.fail(x); })
    })
});

describe("connect to database", () => {
    it('', (done) => {
        client.db("test").then(x => { expect(x.url).to.equal("http://localhost:3000/test"); done() })
            .catch(x => { expect.fail(x); done() })
    })
});

describe("close session", () => {
    it('', (done) => {
        client.close().then(x => { expect(x).to.equal(undefined); done() })
            .catch(x => { expect.fail(x); done() })
    })
});