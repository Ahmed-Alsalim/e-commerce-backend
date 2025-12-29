const { assert } = require("chai");
const app = require("./main");
const request = require('supertest');


describe("server running", () => {
    it("should respond with status 200 on GET /", (done) => {
        request(app)
            .get('/')
            .expect(200)
            .expect('Hello World!')
            .end(done);
    });
});