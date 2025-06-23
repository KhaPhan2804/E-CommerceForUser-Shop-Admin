import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import supabase from '../database/supabase';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
  
type navigationProp = NativeStackNavigationProp<ParamList, 'ChatBox'>;
type ChatBoxRouteProp = RouteProp<ParamList, 'ChatBox'>;

  
type Message = {
    id: number;
    created_at: string;
    room_id: number;
    sender_role: 'user' | 'shop';
    sender_id: number;
    content: string;
};

export default function ChatBox() {
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<ChatBoxRouteProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [shopID, setShopID] = useState<number>(0);
  const [shopName, setShopName] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const {MaKH, room_id} = route.params;

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', room_id)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const fetchShopID = async () => {
    const {data, error} = await supabase
    .from('chat_rooms')
    .select('shop_id')
    .eq('id', room_id)
    .single();
    if(error){
      console.error("Error to fetch MaKH");
      setIsLoading(false); 
    }
    else{
      setShopID(data.shop_id);
      fetchShopName(data.shop_id);
    }
  }

  const fetchShopName = async (shop_id: number) => {
    const {data, error} = await supabase
    .from('shop')
    .select('shopname')
    .eq('id', shop_id) 
    .single();
    if(error){
      console.error("Error to fetch user name");
      setIsLoading(false); 
    }
    else{
      setShopName(data.shopname); 
      setIsLoading(false); 
    }
  }

  useEffect(() => {
    fetchShopID();
    fetchMessages();

    const channel = supabase
      .channel(`messages:room_id=eq.${room_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.room_id === room_id) {
          setMessages((prev) => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room_id]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await supabase.from('chat_messages').insert([{
      room_id,
      sender_id: MaKH,
      sender_role: 'user',
      content: newMessage,
      created_at: new Date().toISOString(),
    }]);

    setNewMessage('');
  };

  return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
          keyboardVerticalOffset={80}
        >
          <View>
            {isLoading ? (
              <ActivityIndicator size="large" color="#111111" />
            ) : (
              <View style={styles.headerField}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.header}>{shopName}</Text>
              </View>
            )}
          </View>
    
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollRef}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.sender_role === 'user' ? styles.shopMessage : styles.userMessage,
                ]}
              >
                <Text style={styles.messageText}>{msg.content}</Text>
                <Text style={styles.timestamp}>{new Date(msg.created_at).toLocaleTimeString()}</Text>
              </View>
            ))}
          </ScrollView>
    
          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Nhập tin nhắn..."
              style={styles.input}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 10);
              }}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }
    
    const styles = StyleSheet.create({
      container: { 
        flex: 1,
        backgroundColor: '#f8f9fa', 
      },
      goBackButton: {
        padding: 10,
        borderRadius: 50,
        backgroundColor: '#efefef',
      },
      header: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
      },
      messagesContainer: {
        flex: 1,
        paddingHorizontal: 12,
      },
      headerField:{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        justifyContent: 'space-between',
      },
      messageBubble: {
        padding: 10,
        borderRadius: 10,
        marginVertical: 6,
        maxWidth: '75%',
      },
      shopMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007bff',
      },
      userMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#b0b0b0',
      },
      messageText: {
        color: 'white',
        fontSize: 16,
      },
      timestamp: {
        fontSize: 10,
        color: '#ddd',
        marginTop: 4,
        textAlign: 'right',
      },
      inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#f8f8f8',
      },
      input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
      },
      sendButton: {
        backgroundColor: '#007bff',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
      },
    });
  