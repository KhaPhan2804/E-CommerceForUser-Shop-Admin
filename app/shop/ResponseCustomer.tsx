import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import supabase from '../database/supabase';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type navigationProp = NativeStackNavigationProp<ParamList, 'Response'>;
type ResponseRouteProp = RouteProp<ParamList, 'Response'>;

type ChatRoom = {
  id: number;
  shop_id: string;
  user_id: string;
  created_at: string;
};

type Message = {
  id: number;
  room_id: number;
  content: string;
  created_at: string;
};

export default function ResponseCustomer() {
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<ResponseRouteProp>();
  const { shop_id } = route.params;
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [messages, setMessages] = useState<{ [key: number]: Message | null }>({});
  const [isLoading, setIsLoading] = useState(true); 

  const fetchChatRooms = async () => {
    setIsLoading(true); 
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching chat rooms:', error);
    } else {
      setChatRooms(data);
      data?.forEach((room) => {
        fetchUserName(room.user_id); 
        fetchLatestMessage(room.id);
      });
    }
    setIsLoading(false); 
  };

  const fetchUserName = async (user_id: string) => {
    const { data, error } = await supabase
      .from('Khachhang')
      .select('name')
      .eq('MaKH', user_id)
      .single();

    if (error) {
      console.log('Error fetching user name:', error);
    } else {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [user_id]: data.name,
      }));
    }
  };

  const fetchLatestMessage = async (room_id: number) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', room_id)
      .order('created_at', { ascending: false })
      .limit(1); 

    if (error) {
      console.log('Error fetching latest message:', error);
    } else {
      setMessages((prevMessages) => ({
        ...prevMessages,
        [room_id]: data ? data[0] : null, 
      }));
    }
  };

  const calculateTimeAgo = (createdAt: string) => {
    const now = new Date();
    const messageTime = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours > 0) {
      return `${diffInHours} giờ trước`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} phút trước`;
    } else {
      return `${diffInSeconds} giây trước`;
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [shop_id]);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Trả lời khách hàng</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {chatRooms.map((room) => {
          const latestMessage = messages[room.id];
          return (
          <TouchableOpacity
          key={room.id}
          style={styles.chatRoomCard}
          onPress={() =>
          navigation.navigate('ResponseBox', {
          shop_id: shop_id,
          room_id: room.id,
          })
          }
          >
            <Text style={styles.chatRoomText}>
              {users[room.user_id] || 'Tên khách hàng chưa tải'}
            </Text>

            <Text style={styles.messageText}>
              {latestMessage?.content ?? 'Chưa có tin nhắn'}
            </Text>

            <Text style={styles.subText}>
              {latestMessage?.created_at
              ? calculateTimeAgo(latestMessage.created_at)
              : 'Chưa có thời gian'}
            </Text>
          </TouchableOpacity>
          );
        })}
        </ScrollView>
      )}
    </SafeAreaView>
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
  listContainer: {
    padding: 16,
  },
  headerContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  chatRoomCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  chatRoomText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#666',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
