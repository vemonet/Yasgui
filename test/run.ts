import "source-map-support/register";
import * as puppeteer from "puppeteer";

import * as path from "path";
import * as http from "http";
import * as chai from "chai";
import { it, describe, before, beforeEach, after, afterEach } from "mocha";
const expect = chai.expect;
import Yasqe from "@sib-swiss/yasqe";
//@ts-ignore ignore unused warning
import { setup, destroy, closePage, getPage, wait } from "./utils";

declare const window: Window & {
  Yasqe: typeof Yasqe;
  yasqe: Yasqe;
};

describe("Yasqe", function () {
  // Define global variables
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  let server: http.Server | undefined;

  /**
   * When issuing page.keyboard.type commands, codemirror might not have processed the command
   * fully when that promise is resolved.
   * So, use our own function where we wait for codemirror to have processed all key-downs
   */
  // async function type(text: string) {
  //   await page.keyboard.type(text);
  //   await page.waitForFunction(`window.yasqe.getValue().indexOf("${text}") >= 0`, { timeout: 600 });
  // }
  before(async function () {
    const refs = await setup(this, path.resolve("./build"));
    browser = refs.browser;
    server = refs.server;
  });

  beforeEach(async () => {
    page = await getPage(browser, "yasqe.html");
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await closePage(this, page);
  });

  after(async function () {
    return destroy(browser, server);
  });

  it("get a value", async function () {
    const value = await page.evaluate(() => {
      return window.yasqe.getValue();
    });
    expect(value).to.contain("SELECT");
  });
});
