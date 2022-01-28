import { expect } from '@esm-bundle/chai';
import { MongoClient } from "../dist/index"

let client = new MongoClient("http://localhost:3000");

describe("connect to server", () => {
    it('', (done) => {
        client.connect().then(_ => { expect(client.url).to.not.equal(undefined); done() })
            .catch(x => { console.log(x); })
    })
});

describe("close session", () => {
    it('', (done) => {
        client.close().then(_ => { expect(client.url).to.not.equal(undefined); done() })
            .catch(x => { console.log(x); done() })
    })
});