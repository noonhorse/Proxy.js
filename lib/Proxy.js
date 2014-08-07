(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var EventListener = global["EventListener"];
var DataType      = global["DataType"];
var URI           = global["URI"];

// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

// readyState code -> http://www.w3.org/TR/XMLHttpRequest/
var READY_STATE_UNSENT           = 0;
var READY_STATE_OPENED           = 1;
var READY_STATE_HEADERS_RECEIVED = 2;
var READY_STATE_LOADING          = 3;
var READY_STATE_DONE             = 4;

// --- class / interfaces ----------------------------------
function Proxy() {
    this._event = new EventListener().types(
        "loadstart,load,loadend,progress,readystatechange,error,timeout".split(","));

    this._xhr = new XMLHttpRequest();
    this._lv2 = "onload" in this._xhr &&
                "responseType" in this._xhr &&
                "withCredentials" in this._xhr;
    this._lastURL = "";
    this._lastReadyState = READY_STATE_UNSENT;

    // setup getter and setter.
    Object.defineProperties(this, {
        "readyState":     { "get": getReadyState                                },
        "response":       { "get": getResponse                                  },
        "responseText":   { "get": getResponseText                              },
        "responseType":   { "get": getResponseType,   "set": setResponseType    },
        "responseXML":    { "get": getResponseXML                               },
        "status":         { "get": getStatus                                    },
        "statusText":     { "get": getStatusText                                },
        "upload":         { "get": getUpload,         "set": setUpload          },
        "withCredentials":{ "get": getWithCredentials,"set": setWithCredentials }
    });
}

//{@dev
Proxy["repository"] = "https://github.com/uupaa/Proxy.js";
//}@dev

Proxy["prototype"] = {
    "constructor":          Proxy,                      // new Proxy(options:Object = null)
    "get":                  Proxy_get,                  // Proxy#get(url:URLString, callback:Function):this
    "abort":                Proxy_abort,                // Proxy#abort():void
    "getAllResponseHeaders":Proxy_getAllResponseHeaders,// Proxy#getAllResponseHeaders():String
    "getResponseHeader":    Proxy_getResponseHeader,    // Proxy#getResponseHeader(name:String):String
    "open":                 Proxy_open,                 // Proxy#open(method:String, url:URLString, async:Boolean = true,
                                                        //            user:String = "", password:String = ""):void
    "overrideMimeType":     Proxy_overrideMimeType,     // Proxy#overrideMimeType():void
    "send":                 Proxy_send,                 // Proxy#send(data:Any = null):void
    "setRequestHeader":     Proxy_setRequestHeader,     // Proxy#setRequestHeader():void
    "addEventListener":     Proxy_addEventListener,     // Proxy#addEventListener(type:EventTypeString, callback:Function):this
    "removeEventListener":  Proxy_removeEventListener,  // Proxy#removeEventListener(type:EventTypeString, callback:Function):this
    "clearEventListener":   Proxy_clearEventListener,   // Proxy#clearEventListener():this
    "on":                   Proxy_addEventListener,     // Proxy#on(type:EventTypeString, callback:Function):this
    "off":                  Proxy_removeEventListener,  // Proxy#off(type:EventTypeString, callback:Function):this
    "level":                Proxy_level,                // Proxy#level():Number
    "convert":              Proxy_convert,              // Proxy#convert():Any
    // --- internal ---
    "handleEvent":          Proxy_handleEvent
};

// --- implements ------------------------------------------
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
function Proxy_abort()          { this._xhr["abort"](); }
function Proxy_level()          { return this._lv2 ? 2 : 1; }

function Proxy_get(url,        // @arg URLString
                   callback) { // @arg Function - callback(error, responseText, xhr):void
                               // @ret this
                               // @desc convenient method.
//{@dev
    $valid($type(url,      "String") && !URI.parse(url).error, Proxy_get, "url");
    $valid($type(callback, "Function"),                        Proxy_get, "callback");
//}@dev

    var proxy = new Proxy();

    proxy["on"]("load", function() {
        if ( _isSuccess(this["status"], /^file\:/.test(url)) ) {
            callback(null, this["responseText"], this);
        } else {
            callback(new Error(this["status"]), "", this);
        }
    });
    proxy["open"]("GET", url);
    proxy["send"]();

    return this;
}

function Proxy_getAllResponseHeaders() { // @ret String
    return this._xhr["getAllResponseHeaders"]();
}

function Proxy_getResponseHeader(name) { // @arg String
                                         // @ret String
//{@dev
    $valid($type(name, "String"), Proxy_getResponseHeader, "name");
//}@dev

    return this._xhr["getResponseHeader"](name);
}

function Proxy_open(method,     // @arg String - "GET" or "POST", ...
                    url,        // @arg URLString
                    async,      // @arg Boolean = true
                    user,       // @arg String = ""
                    password) { // @arg String = ""
//{@dev
    $valid(this._xhr["readyState"] === READY_STATE_UNSENT,   Proxy_open, "sequence error");
    $valid($type(method, "String") && /^(GET|POST)$/.test(method), Proxy_open, "method");
    $valid($type(url,    "String") && !URI.parse(url).error, Proxy_open, "url");
    $valid($type(async,  "Boolean|omit"),               Proxy_open, "async");
    $valid($type(user,   "String|omit"),                Proxy_open, "user");
    $valid($type(password, "String|omit"),              Proxy_open, "password");
//}@dev

    async = async === undefined ? true : async;

    this._lastURL = url;
    this._lastReadyState = READY_STATE_UNSENT;

    if (!this._lv2) {
        this._xhr["addEventListener"]("readystatechange", this); // call handleEvent
    }
    this._xhr["open"](method, url, async, user, password);
}

function Proxy_overrideMimeType(mimeType) { // @arg String
//{@dev
    $valid($type(mimeType, "String"), Proxy_overrideMimeType, "mimeType");
//}@dev

    this._xhr["overrideMimeType"](mimeType);
}

function Proxy_send(data) { // @arg Any = null - POST request body
//{@dev
    $valid(this._xhr["readyState"] === READY_STATE_OPENED, Proxy_send, "sequence error");
//}@dev

    // XHR Lv1 && binary -> overrideMimeType
    if (!this._lv2) {
        if ( /arraybuffer|blob/.test(this._xhr["responseType"]) ) {
            this._xhr["overrideMimeType"]("text/plain; charset=x-user-defined");
        }
    }
    this._xhr["send"](data);
}

function Proxy_setRequestHeader(name,    // @arg String - header name
                                value) { // @arg String - header value
//{@dev
    $valid($type(name,  "String"), Proxy_setRequestHeader, "name");
    $valid($type(value, "String"), Proxy_setRequestHeader, "value");
//}@dev

    this._xhr["setRequestHeader"](name, value);
}

function Proxy_addEventListener(type,       // @arg EventTypeString - "readystatechange"
                                callback) { // @arg Function
                                            // @ret this
    this._event["add"](this._lv2 ? this._xhr : null, type, callback);
    return this;
}

function Proxy_removeEventListener(type,       // @arg EventTypeString - "readystatechange"
                                   callback) { // @arg Function
                                               // @ret this
    this._event["remove"](this._lv2 ? this._xhr : null, type, callback);
    return this;
}

function Proxy_clearEventListener() { // @ret this
    this._event["clear"](this._lv2 ? this._xhr : null);
    return this;
}

function Proxy_handleEvent(event) { // @arg EventObject|null
                                    // @desc simulate XHR Lv2 events
    var xhr = this._xhr;
    var status = xhr["status"];
    var readyState = xhr["readyState"];

    if (this._lastReadyState !== readyState) {
        this._lastReadyState = readyState;
        _fireEvent(this, "readystatechange", event);
    }

    switch (readyState) {
    case READY_STATE_OPENED:
        _fireEvent(this, "loadstart", event);
        break;
    case READY_STATE_HEADERS_RECEIVED:
    case READY_STATE_LOADING:
        _fireEvent(this, "progress", event);
        break;
    case READY_STATE_DONE:
        if ( _isSuccess(status, /^file\:/.test(this._lastURL)) ) {
            try {
                xhr["response"] = _convertDataType(xhr["responseText"],
                                                   xhr["responseType"]);
            } catch (o_O) {
            }
            _fireEvent(this, "load", event);
        }
        _fireEvent(this, "loadend", event);
        xhr.removeEventListener("readystatechange", this);
    }
}

function Proxy_convert() { // @ret Any
    var xhr = this._xhr;
    var status = xhr["status"];
    var readyState = xhr["readyState"];

    if (readyState === READY_STATE_DONE) {
        if ( _isSuccess(status, /^file\:/.test(this._lastURL)) ) {
            return _convertDataType(xhr["responseText"],
                                    xhr["responseType"]);
        }
    }
    return "";
}

function _convertDataType(text, type) {
    switch (type) {
    case "json":    return JSON.parse(text);                      // -> Object
    case "document":return _createHTMLDocument(text);             // -> Document|String
    case "arraybuffer":
    case "blob":    return DataType["Array"]["fromString"](text); // -> ByteArray
    }
    return text;
}

function _createHTMLDocument(text) {
    if (_runOnBrowser) {
        var body = document.createElement("body");

        body["innerHTML"] = text;
        return body;
    }
    return text;
}

function _isSuccess(status,       // @arg Integer - HTTP_STATUS_CODE
                    isFilePath) { // @arg Boolean - true is file://path
                                  // @ret Boolean
    var ok = status >= 200 && status < 300;

    return isFilePath ? (status === 0 || ok)
                      : ok;
}

function _fireEvent(that,    // @arg this
                    type,    // @arg EventTypeString - "readystatechange", "loadstart", "progress", "load", "error", "loadend"
                    event) { // @arg EventObject - { type, ... }
    if ( that._event["has"](type) ) {
        that._event["get"](type).forEach(function(callback) {
            callback.call(that._xhr, event);
        });
    }
}

// --- validate / assertions -------------------------------
//{@dev
function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if ("process" in global) {
    module["exports"] = Proxy;
}
global["Proxy" in global ? "Proxy_" : "Proxy"] = Proxy; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule

