// @name: Proxy.js
// @require: Valid.js

(function(global) {
"use strict";

// --- variable --------------------------------------------
//{@assert
var Valid = global["Valid"] || require("uupaa.valid.js");
//}@assert
var ByteArray = global["ByteArray"] || require("uupaa.bytearray.js");
var URI       = global["URI"]       || require("uupaa.uri.js");

var _inNode = "process" in global;

// --- define ----------------------------------------------
// readyState from http://www.w3.org/TR/XMLHttpRequest/
var READY_STATE_UNSENT    = 0;
var READY_STATE_OPENED    = 1;
var READY_STATE_HEADERS_RECEIVED = 2;
var READY_STATE_LOADING   = 3;
var READY_STATE_DONE      = 4;

// --- interface -------------------------------------------
function Proxy() { // @help: Proxy
    this._xhr = new XMLHttpRequest();
    this._lv = ("onload" in this._xhr) ? 2 : 1; // XHR Lv1 or Lv2
    this._fileURL = false;

    this._lastReadyState = READY_STATE_UNSENT;
    this._attachedEvents = {}; // { eventType: callback, ... }

    Object.defineProperties(this, {
        "readyState":       { "get": getReadyState },
        "response":         { "get": getResponse },
        "responseText":     { "get": getResponseText },
        "responseType":     { "get": getResponseType,
                              "set": setResponseType },
        "responseXML":      { "get": getResponseXML },
        "status":           { "get": getStatus },
        "statusText":       { "get": getStatusText },
        "upload":           { "get": getUpload,
                              "set": setUpload },
        "withCredentials":  { "get": getWithCredentials,
                              "set": setWithCredentials }
    });
}

Proxy["name"] = "Proxy";
Proxy["repository"] = "https://github.com/uupaa/Proxy.js";
Proxy["prototype"] = {
    "constructor":          Proxy,
    "get":                  Proxy_get,                  // Proxy#get(url:URLString, callback:Function):this
    "abort":                Proxy_abort,                // Proxy#abort():void
    "getAllResponseHeaders":Proxy_getAllResponseHeaders,// Proxy#getAllResponseHeaders():String
    "getResponseHeader":    Proxy_getResponseHeader,    // Proxy#getResponseHeader(name:String):String
    "open":                 Proxy_open,                 // Proxy#open(method:String, url:URLString, async:Boolean = true,
                                                        //            user:String = "", password:String = ""):void
    "overrideMimeType":     Proxy_overrideMimeType,     // Proxy#overrideMimeType():void
    "send":                 Proxy_send,                 // Proxy#send(data:Any = null):void
    "setRequestHeader":     Proxy_setRequestHeader,     // Proxy#setRequestHeader():void
    "addEventListener":     Proxy_addEventListener,     // Proxy#addEventListener(eventType:String, callback:Function):Boolean
    "removeEventListener":  Proxy_removeEventListener,  // Proxy#removeEventListener(eventType:String, callback:Function):Boolean
    "clearEventListener":   Proxy_clearEventListener,   // Proxy#clearEventListener():Boolean
    "on":                   Proxy_addEventListener,     // Proxy#on(eventType:String, callback:Function):Boolean
    "off":                  Proxy_removeEventListener,  // Proxy#off(eventType:String, callback:Function):Boolean
    "handleEvent":          Proxy_handleEvent,
    "level":                Proxy_level                 // Proxy#level():Number
};

// --- implement -------------------------------------------
function getReadyState()        { return this._xhr["readyState"]; }
function getResponse()          { return this._xhr["response"]; }
function getResponseText()      { return this._xhr["responseText"]; }
function getResponseType()      { return this._xhr["responseType"]; }
function setResponseType(v)     {        this._xhr["responseType"] = v; }
function getResponseXML()       { return this._xhr["responseXML"]; }
function getStatus()            { return this._xhr["status"]; }
function getStatusText()        { return this._xhr["statusText"]; }
function getUpload()            { return this._xhr["upload"] || null; }
function setUpload(v)           {        this._xhr["upload"] = v; }
function getWithCredentials()   { return this._xhr["withCredentials"] || false; }
function setWithCredentials(v)  {        this._xhr["withCredentials"] = v;  }

function Proxy_get(url,        // @arg URLString:
                   callback) { // @arg Function: callback(error, responseText, xhr):void
                               // @ret this:
//{@assert
    _if(!Valid.type(url,      "String") || URI.parse(url).error, "Proxy#get(url)");
    _if(!Valid.type(callback, "Function"),                       "Proxy#get(,callback)");
//}@assert

    var proxy = new Proxy();

    proxy["on"]("load", function() {
        if ( (this["status"] === 0  && /^file\:/.test(url)) ||
             (this["status"] >= 200 && this["status"] < 300) ) {
            callback(null, this["responseText"], this);
        } else {
            callback(new Error(this["status"]), "", this);
        }
    });
    proxy["open"]("GET", url);
    proxy["send"]();
}

function Proxy_abort() { // @help: Proxy#abort
    this._xhr["abort"]();
}

function Proxy_getAllResponseHeaders() { // @ret String:
                                         // @help: Proxy#getAllResponseHeaders
    return this._xhr["getAllResponseHeaders"]();
}

function Proxy_getResponseHeader(name) { // @arg String:
                                         // @ret String:
                                         // @help: Proxy#getResponseHeader
//{@assert
    _if(!Valid.type(name, "String"), "Proxy#getResponseHeader(name)");
//}@assert

    return this._xhr["getResponseHeader"](name);
}

function Proxy_open(method,     // @arg String: "GET" or "POST", ...
                    url,        // @arg URLString:
                    async,      // @arg Boolean(= true):
                    user,       // @arg String(= ""):
                    password) { // @arg String(= ""):
                                // @help: Proxy#open
//{@assert
    _if(this._xhr["readyState"] !== READY_STATE_UNSENT, "Proxy#open() sequence error");
    _if(!Valid.type(method, "String")  || !/^(GET|POST)$/.test(method), "Proxy#open(method)");
    _if(!Valid.type(url,    "String")  || URI.parse(url).error, "Proxy#open(,url)");
    _if(!Valid.type(async,  "Boolean/omit"), "Proxy#open(,,async)");
    _if(!Valid.type(user,   "String/omit"),  "Proxy#open(,,,user)");
    _if(!Valid.type(password, "String/omit"), "Proxy#open(,,,,password)");
//}@assert

    async = async === undefined ? true : async;

    this._lastReadyState = READY_STATE_UNSENT;
    this._fileURL = /^file\:/.test(url);

    this._xhr["open"](method, url, async, user, password);
}

function Proxy_overrideMimeType(mimeType) { // @arg String:
                                            // @help: Proxy#overrideMimeType
//{@assert
    _if(!Valid.type(mimeType, "String"), "Proxy#overrideMimeType(mimeType)");
//}@assert

    this._xhr["overrideMimeType"](mimeType);
}

function Proxy_send(data) { // @arg Any(= null): POST request body
                            // @help: Proxy#send
//{@assert
    _if(this._xhr["readyState"] !== READY_STATE_OPENED, "Proxy#send() sequence error");
//}@assert

    if (this._lv === 1) {
        if ( /arraybuffer|blob/.test(this._xhr["responseType"]) ) {
            this._xhr["overrideMimeType"]("text/plain; charset=x-user-defined");
        }
        this._xhr["addEventListener"]("readystatechange", this, false);
    }
    this._xhr["send"](data);
}

function Proxy_setRequestHeader(name,    // @arg String: header name
                                value) { // @arg String: header value
                                         // @help: Proxy#setRequestHeader
//{@assert
    _if(!Valid.type(name, "String"),  "Proxy#setRequestHeader(name)");
    _if(!Valid.type(value, "String"), "Proxy#setRequestHeader(,value)");
//}@assert

    this._xhr["setRequestHeader"](name, value);
}

function Proxy_addEventListener(eventType,  // @arg EventTypeString: "readystatechange"
                                callback) { // @arg Function:
                                            // @help: Proxy#addEventListener
//{@assert
    _if(!Valid.type(eventType, "String"),   "Proxy#addEventListener(eventType)");
    _if(!Valid.type(callback,  "Function"), "Proxy#addEventListener(,callback)");
//}@assert

    if (eventType in this._attachedEvents) {
        return false;
    }
    if (this._lv >= 2) {
        this._xhr["addEventListener"](eventType, callback, false);
    }
    this._attachedEvents[eventType] = callback;

    return true;
}

function Proxy_removeEventListener(eventType,  // @arg EventTypeString: "readystatechange"
                                   callback) { // @arg Function:
                                               // @help: Proxy#removeEventListener
//{@assert
    _if(!Valid.type(eventType, "String"),   "Proxy#removeEventListener(eventType)");
    _if(!Valid.type(callback,  "Function"), "Proxy#removeEventListener(,callback)");
//}@assert

    if (eventType in this._attachedEvents) {
        return false;
    }
    if (this._lv >= 2) {
        this._xhr["removeEventListener"](eventType, callback, false);
    }
    delete this._attachedEvents[eventType];

    return true;
}

function Proxy_clearEventListener() { // @help: Proxy#clearEventListener
    var eventTypes = Object.keys(this._attachedEvents);

    if (!eventTypes.length) {
        return false;
    }
    for (var eventType in eventTypes) {
        var callback = this._attachedEvents[eventType];

        if (callback) {
            this["removeEventListener"](eventType, callback);
        }
    }
    return true;
}

function Proxy_handleEvent(event) { // hook readystatechange event
    if (this._xhr["readyState"] === READY_STATE_DONE) {
        switch (this._xhr["status"]) {
        case 0:
            if (!this._fileURL) {
                break;
            }
        case 200:
        case 201:
            this._xhr["response"] = _createResponseValue(this._xhr);
            break;
        }
    }

    if (this._lastReadyState !== this._xhr["readyState"]) {
        this._lastReadyState = this._xhr["readyState"];
        _call(this, "readystatechange", event);
    }

    switch (this._xhr["readyState"]) {
    case READY_STATE_OPENED:
        _call(this, "loadstart", event);
        break;

    case READY_STATE_HEADERS_RECEIVED:
        _call(this, "progress", event);
        break;

    case READY_STATE_LOADING:
        _call(this, "progress", event);
        break;

    case READY_STATE_DONE:
        if ( (this._xhr["status"] === 0  && this._fileURL) ||
             (this._xhr["status"] >= 200 && this._xhr["status"] < 300) ) {
            _call(this, "load", event);
        }
        _call(this, "loadend", event);
        this._xhr.removeEventListener("readystatechange", this, false);
    }
}

function _call(that, type, event) {
    if (that._attachedEvents[type]) {
        that._attachedEvents[type].call(that._xhr, event);
    }
}

function _createResponseValue(xhr) {
    var text = xhr["responseText"];
    var body = null;
    var result = null;

    switch (xhr["responseType"]) {
    case "arraybuffer":
    case "blob":
        result = ByteArray["fromString"](text);
        break;
    case "document":
        if ("document" in global) {
            body = document.createElement("body");
            body["innerHTML"] = text;
            result = body;
        }
        break;
    case "json":
        result = JSON.parse(text);
        break;
    case "text":
    default:
        result = text;
    }
    return result;
}

function Proxy_level() { // @ret Number:
                         // @help: Proxy#level
    return this._lv;
}

//{@assert
function _if(value, msg) {
    if (value) {
        console.error(Valid.stack(msg));
        throw new Error(msg);
    }
}
//}@assert

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = Proxy;
}
//}@node
if (global["Proxy"]) {
    global["Proxy_"] = Proxy; // already exsists
} else {
    global["Proxy"]  = Proxy;
}

})((this || 0).self || global);

