// FE/src/services/websocketService.js

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.messageCallbacks = [];
    this.swipeCallbacks = [];
    this.conversationCallbacks = []; // ✅ NEW: For 3-way conversation notifications
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  isConnected() {
    return this.client && this.client.connected;
  }

  connect(token, userId) {
    if (this.client && this.client.connected) {
      console.log('⚠️ Already connected to WebSocket');
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('⚠️ Connection already in progress, returning existing promise');
      return this.connectionPromise;
    }

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

          setTimeout(() => {
            try {
              console.log('📬 Subscribing to: /user/queue/messages');
              
              const messageSubscription = this.client.subscribe(
                `/user/queue/messages`,
                (message) => {
                  console.log('🎯 RAW MESSAGE RECEIVED FROM BROKER:', message);
                  const payload = JSON.parse(message.body);
                  console.log('💬 ✅ NEW MESSAGE RECEIVED:', payload);

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
                  console.log('📦 Message body (raw):', message.body);
                  console.log('📋 Message headers:', message.headers);
                  
                  try {
                    const payload = JSON.parse(message.body);
                    console.log('👍 ✅ PARSED SWIPE PAYLOAD:', payload);
                    console.log('📊 Swipe details:', {
                      swipeId: payload.swipeId,
                      swiperId: payload.swiperId,
                      swiperName: payload.swiperName,
                      isMatch: payload.isMatch,
                      type: payload.type
                    });
                    console.log(`🔢 Broadcasting to ${this.swipeCallbacks.length} callback(s)`);

                    if (this.swipeCallbacks.length === 0) {
                      console.warn('⚠️ NO SWIPE CALLBACKS REGISTERED!');
                    }

                    this.swipeCallbacks.forEach((callback, index) => {
                      console.log(`🔄 Executing swipe callback #${index + 1}`);
                      try {
                        callback(payload);
                        console.log(`✅ Callback #${index + 1} executed successfully`);
                      } catch (error) {
                        console.error(`❌ Error in swipe callback #${index + 1}:`, error);
                      }
                    });
                  } catch (error) {
                    console.error('❌ Error parsing swipe message:', error);
                    console.error('📦 Raw body that failed:', message.body);
                  }
                }
              );

              console.log('✅ Subscribed to swipes');
              console.log('📋 Subscription ID:', swipeSubscription.id);

              // ✅ NEW: Subscribe to 3-way conversation notifications
              console.log('🎉 Subscribing to: /user/queue/conversations');

              const conversationSubscription = this.client.subscribe(
                `/user/queue/conversations`,
                (message) => {
                  console.log('🎯 RAW CONVERSATION NOTIFICATION RECEIVED:', message);
                  const payload = JSON.parse(message.body);
                  console.log('🎉 ✅ 3-WAY CONVERSATION CREATED:', payload);

                  this.conversationCallbacks.forEach(callback => {
                    try {
                      callback(payload);
                    } catch (error) {
                      console.error('❌ Error in conversation callback:', error);
                    }
                  });
                }
              );

              console.log('✅ Subscribed to conversations');
              console.log('📋 Subscription ID:', conversationSubscription.id);

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
      this.messageCallbacks = [];
      this.swipeCallbacks = [];
      this.conversationCallbacks = []; // ✅ Clear conversation callbacks
    }
  }

  onNewMessage(callback) {
    console.log('📝 Registering message callback');
    this.messageCallbacks.push(callback);
    
    return () => {
      console.log('🗑️ Unregistering message callback');
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onNewSwipe(callback) {
    console.log('📝 Registering swipe callback');
    this.swipeCallbacks.push(callback);
    
    return () => {
      console.log('🗑️ Unregistering swipe callback');
      this.swipeCallbacks = this.swipeCallbacks.filter(cb => cb !== callback);
    };
  }

  // ✅ NEW: Listen for 3-way conversation notifications
  onConversationNotification(callback) {
    console.log('📝 Registering conversation callback');
    this.conversationCallbacks.push(callback);
    
    return () => {
      console.log('🗑️ Unregistering conversation callback');
      this.conversationCallbacks = this.conversationCallbacks.filter(cb => cb !== callback);
    };
  }
}

const websocketService = new WebSocketService();
export default websocketService;