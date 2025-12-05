// FE/src/services/websocketService.js

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.messageCallbacks = [];
    this.swipeCallbacks = [];
    this.isConnecting = false; // ✅ Add connection lock
    this.connectionPromise = null; // ✅ Store connection promise
  }

  // ✅ ADD THIS METHOD
  isConnected() {
    return this.client && this.client.connected;
  }

  connect(token, userId) {
    // ✅ If already connected, return immediately
    if (this.client && this.client.connected) {
      console.log('⚠️ Already connected to WebSocket');
      return Promise.resolve();
    }

    // ✅ If currently connecting, return the existing promise
    if (this.isConnecting && this.connectionPromise) {
      console.log('⚠️ Connection already in progress, returning existing promise');
      return this.connectionPromise;
    }

    // ✅ Set connection lock
    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },
        debug: (str) => {
          console.log('🔌 WebSocket:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          console.log('✅ WebSocket connected successfully!');
          console.log('📡 Frame:', frame);

          // ✅ Small delay to ensure connection is stable
          setTimeout(() => {
            try {
              console.log('📬 Subscribing to: /user/queue/messages');
              
              const messageSubscription = this.client.subscribe(
                `/user/queue/messages`,
                (message) => {
                  console.log('🎯 RAW MESSAGE RECEIVED FROM BROKER:', message);
                  console.log('📨 Message body:', message.body);
                  console.log('📨 Message headers:', message.headers);

                  const payload = JSON.parse(message.body);
                  console.log('💬 ✅ NEW MESSAGE RECEIVED:', payload);

                  // ✅ Invoke all registered callbacks
                  this.messageCallbacks.forEach(callback => {
                    try {
                      callback(payload);
                    } catch (error) {
                      console.error('❌ Error in message callback:', error);
                    }
                  });
                }
              );

              console.log('✅ Subscribed to messages');
              console.log('📋 Subscription ID:', messageSubscription.id);

              console.log('👍 Subscribing to: /user/queue/swipes');

              const swipeSubscription = this.client.subscribe(
                `/user/queue/swipes`,
                (message) => {
                  console.log('🎯 RAW SWIPE RECEIVED FROM BROKER:', message);

                  const payload = JSON.parse(message.body);
                  console.log('👍 ✅ NEW SWIPE RECEIVED:', payload);

                  // ✅ Invoke all registered callbacks
                  this.swipeCallbacks.forEach(callback => {
                    try {
                      callback(payload);
                    } catch (error) {
                      console.error('❌ Error in swipe callback:', error);
                    }
                  });
                }
              );

              console.log('✅ Subscribed to swipes');
              console.log('📋 Subscription ID:', swipeSubscription.id);

              // ✅ Release connection lock
              this.isConnecting = false;
              resolve();
            } catch (error) {
              console.error('❌ Error during subscription:', error);
              this.isConnecting = false;
              reject(error);
            }
          }, 100);
        },

        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame);
          this.isConnecting = false;
          reject(new Error(frame.headers.message));
        },

        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          this.isConnecting = false;
          reject(event);
        },

        onDisconnect: () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.connectionPromise = null;
        }
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.client) {
      console.log('🔌 Disconnecting WebSocket...');
      this.client.deactivate();
      this.client = null;
      this.isConnecting = false;
      this.connectionPromise = null;
      // ✅ Clear all callbacks
      this.messageCallbacks = [];
      this.swipeCallbacks = [];
    }
  }

  onNewMessage(callback) {
    console.log('📝 Registering message callback');
    this.messageCallbacks.push(callback);
    
    // ✅ Return unsubscribe function
    return () => {
      console.log('🗑️ Unregistering message callback');
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onNewSwipe(callback) {
    console.log('📝 Registering swipe callback');
    this.swipeCallbacks.push(callback);
    
    // ✅ Return unsubscribe function
    return () => {
      console.log('🗑️ Unregistering swipe callback');
      this.swipeCallbacks = this.swipeCallbacks.filter(cb => cb !== callback);
    };
  }
}

// ✅ Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;