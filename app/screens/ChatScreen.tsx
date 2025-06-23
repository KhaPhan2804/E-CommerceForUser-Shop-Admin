import { View, Text, FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import supabase from '../database/supabase';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type navigationProp = NativeStackNavigationProp<ParamList, 'Chat'>;

type ChatRouteProp = RouteProp<ParamList, 'Chat'>;

type Message = {
  id: string;
  room_id: string;  
  sender_role: 'user' | 'shop';  
  sender_id: string;  
  content: string;  
  created_at: string; 
};

export default function ChatScreen() {
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<ChatRouteProp>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const { shop_id, room_id } = route.params;

  const getMaKHFromUserId = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('Khachhang')
        .select('MaKH')
        .eq('userID', userId)
        .single();

      if (error) throw error;

      return data?.MaKH || null;
    } catch (error) {
      console.error('Error fetching MaKH:', error);
      return null;
    }
  };

  const fetchMessages = async () => {
    if (!room_id) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', room_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  

  const fetchMaKH = async () => { 
    const { data: session } = await supabase.auth.getSession();

    const userId = session?.session?.user?.id;
    if (!userId) return;

    setUserId(userId);
  }

  useEffect(() => {
    fetchMaKH();
  }, [shop_id]);

  useEffect(() => {
    if (room_id) {
      fetchMessages();
      const channel = supabase
        .channel(`messages:room_id=eq.${room_id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            sender_role: payload.new.sender_role,
            room_id: payload.new.room_id,
          };

          setMessages((prevMessages) => [...prevMessages, newMessage]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel); 
      };
    }
  }, [room_id]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;

    const maKH = await getMaKHFromUserId(userId);
    if (!maKH) return;

    const senderRole = 'user'; 

    const { error } = await supabase.from('chat_messages').insert([
      {
        room_id: room_id, 
        sender_role: senderRole,
        sender_id: maKH,
        content: newMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.log('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trò chuyện với shop</Text>
    </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.sender_id === userId ? styles.userMessage : styles.shopMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Gửi tin nhắn..."
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
  flex: 1, 
  backgroundColor: 'white' 
 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 10,
    marginBottom: 5,
    borderRadius: 15,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#f1f1f1',
    marginTop: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: 'white',
  },
  shopMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e2e2',
  },
  messageText: { fontSize: 16, color: 'black' },
  timestamp: { fontSize: 12, color: 'gray', textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 10, marginRight: 10 },
  sendButton: {
    backgroundColor: '#111111',
    padding: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goBackButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#efefef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
});
