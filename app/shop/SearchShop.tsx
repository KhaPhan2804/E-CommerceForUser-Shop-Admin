import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ParamList from '../navigation/Data';
import { useRoute, RouteProp } from '@react-navigation/native';

type navigationProp = NativeStackNavigationProp<ParamList, 'SearchShop'>;

type SearchShopRouteProp = RouteProp<ParamList, 'SearchShop'>;

type User = {
  id: string;
} | null;

type SearchHistory = {
  id: string;
  search_term: string;
  search_timestamp: string;
};

export default function SearchShop() {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);  
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<SearchShopRouteProp>();

  const {idShop} = route.params;


  const fetchUserData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('Error fetching session:', error.message);
      setIsLoading(false);
      return;
    }

    if (data?.session?.user) {
      const userData = data.session.user;

      const { data: userProfileData, error: userProfileError } = await supabase
        .from('Khachhang')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (userProfileError) {
        console.log('Error fetching user data from Khachhang:', userProfileError.message);
        setIsLoading(false);
        return;
      }

      if (userProfileData) {
        const userProfile = {
          id: userProfileData.MaKH || '', 
        };

        setUser(userProfile);
        fetchSearchHistory(userProfile.id, 5); 
      }
    }
    setIsLoading(false);
  };

  const fetchSearchHistory = async (userId: string, limit: number) => {

    setIsLoading(true);
    const { data, error } = await supabase
      .from('Searchdata')
      .select('id, search_term, search_timestamp')  
      .eq('makh', userId)
      .eq('search_type','product')
      .eq('shopId', idShop)
      .order('search_timestamp', { ascending: false })  
      .limit(limit);  

    if (error) {
      console.log('Error fetching search history:', error.message);
    } else {
      setSearchHistory(data || []);
    }
    setIsLoading(false);
  };

  const storeSearchData = async () => {
    if (!searchTerm.trim() || !user) {
      return;
    }

    const searchData = {
      makh: user.id,         
      search_term: searchTerm, 
      search_timestamp: new Date().toISOString(),
      search_type: 'product',  
      shopId: idShop,
    };

    const { error } = await supabase
      .from('Searchdata')
      .insert([searchData]);

  
    if (error) {
      console.error('Error storing search data:', error.message);
    } else {
      fetchSearchHistory(user.id, 5);  // Fetch 5 most recent searches after storing
      setSearchTerm(''); 
    }
  };
  

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (isCollapsed) {
      fetchSearchHistory(user?.id || '', 10);  // Fetch 10 when expanding
    } else {
      fetchSearchHistory(user?.id || '', 5);  // Limit back to 5 when collapsing
    }
  };

  const deleteAllSearchHistory = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('Searchdata')
      .delete()
      .eq('makh', user?.id)
      .eq('search_type','product'); 

    if (error) {
      console.error('Error deleting all search history:', error.message);
    } else {
      fetchSearchHistory(user?.id || '', 5);  // Reset to 5 after deleting
      setIsCollapsed(true); 
    }
    setIsLoading(false);
  };

  const handleSearch = () => {
    if(searchTerm.trim()) {
      storeSearchData();  
      navigation.navigate('SearchShopProduct', { searchTerm: searchTerm, idShop });
  }
  };

  const handleSearchTermClick = (term: string) => {
    const searchValue = term || searchTerm;
    if (searchValue.trim()) {
      storeSearchData();
      navigation.navigate('SearchShopProduct', { searchTerm: searchValue, idShop });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <TouchableOpacity
          onPress={() => handleSearch()}
          style={[styles.searchButton, { opacity: searchTerm.trim() ? 1 : 0.5 }]}  
          disabled={!searchTerm.trim()}  
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}

      {!isLoading && (
        <ScrollView style={styles.historyContainer}>
          {searchHistory.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => handleSearchTermClick(item.search_term)}>
              <View style={styles.historyItem}>
                <Text>{item.search_term}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {searchHistory.length >= 5 && (
            <TouchableOpacity onPress={handleCollapseToggle} style={styles.collapseButton}>
              <Text>{isCollapsed ? 'Xem thêm' : 'Thu gọn'}</Text>
            </TouchableOpacity>
          )}

          {!isCollapsed && searchHistory.length > 0 && (
            <TouchableOpacity onPress={deleteAllSearchHistory} style={styles.deleteAllButton}>
              <Text style={styles.deleteText}>Xoá tất cả kết quả tìm kiếm</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.suggestionLabel}>Gợi ý tìm kiếm</Text>
        <ScrollView style={styles.suggestionScrollView}>
          <View style={styles.suggestionItem}>
            <Text>Suggested item 1</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text>Suggested item 2</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text>Suggested item 3</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  historyContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 15,
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 15,
  },
  suggestionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  suggestionScrollView: {
    marginTop: 10,
  },
  suggestionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  deleteText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  collapseButton: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  deleteAllButton: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8d7da',  
    borderRadius: 8,
    marginTop: 10,
  },
});

