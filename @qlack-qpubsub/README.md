# @qlack/qpubsub

Npm package for QPubSub - A cross-frame pubsub library. 

QPubSub allows your application to utilise publish/subscribe messaging across different components and layers. What makes this library interesting is that it also allows inter-frame pubsub, that is
establishing subscriptions and publishing from different iframes even if these
iframes belong to different domains. Such inter-domain message passing is taking
place via the well-establish HTML5 [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) method.

The library follows a client-server paradigm, where a single-only instance of
QPubSub is acting as a Hub (the server) and multiple QPubSub instances are
acting as the clients. The server component needs to be started prior to all
clients, however clients may perform a fallback-and-wait logic while initiating
their connection to the server until the server becomes available (note that
such logic is not currently part of the library).

An Angular wrapper is also available for this component as [QNgPubSub](https://www.npmjs.com/package/@qlack/qng-pub-sub).

## Installing
`npm install --save @qlack/qpubsub`

## Usage
### Starting the server
On the window where the server component runs, initialise QPubSub as:
```    
window.onload = function() {
	QPubSub.init("server", true);
};
```
* The first argument is the name of this instance. This name does not have any practical
implication other than helping you identifying the source of log messages.
* The second argument is a boolean value indicating whether this instance of
QPubSub is a server instance; you need to set it as 'true'.

### Starting a client
```
window.onload = function(){
	QPubSub.init("client1", false);
};
```
* Similarly to the server instantiation, but indicating that this is a client
instance with the 'false' argument.

During client initialisation, QPubSub will traverse the DOM and try to identify
a listening QPubSub server. Once the server is identified, a ping-pong style of
message exchange will take place to allow the client to register with the server.
You need to ensure that when initialisation of the client takes place the server
component is already loaded and initialised.

### Security
To guarantee that only allowed domains can communicate with your QPubSub server,
you may provide an allowed domains list while initialising QPubSub. The domain
 list is a string array, so multiple domains can be specified at once, e.g. 
```
QPubSub.init("server", true, ["http://localhost:8080", "https://myprod-url", "https://mypreprod-url"]);
```

### API
#### `init(iID, server, allowedOrigins)`
Initialises the QPubSub instance.
* `iID` A String value identifying the name of this instance. Its only purpose
is to identify the source of console logging messages.
* `server` A Boolean value indicating whether this instance is a server. Make
sure you only have one server instance running.
* `allowedOrigins` A String array with the domains from which communication
is allowed. If not specified, you will see a warning in your Javascript
console, however pub/sub will still work. You are strongly advised to never
use QPubSub in production without a list of allowed domains.

#### `subscribe(topic, callback)`
Subscribe to a topic to receive messages. Each message received is forwarded to
the callback function specified.
* `topic` The name of the topic to subscribe to.
* `callback` A callback function to receive the message.

#### `unsubscribe(topic)`
Unsubscribes from a previously subscribed topic.
* `topic` The name of the topic to unsubscribe from.

#### `publish(topic, message)`
Publishes a message to a specific topic.
* `topic` The name of the topic where the message will be published.
* `message` The message to be published.

#### `setLogActive(boolean)`
* `boolean` Whether to set loggin as active or not.