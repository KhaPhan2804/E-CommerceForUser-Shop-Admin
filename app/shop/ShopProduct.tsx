import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ParamList from '../navigation/Data';


type navigationProp = NativeStackNavigationProp<ParamList, 'ProductSetting'>;


type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  Stock: number;
  Sold: number;
  Watched: number;
  Liked: number;
  status: string; 
};
export default function ShopProduct() {
  const navigation = useNavigation<navigationProp>();
  const [selectedTab, setSelectedTab] = useState('Còn hàng');
  const [product, setProduct] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  
  const route = useRoute();
  const { idShop } = route.params as { idShop: number };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };
  
  const fetchProduct = async (tab: string) => {
    setIsLoading(true);

    let query = supabase.from('Product').select('*').eq('shopId', idShop);
    
    if (tab === 'Còn hàng') {
      query = query.eq('status', 'Instock');
    } else if (tab === 'Hết hàng') {
      query = query.eq('status', 'Outstock');
    } else if (tab === 'Chờ duyệt'){
      query = query.eq('status', 'Pending');
    } else if (tab === 'Vi phạm'){
      query = query.eq('status', 'Violate');
    } else if (tab === 'Đã ẩn'){
      query = query.eq('status', 'Hidden');
    }

    const { data: productData, error: errorData } = await query;

    if (errorData) {
      console.error('Error fetching data from Product', errorData);
      setIsLoading(false);
      return;
    } 

    if(productData){
      setProduct(productData);
      
    }
    setIsLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProduct(selectedTab); 
    }, [selectedTab]) 
  );

  const handleHidden = async (productId: number) => {
    const { error } = await supabase
      .from('Product')
      .update({ status: 'Hidden' })
      .eq('id', productId);
  
      if (error) {
        console.error('Error hiding product:', error);
      } else {
        fetchProduct(selectedTab);
      }
  };

  const handleShow = async (productId: number) => {
    const { error } = await supabase
      .from('Product')
      .update({ status: 'Instock' })
      .eq('id', productId);
  
    if (error) {
      console.error('Error showing product:', error);
    } else {
      fetchProduct(selectedTab);
    }
  };

  const handleDelete = async () => {
    if (selectedProductId === null) return;
    const { error } = await supabase
      .from('Product')
      .delete()
      .eq('id', selectedProductId);
  
    if (error) {
      console.error('Error deleting product:', error);
    } else {
      fetchProduct(selectedTab);
      setModalVisible(false);
    }
  };

  
  
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Sản phẩm của tôi</Text>
        <TouchableOpacity onPress={() => console.log('Search clicked')}>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabHeader}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabContainer}
          style={styles.tabScrollView}
        >
          {['Còn hàng', 'Hết hàng', 'Chờ duyệt', 'Vi phạm', 'Đã ẩn'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, selectedTab === tab && styles.selectedTab]}
              onPress={() => {
                setSelectedTab(tab);
                fetchProduct(tab);
              }}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.selectedTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#111111" />
        ) : product.length > 0 ? (
          product.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.row}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusRowTop}>
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Tồn kho:</Text>
                    <Text style={styles.statusValue}>{item.Stock}</Text>
                  </View>
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Đã bán:</Text>
                    <Text style={styles.statusValue}>{item.Sold}</Text>
                  </View>
                </View>
                <View style={styles.statusRowBottom}>
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Thích:</Text>
                    <Text style={styles.statusValue}>{item.Liked}</Text>
                  </View>
                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Lượt xem:</Text>
                    <Text style={styles.statusValue}>{item.Watched}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={()=> navigation.navigate('ProductSetting',{productId: item.id, idShop: idShop})}>
                  <Text style={styles.buttonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}
                onPress={() => item.status === 'Hidden' ? handleShow(item.id) : handleHidden(item.id)}
                >
                  <Text style={styles.buttonText}>
                    {item.status === 'Hidden' ? 'Hiển thị' : 'Ẩn'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={styles.button}
                onPress={()=>{
                  setSelectedProductId(item.id);
                  setModalVisible(true);
                }}
                > 
                  <Ionicons name="settings-outline" size={18} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noProductText}>Không có sản phẩm nào</Text>
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                navigation.navigate('PriceStock', {productId: selectedProductId})
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalText}>Giá và tồn kho</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Text style={[styles.modalText, { color: 'red' }]}>Xóa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>  
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddProduct",{idShop: idShop})}>
        <Text style={styles.addButtonText}>Thêm 1 sản phẩm mới</Text>
      </TouchableOpacity>
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
    padding: 15,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 50,
  },

  tabHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingTop: 8,
  },
  tabScrollView: {
    marginHorizontal: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 15,
    color: '#888',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  selectedTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#e67e22',
  },

  statusRow: {
    marginBottom: 10,
  },
  statusRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statusRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBox: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#777',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
    marginTop: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 5,
    left: 8,
    right: 8,
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noProductText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
