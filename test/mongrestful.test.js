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

describe("create collection", () => {
    it('', (done) => {
        client.db("test").then(db => db.collection("songs")).then(x => { expect(x.url).to.equal("http://localhost:3000/test/songs"); done() })
            .catch(x => { expect.fail(x); done() })
    })
});

describe("findOne", () => {
    it('', (done) => {
        client.db("test").then(db => db.collection("songs")).then(collection => collection.findOne({ artist: "Creedence Clearwater Revival" })).then(x => { expect(x._id).to.not.equal(undefined); done() })
            .catch(x => { expect.fail(x); done() })
    })
});

describe("insertOne", () => {
    it('', (done) => {
        client.db("test").then(db => db.collection("songs")).then(collection => collection.insertOne({ artist: "Jack Johnson", name: "Flake" })).then(x => { expect(x.acknowledged).to.equal(true); done() })
            .catch(x => { expect.fail(x); done() })
    })
});

describe("close session", () => {
    it('', (done) => {
        client.close().then(x => { expect(x).to.equal(undefined); done() })
            .catch(x => { expect.fail(x); done() })
    })
});