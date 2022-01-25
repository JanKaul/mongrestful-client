import { expect } from '@esm-bundle/chai';

describe("test bundle", () => {
    it('', (done) => {
        fetch("http://localhost:3000/", { method: "GET" })
            .then(response => { return response.text() })
            .then(x => { expect(x.slice(0, 26)).to.equal("-----BEGIN PUBLIC KEY-----"); done() })
            .catch(x => { console.log(x); done() })
    })
});