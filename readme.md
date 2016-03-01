#Optimizely Node Client

Access the [Optimizely REST API][opt-api] via javascript

### Installation

```bash
$ npm install optimizely-node-client
```

### Usage

```js
var OptimizelyClient = require('optimizely-node-client');
var API_TOKEN = "*";//Get token from www.optimizely.com/tokens
var oc = new OptimizelyClient(API_TOKEN);
```

```js
// OAuth2 token
var OptimizelyClient = require('optimizely-node-client');
var API_TOKEN = "*";//Get token from www.optimizely.com/tokens
var oc = new OptimizelyClient(API_TOKEN, null, true);
```

### Example
```js
oc.createProject({/*...project properties*/})

```
## Contributing

Please see [contributing.md](contributing.md).

## Copyright and license

Code copyright 2015 Celerius Group Inc. Released under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

[opt-api]:http://developers.optimizely.com/rest/
