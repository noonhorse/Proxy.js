Proxy.js
=========

Proxy.js description.

# Document

- https://github.com/uupaa/Proxy.js/wiki/Proxy
- https://github.com/uupaa/NodeProxy.js/wiki/NodeProxy

and

- https://github.com/uupaa/WebModule and [slide](http://uupaa.github.io/Slide/slide/WebModule/index.html)
- https://github.com/uupaa/Help.js and [slide](http://uupaa.github.io/Slide/slide/Help.js/index.html)

# How to use

```js
<script src="lib/Proxy.js">
<script>
// for Browser
var proxy = new Proxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});

</script>
```

```js
// for WebWorkers
importScripts("lib/Proxy.js");

var proxy = new Proxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});
```


# for Developers

1. Install development dependency tools

    ```sh
    $ brew install closure-compiler
    $ brew install node
    $ npm install -g plato
    ```

2. Clone Repository and Install

    ```sh
    $ git clone git@github.com:uupaa/Proxy.js.git
    $ cd Proxy.js
    $ npm install
    ```

3. Build and Minify

    `$ npm run build`

4. Test

    `$ npm run test`

5. Lint

    `$ npm run lint`


