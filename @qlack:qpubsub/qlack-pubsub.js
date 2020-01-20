(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.qlack2BowerPubsub = f()}})(function(){var define,module,exports;
/**
 * QPubSub - A cross-frame, cross-domain pub/sub library based on
 * Window.postMessage().
 * @param window The browser window.
 */
(function(window) {
	/** Controls whether log messages are printed or not. */
	var logEnabled = true;

	/** The ID/name of this instance, mainly used for logging messages. */
	var instanceID = undefined;

	/** Whether this instance has been initialised. */
	var isInit = false;

	/** Indicates whether this instance is a server instance or not. Only a
	 *  single server instance should exist.
	 */
	var isServer;

	/** A reference to the window of the server instance of QPubSub to send the
	 *  postMessage messages. This reference is automatically resolved during
	 *  the initialisation of QPubSub.
	 * @type {Window}
	 */
	var serverWindow = window;

	/** The list of subscriptions to topics. This is meaningful only when the
	 * instance if a server.
 	 */	 
    var subscriptions = [];

	/** The server window origin. Clients loaded in iframe will use window.document.referrer
	 *
	 */
	var serverWindowOrigin = window.document.referrer? window.document.referrer: window.location.protocol+"//" +
	window.location.hostname + ":" + window.location.port;	

	/** An array of callback functions to be invoked when a message is received
	 *  on a topic. The array index is the name of the topic, so there can be
	 *  a single callback for each topic. This is meaningful only when the
	 *  instance is a client.
	 * @type {Array}
	 */
	var callbacks = [];

	/** The list of subscriptions to topics. This is meaningful only when the
	 * instance if a server.
 	 */
	var subscriptions = [];

	/** The available message types exchanged. */
	var MESSAGE_TYPE = {
		"CONTROL": 1, // A control message, to initiate the PING/PONG sequence.
		"PUB": 2, 	// A request to publish.
		"SUB": 3,	// A request to subscribe.
		"CALLBACK": 4,	// A callback to a client.
		"UNSUB": 5	// A request to unsubscribe.
	};

	/** The type of control messages used during handshaking between the server
	 * and a client.
 	 */
	var MESSAGE_CONTROL = {
		"PING": "ping",
		"PONG": "pong"
	}

	/**
	 * An internal function to log messages in a consistent way.
	 * @param The message to be logged.
	 */
	function _log(msg) {
		if (logEnabled) {
			console.debug("QPubSub [", instanceID , "]:", msg);
		}
	}

	/**
	 * An alternative internal logging function to log the data of a message.
	 * @param The message object to log its data.
	 */
	function _logData(msg) {
		if (logEnabled) {
			console.debug("QPubSub [", instanceID , "]:", msg.data);
		}
	}

	/**
	 * An internal function to find a server instance of QPubSub. This function
	 * traverses the window.parent hierarchy and posts a 'ping' message to all
	 * QPubSub instances found. The QPubSub instance that will reply with a
	 * 'pong' is considered the default server QPubSub instance. If multiple
	 * QPubSub server instances exist, the last one will be registered as the
	 * one to be used by the QPubSub client.
	 */
	function _signalParent() {
		while (serverWindow !== undefined) {
			serverWindow.postMessage({
				clientID: instanceID,
				msgType: MESSAGE_TYPE.CONTROL,
				msg: MESSAGE_CONTROL.PING

			}, serverWindowOrigin);
			if (serverWindow !== window.parent) {
				serverWindow = window.parent;
			} else {
				break;
			}
		}
	}

	/**
	 * Publishes a message on a topic.
	 * @param topic The name of the topic to publish to.
	 * @param msg The message to be published.
	 */
	function publish(topic, msg) {
		if (!isInit) {
			_log("Tried to publish using a non-initialised PubSub instance.");
			return;
		}

		serverWindow.postMessage({
			clientID: instanceID,
			msgType: MESSAGE_TYPE.PUB,
			topic: topic,
			msg: msg

		}, serverWindowOrigin);
	}

	/**
	 * Subscribes to a topic to receive messages.
	 * @param topic The name of the topic to subscribe to.
	 * @param callback A function to receive the contents of the message.
	 */
	function subscribe(topic, callback) {
		if (!isInit) {
			_log("Tried to subscribe using a non-initialised PubSub instance.");
			return;
		}

		serverWindow.postMessage({
			clientID: instanceID,
			msgType: MESSAGE_TYPE.SUB,
			msg: topic

		}, serverWindowOrigin);
		callbacks[topic] = callback;
	}

	/**
	 * Unsubscribe from a previously subscribed topic.
	 * @param topic The name of the topic to unsubscribe from.
	 */
	function unsubscribe(topic) {
		if (!isInit) {
			_log("Tried to unsubscribe using a non-initialised PubSub instance.");
			return;
		}
		serverWindow.postMessage({
			clientID: instanceID,
			msgType: MESSAGE_TYPE.UNSUB,
			msg: topic

		}, serverWindowOrigin);
		delete(callbacks[topic]);
	}

	/**
	 * Initialises this instance of QPubSub.
	 * @param iID The instance ID/name.
	 * @param server A boolean, indicating whether this instance is a servrer.
	 * @param allowedOrigins A string array of allowed domains to receive messages
	 * from.
	 * @param
	 */
	function init(iID, server, allowedOrigins) {
		/** Set instance parameters. */
		instanceID = iID;
		isServer = server;
		_log("Initialising (server = " + server + ")");
		if (!allowedOrigins) {
			console.log("WARNING! You are initialising QPubSub with no "
					+ "`allowedOrigins`; this is a potential security vulnerability "
					+ "for your application.");
		}

		/** Add message listener. */
		window.addEventListener("message", function(messageEvent) {
			if (allowedOrigins && allowedOrigins.indexOf(messageEvent.origin) == -1) {
				_log("WARNING! Received a message from an unauthorised sender "
						+ "at: " + messageEvent.origin + ". Message will be ignored.");
				return;
			}

			switch (messageEvent.data.msgType) {
				case MESSAGE_TYPE.CONTROL:
					if (messageEvent.data.msg == MESSAGE_CONTROL.PING) {
						if (messageEvent.data.clientID != instanceID) {	// Ignore messages from self.
							_log("Received PING from [ " + messageEvent.data.clientID + " ]");
							/** Send PONG as a reply to a PING message. */
							messageEvent.source.postMessage({
								clientID: instanceID,
								msgType: MESSAGE_TYPE.CONTROL,
								msg: MESSAGE_CONTROL.PONG
							}, messageEvent.origin);
						}
					} else if (messageEvent.data.msg == MESSAGE_CONTROL.PONG) {
						/** A reply message was received on our signal, so this should
						 * become our parent window.
						 */
						serverWindow = messageEvent.source;
						_log("Received PONG from [ " + messageEvent.data.clientID + " ]");
						_log("Setting as parent/server instance [ " + messageEvent.data.clientID + " ]");
					}
					break;
				case MESSAGE_TYPE.SUB:
					_log("Received SUB from [ " + messageEvent.data.clientID + " ]");
					subscriptions.push({
						topic: messageEvent.data.msg,
						clientID: messageEvent.data.clientID,
						clientAgent: messageEvent.source,
						clientSource: messageEvent.origin
					});
					break;
				case MESSAGE_TYPE.UNSUB:
					_log("Received UNSUB from [ " + messageEvent.data.clientID + " ]");
					subscriptions = _.filter(subscriptions, function(o) {
						return o.topic !== messageEvent.data.topic &&
							o.clientID !== messageEvent.data.clientID;
					});
					break;
				case MESSAGE_TYPE.PUB:
					_log("Received PUB from [ " + messageEvent.data.clientID + " ] to topic [ "
							+ messageEvent.data.topic + " ]");
					/** Find subscribers to this channel. */
					var receivers = _.filter(subscriptions, {"topic": messageEvent.data.topic});
					_log("Found [ " + receivers.length + " ] subscribers.");
					_.forEach(receivers, function(val) {
						val.clientAgent.postMessage({
							topic: messageEvent.data.topic,
							clientID: instanceID,
							originalClientID: messageEvent.data.clientID,
							msgType: MESSAGE_TYPE.CALLBACK,
							msg: messageEvent.data.msg
						}, val.clientSource);
					});
					break;
				case MESSAGE_TYPE.CALLBACK:
					_log("Received CALLBACK from [ " + messageEvent.data.clientID + " ] "
							+ "from original client [ " + messageEvent.data.originalClientID
							+ " ] to topic [ "
							+ messageEvent.data.topic + " ]");
					callbacks[messageEvent.data.topic](messageEvent.data);
					break;
				default:
					_logData(messageEvent);
					break;
			}
		}, false);

		/** Establish parent window. */
		if (!isServer) {
			_signalParent();
		}

		isInit = true;
	}

	/**
	 * Enables/disables output log.
	 * @param bool A boolean indicating whether logging is active or not.
	 */
	function setLogActive(bool) {
		logEnabled = bool;
	}

	/** Export functions. */
	window.QPubSub = {
		init: init,
		publish: publish,
		subscribe: subscribe,
		logEnabled: logEnabled,
		unsubscribe: unsubscribe,
		setLogActive: setLogActive
	};
})(window);

});
