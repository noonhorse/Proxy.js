# Proxy.js [![Build Status](https://travis-ci.org/uupaa/Proxy.js.png)](http://travis-ci.org/uupaa/Proxy.js)

[![npm](https://nodei.co/npm/uupaa.proxy.js.png?downloads=true&stars=true)](https://nodei.co/npm/uupaa.proxy.js/)

XMLHttpRequest proxy.

## Document

- [Proxy.js wiki](https://github.com/uupaa/Proxy.js/wiki/Proxy)
- [Development](https://github.com/uupaa/WebModule/wiki/Development)
- [WebModule](https://github.com/uupaa/WebModule) ([Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html))


## How to use

### Browser

```js
<script src="lib/Proxy.js">
<script>
var proxy = new Proxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});

</script>
```

### WebWorkers

```js
importScripts("lib/Proxy.js");

var proxy = new Proxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});
```

