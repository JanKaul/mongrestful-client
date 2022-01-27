import { expect } from '@esm-bundle/chai';
import { MongoClient } from "../dist/index"

describe("get publicKey", () => {
    it('', (done) => {
        let client = new MongoClient("http://localhost:3000");
        client.connect("jan", "kaul").then(_ => { expect(client.url).to.not.equal(undefined); done() })
            .catch(x => { console.log(x); done() })
    })
});