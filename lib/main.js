"use strict";

const self = require("sdk/self");
const windows = require("sdk/windows");
const stylesheet_utils = require("sdk/stylesheet/utils");
const simple_prefs = require("sdk/simple-prefs");
const window_namespace = require("sdk/window/namespace");

// Cribbed from sdk/windows/firefox.js
function getChromeWindow(window) {
  return window_namespace.windowNS(window).window;
}

var gButtonCSS = null;
var gWidthCSS = null;

function newTabListener(event)
{
  let tab = event.target;
  let document = event.target.ownerDocument;
  applyTabCropToTab(tab, document, "center");
}

function applyTabCropToTab(tab, document, crop) {
  let c = document.getAnonymousNodes(tab);
  if (c.length != 1) {
    throw Error("expected one anonymous child");
  }
  let label = c[0].querySelector('.tab-label');
  label.crop = crop;
}  

function applyTabCropToWindow(document, crop) {
  let tabs = document.querySelectorAll('.tabbrowser-tab');
  for (let tab of tabs) {
    applyTabCropToTab(tab, document, crop);
  }
}

function doUnloadInWindow(window) {
  let domwin = getChromeWindow(window);
  if (gButtonCSS) {
    stylesheet_utils.removeSheet(domwin, gButtonCSS);
  }
  if (gWidthCSS) {
    stylesheet_utils.removeSheet(domwin, gWidthCSS);
  }
  let doc = domwin.document;
  applyTabCropToWindow(doc, "end");
  doc.getElementById("tabbrowser-tabs").removeEventListener("TabOpen", newTabListener, false);
}

function doUnload() {
  for (let window of windows.browserWindows) {
    doUnloadInWindow(window);
  }
}

function doLoadInWindow(window) {
  var domwin = getChromeWindow(window);
  if (gButtonCSS) {
    stylesheet_utils.loadSheet(domwin, gButtonCSS);
  }
  if (gWidthCSS) {
    stylesheet_utils.loadSheet(domwin, gWidthCSS);
  }
  let doc = domwin.document;
  applyTabCropToWindow(doc, "center");
  doc.getElementById("tabbrowser-tabs").addEventListener("TabOpen", newTabListener, false);
}

function doLoad() {
  if (gButtonCSS || gWidthCSS) {
    doUnload();
  }

  if (simple_prefs.prefs["closebutton"]) {
    gButtonCSS = self.data.url("closebuttons.css");
  } else {
    gButtonCSS = null;
  }
    
  switch (simple_prefs.prefs["widetabs"]) {
    case "alltabs":
      gWidthCSS = self.data.url("alltabs.css");
      break;
    case "activetab":
      gWidthCSS = self.data.url("activetab.css");
      break;
    default:
      gWidthCSS = null;
  }

  for (let window of windows.browserWindows) {
    doLoadInWindow(window);
  }
}

exports.main = function() {
  doLoad();
  windows.browserWindows.on("open", doLoadInWindow);
  simple_prefs.on("", doLoad);
};

exports.onUnload = doUnload;
