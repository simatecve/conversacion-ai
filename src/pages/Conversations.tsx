import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ConversationList from '@/components/conversations/ConversationList';
import ChatArea from '@/components/conversations/ChatArea';
import { useConversations, useMessages, useSearchConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { useEffectiveUserId } from '@/hooks/useEffectiveUserId';
import { Database } from '@/integrations/supabase/types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

const Conversations = () => {
  const { user } = useAuth();
  const { effectiveUserId } = useEffectiveUserId();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Hooks para gestionar datos
  const { conversations, isLoading, unreadCount, markAsRead } = useConversations();
  const { data: searchResults } = useSearchConversations(searchTerm);
  const { messages, sendMessage, isSending } = useMessages(selectedConversation?.id || null);

  // Determinar qué conversaciones mostrar
  const displayConversations = searchTerm ? (searchResults || []) : conversations;

  // Manejar selección de conversación
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.unread_count && conversation.unread_count > 0) {
      markAsRead(conversation.id);
    }
  };

  // Manejar envío de mensaje
  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedConversation || !effectiveUserId) return;

    sendMessage({
      conversation_id: selectedConversation.id,
      message: messageText.trim(),
      direction: 'outgoing',
      whatsapp_number: selectedConversation.whatsapp_number,
      instance_name: selectedConversation.instance_name || '',
      user_id: effectiveUserId,
      message_type: 'text',
      is_bot: false,
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full bg-background">
        <ConversationList
          conversations={displayConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
          unreadCount={unreadCount}
        />
        
        <ChatArea
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>
    </AppLayout>
  );
};

export default Conversations;