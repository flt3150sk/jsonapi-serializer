import { expect } from "chai";

import JSONAPIError from "../lib/error";

describe("Errors", function () {
  describe("Calling without arguments", function () {
    it("should return an empty errors array", function (done) {
      const error = new JSONAPIError();

      expect(error).to.be.eql({
        errors: [],
      });

      done(null, error);
    });
  });

  describe("Calling with a single object", function () {
    it("should return an errors array", function (done) {
      const error = new JSONAPIError({
        status: 404,
      });

      expect(error).to.be.eql({
        errors: [{ status: 404 }],
      });

      done(null, error);
    });
  });

  describe("Options", function () {
    it("should set the id", function (done) {
      const error = new JSONAPIError([
        {
          id: 42,
        },
      ]);

      expect(error).to.be.eql({
        errors: [{ id: 42 }],
      });

      done(null, error);
    });

    it("should set the status", function (done) {
      const error = new JSONAPIError([
        {
          status: 404,
        },
      ]);

      expect(error).to.be.eql({
        errors: [{ status: 404 }],
      });

      done(null, error);
    });

    it("should set the code", function (done) {
      const error = new JSONAPIError([
        {
          code: 123,
        },
      ]);

      expect(error).to.be.eql({
        errors: [{ code: 123 }],
      });

      done(null, error);
    });

    it("should set the title", function (done) {
      const error = new JSONAPIError([
        {
          title: "a short, human-readable summary of the problem",
        },
      ]);

      expect(error).to.be.eql({
        errors: [{ title: "a short, human-readable summary of the problem" }],
      });

      done(null, error);
    });

    it("should set the detail", function (done) {
      const error = new JSONAPIError([
        {
          detail:
            "a human-readable explanation specific to this occurrence of the problem",
        },
      ]);

      expect(error).to.be.eql({
        errors: [
          {
            detail:
              "a human-readable explanation specific to this occurrence of the problem",
          },
        ],
      });

      done(null, error);
    });

    it("should set the links object", function (done) {
      const error = new JSONAPIError([
        {
          links: {
            about: "https://github.com/SeyZ",
          },
        },
      ]);

      expect(error).to.be.eql({
        errors: [
          {
            links: { about: "https://github.com/SeyZ" },
          },
        ],
      });

      done(null, error);
    });

    it("should set the source object", function (done) {
      const error = new JSONAPIError([
        {
          source: {
            pointer: "/data/attributes/title",
            parameter: "filter",
          },
        },
      ]);

      expect(error).to.be.eql({
        errors: [
          {
            source: {
              pointer: "/data/attributes/title",
              parameter: "filter",
            },
          },
        ],
      });

      done(null, error);
    });

    it("should set the meta object", function (done) {
      const error = new JSONAPIError([
        {
          meta: { author: "Sandro Munda" },
        },
      ]);

      expect(error).to.be.eql({
        errors: [
          {
            meta: { author: "Sandro Munda" },
          },
        ],
      });

      done(null, error);
    });
  });
});
