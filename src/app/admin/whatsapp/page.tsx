"use client";

import { useCallback, useState, useRef, useEffect } from 'react';
import { Container, Button, Input, Textarea, Card } from '@/components/common';
import { format } from 'date-fns';
import { useConversations, useMessages, useSendMessage, useRefreshWhatsApp, useRetryMessage } from '@/hooks/useWhatsApp';
import { useSocket } from '@/hooks/useSocket';

// Types are now imported from the hook file

export default function WhatsAppAdminPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [conversationMessage, setConversationMessage] = useState('');
  
  // Ref for messages container to enable auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'send-message'>('conversations');

  // React Query hooks
  const { 
    data: conversationsData, 
    isLoading: conversationsLoading, 
    error: conversationsError 
  } = useConversations();

  const { 
    data: messagesData, 
    isLoading: messagesLoading, 
    error: messagesError 
  } = useMessages(selectedConversation);

  const sendMessageMutation = useSendMessage();
  const { refreshAll } = useRefreshWhatsApp();
  const { retryMessage } = useRetryMessage();

  // Function to scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);


    // Derived state from React Query
    const conversations = conversationsData?.conversations || [];
    const messages = messagesData?.messages || [];

  const onMessageStatusUpdate = useCallback((data: Record<string, unknown>) => {
    console.log('Message status update received via socket in admin page:', data);
    console.log('Current selected conversation:', selectedConversation);
    console.log('Current messages in UI:', messages.map(msg => ({ 
      message_id: msg.message_id, 
      status: msg.status, 
      isOptimistic: msg.isOptimistic 
    })));
  }, [selectedConversation, messages]);

  // Scroll to bottom when messages change or conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      scrollToBottom();
      // Show scroll button initially when messages load
      setShowScrollButton(true);
    } else if (selectedConversation && messages.length === 0) {
      // Hide scroll button when no messages
      setShowScrollButton(false);
    }
  }, [selectedConversation, messages, scrollToBottom]);

  // Intersection Observer to detect when messagesEndRef is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Hide button when the bottom element is in view
        setShowScrollButton(!entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Add some margin to trigger earlier
      }
    );

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => {
      if (messagesEndRef.current) {
        observer.unobserve(messagesEndRef.current);
      }
    };
  }, [messages]); // Re-run when messages change
 
 
    const { isConnected } = useSocket({
    onNewMessage: (data) => {
      console.log('New message received via socket:', data);
      // Scroll to bottom when new message arrives
      setTimeout(scrollToBottom, 100);
    },
    onMessageStatusUpdate,
  });



  const sendMessage = () => {
    if (!newMessage.trim() || !recipientPhone.trim()) {
      return;
    }

    // Clear input fields immediately for better UX
    const messageToSend = newMessage;
    const phoneToSend = recipientPhone;
    setNewMessage('');
    setRecipientPhone('');

    sendMessageMutation.mutate({
      to: phoneToSend,
      message: messageToSend,
      type: 'text'
    });

    // Scroll to bottom after sending message
    setTimeout(scrollToBottom, 100);
  };

  const sendConversationMessage = () => {
    if (!conversationMessage.trim() || !selectedConversation) {
      return;
    }

    // Clear input field immediately for better UX
    const messageToSend = conversationMessage;
    setConversationMessage('');

    sendMessageMutation.mutate({
      to: selectedConversation,
      message: messageToSend,
      type: 'text'
    });

    // Scroll to bottom after sending message
    setTimeout(scrollToBottom, 100);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.length === 12 && phone.startsWith('91')) {
      return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedConversation && conversationMessage.trim()) {
        sendConversationMessage();
      }
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WhatsApp Communications
          </h1>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button onClick={refreshAll} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'conversations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Conversations
            </button>
            <button
              onClick={() => setActiveTab('send-message')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'send-message'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Send Message
            </button>
          </nav>
        </div>

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Conversations</h2>
                {conversationsLoading ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading conversations...</div>
                ) : conversationsError ? (
                  <div className="text-center py-4 text-red-500 dark:text-red-400">
                    Error loading conversations: {conversationsError.message}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No conversations found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.phone_number}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conversation.phone_number
                            ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                        onClick={() => setSelectedConversation(conversation.phone_number)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {formatPhoneNumber(conversation.phone_number)}
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Only show unread outbound messages count */}
                            {conversation.unread_outbound_count > 0 && (
                              <span 
                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium animate-pulse"
                                title={`${conversation.unread_outbound_count} unread message${conversation.unread_outbound_count > 1 ? 's' : ''} from you`}
                              >
                                {conversation.unread_outbound_count} unread
                              </span>
                            )}
                            {/* Show indicator for inbound messages */}
                            {conversation.last_message_direction === 'inbound' && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {conversation.last_message_direction === 'inbound' ? (
                            <span className="text-green-600 dark:text-green-400">← </span>
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400">→ </span>
                          )}
                          {conversation.last_message_content?.substring(0, 45)}
                          {conversation.last_message_content?.length > 45 ? '...' : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimestamp(conversation.last_message_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Messages */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedConversation 
                      ? `Messages with ${formatPhoneNumber(selectedConversation)}`
                      : 'Select a conversation to view messages'
                    }
                  </h2>
                  {selectedConversation && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Click on a conversation to start messaging
                    </p>
                  )}
                </div>
                {selectedConversation ? (
                  <div className="relative">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messagesLoading ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading messages...</div>
                    ) : messagesError ? (
                      <div className="text-center py-4 text-red-500 dark:text-red-400">
                        Error loading messages: {messagesError.message}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No messages found
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                              message.direction === 'outbound'
                                ? message.status === 'failed' 
                                  ? 'bg-red-500 text-white'
                                  : message.status === 'sending'
                                  ? 'bg-blue-400 text-white opacity-75'
                                  : 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                            <div
                              className={`text-xs mt-1 flex items-center justify-between ${
                                message.direction === 'outbound'
                                  ? 'text-blue-100'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              <span>{formatTimestamp(message.timestamp)}</span>
                              {message.direction === 'outbound' && (
                                <span className="ml-2 flex items-center">
                                  {message.status === 'sending' && (
                                    <span className="text-blue-200 animate-pulse">⏳ Sending...</span>
                                  )}
                                  {message.status === 'sent' && (
                                    <span className="text-green-200">✓</span>
                                  )}
                                  {message.status === 'delivered' && (
                                    <span className="text-green-200">✓✓</span>
                                  )}
                                  {message.status === 'read' && (
                                    <span className="text-green-200">✓✓✓</span>
                                  )}
                                  {message.status === 'failed' && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-red-200">✗ Failed</span>
                                      <button
                                        onClick={() => retryMessage(message)}
                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                                        title="Retry sending message"
                                      >
                                        Retry
                                      </button>
                                    </div>
                                  )}
                                  {message.isOptimistic && (
                                    <span className="text-blue-200 text-xs ml-1">(pending)</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        ))}
                        {/* Scroll target element */}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                    </div>
                    {/* Scroll to bottom button - only show when not at bottom */}
                    {showScrollButton && (
                      <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all duration-300 ease-in-out"
                        title="Scroll to bottom"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Select a conversation from the list to view messages
                  </div>
                )}
                
                {/* Message Input for 2-way communication */}
                {selectedConversation && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                          value={conversationMessage}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConversationMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <Button 
                        onClick={sendConversationMessage} 
                        disabled={!conversationMessage.trim()}
                        className="self-end"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Send Message Tab */}
        {activeTab === 'send-message' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Send New Message</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number (e.g., 9876543210 or +919876543210)"
                    value={recipientPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipientPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || !recipientPhone.trim()}
                  className="w-full"
                >
                  Send Message
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}
