import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ParamList from '../navigation/Data';
import { useFocusEffect } from 'expo-router';

type navigationProp = NativeStackNavigationProp<ParamList, 'ShopSetting'>;


type OrderData = {
  status: string;
  count: number;
};


type Shop = {
  id: number,
  shopname: string,
  shopavatar: string, 
  statusShop: number,
} | null;

export default function UpdateAccount() {
  const navigation = useNavigation<navigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Shop>(null);
  const [statusShop, setStatusShop] = useState(null);
  const [shopName, setShopName] = useState("");
  const [idShop, setID] = useState<number>(0);
  const [orderCounts, setOrderCounts] = useState({ confirm: 0, processing: 0, canceled: 0, rated: 0 });
  

  const fetchShopData = async () => {
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
  
      const { data: shopData, error: shopError } = await supabase
      .from('shop')
      .select('*')
      .eq('makh', userProfileData.MaKH)
      .single();
  
      if (shopError) {
        console.log('Error fetching shop data from shop table:', shopError.message);
        setIsLoading(false);
        return;
      }
  
      if(shopData) {
        setUser({
          id: shopData.id,
          shopname: shopData.shopname,
          shopavatar: shopData.shopavatar,
          statusShop: shopData.statusShop,
        });
        setStatusShop(shopData.statusShop);
        setShopName(shopData.shopname);
        setID(Number(shopData.id));
      }


      const orderStatuses = ['Đợi xác nhận', 'Chuẩn bị hàng', 'Đã hủy', 'Đánh giá'];

    const counts = {
      confirm: 0,
      processing: 0,
      canceled: 0,
      rated: 0,
    };

    for (let status of orderStatuses) {
      const { data: orderData, error: orderError } = await supabase
      .from('Donhang')  // Assuming the table name is 'orders'
      .select('status')
      .eq('status', status)
      .eq('shopId', shopData.id);

      if (orderError) {
        console.log(`Error fetching order data for status ${status}:`, orderError.message);
        setIsLoading(false);
        return;
      }

      const statusCount = orderData ? orderData.length : 0;

      if (status === 'Đợi xác nhận') counts.confirm = statusCount;
      if (status === 'Chuẩn bị hàng') counts.processing = statusCount;
      if (status === 'Đã hủy') counts.canceled = statusCount;
      if (status === 'Đánh giá') counts.rated = statusCount;
    }

    setOrderCounts(counts);
    }
    setIsLoading(false);
  };
  
  const updateStatus = async () => {
    if (statusShop === 0) {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session?.user) {
        console.log("Error fetching session:", error?.message);
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
        const { error: updateError } = await supabase
        .from("shop")
        .update({ statusShop: 1 })
        .eq("makh", userProfileData.MaKH);

        if (updateError) {
          Alert.alert("Kích hoạt shop không thành công", "Vui lòng thử lại");
          setIsLoading(false);
          return;
        }
        fetchShopData();
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchShopData();
    }, []) 
  );

  
  
  const handleHistory = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('FullPackage', { idShop }); 
  }
  const handlePending = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('Supplying', { idShop }); 
  }
  const handleCancel = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('Cancel', { idShop }); 
  }
  const handleRating = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('RatingTotal', { idShop }); 
  }

  const handleProduct = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('ShopProduct', { idShop }); 
  };

  const handleAccept = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('AcceptPending', { idShop }); 
  };
  
  const handleMarket = () => {
    if (idShop === null) {
      console.error("Error: idShop is null");
      Alert.alert("Lỗi", "Không tìm thấy ID của shop.");
      return;
    }
    navigation.navigate('ShopSale', { idShop }); 
  }
  const handlePerformance = () => {
    console.log("RatingInterface");
  }
  const handleMarketing = () => {
    console.log("RatingInterface");
  }
  const handleSupport = () => {
    console.log("RatingInterface");
  }
  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.header}>Shop của tôi</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={()=>navigation.navigate('ShopSetting',{idShop})}>
           <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>   
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#333" style={styles.loader} />
      ) : (
        <View style={styles.content}>
          {statusShop === 0 ? (
            <TouchableOpacity style={styles.button} onPress={updateStatus}>
              <Ionicons name="storefront-outline" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Kích hoạt shop</Text>
            </TouchableOpacity>
          ) : (
            <>
            <View style={styles.shopCard}>
              <View style={styles.shopRow}>
                {user?.shopavatar ? (
                  <Image source={{ uri: user.shopavatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-circle" size={50} color="#ccc"  />
                )}
                <Text style={styles.shopName}>{shopName}</Text>
                <TouchableOpacity style={styles.viewShopButton} onPress={()=>navigation.navigate('ShopInterface',{idShop})}>
                  <Ionicons name="file-tray-outline" size={18} color="#FFF" />
                  <Text style={styles.viewShopButtonText}>Xem Shop</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderText}>Đơn hàng</Text>
                <TouchableOpacity style={styles.statusButtonHistory} onPress={handleHistory}>
                  <Text style={styles.orderText}>Lịch sử đơn hàng </Text>
                  <Ionicons name="chevron-forward-outline" size={13} color="#11111"  style={styles.iconCardDon}/>
                </TouchableOpacity>
              </View>
              <View style={styles.statusRow}>

                <TouchableOpacity style={styles.statusButton} onPress={handleAccept}>
                  <Text style={styles.statusText}>Chờ xác nhận</Text>
                  <Text style={styles.statusNumber}>{orderCounts.confirm}</Text> 
                </TouchableOpacity>

                <TouchableOpacity style={styles.statusButton} onPress={handlePending}>
                  <Text style={styles.statusText}>Chờ xử lý</Text>
                  <Text style={styles.statusNumber}>{orderCounts.processing}</Text> 
                </TouchableOpacity>

                
                <TouchableOpacity style={styles.statusButton} onPress={handleCancel}>
                  <Text style={styles.statusText}>Đã hủy</Text>
                  <Text style={styles.statusNumber}>{orderCounts.canceled}</Text> 
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={handleRating}>
                  <Text style={styles.statusText}>Đánh giá</Text>
                  <Text style={styles.statusNumber}>{orderCounts.rated}</Text> 
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.performanceCard}>
              <View style={styles.statusRow}> 
                <TouchableOpacity style={styles.performanceButton} onPress={handleProduct}>
                  <Ionicons name="cube-outline" size={20} color="#333" />
                  <Text style={styles.performanceText}>Sản phẩm</Text>
                </TouchableOpacity>
    
                <TouchableOpacity style={styles.performanceButton} onPress={handleMarket}>
                  <Ionicons name="bar-chart-outline" size={20} color="#333" />
                  <Text style={styles.performanceText}>Doanh thu</Text>
                </TouchableOpacity>
    
                <TouchableOpacity style={styles.performanceButton} onPress={handlePerformance}>
                  <Ionicons name="rocket-outline" size={20} color="#333" />
                  <Text style={styles.performanceText}>Hiệu quả</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statusRow}> 
                <TouchableOpacity style={styles.performanceButton} onPress={handleMarketing}>
                  <Ionicons name="pricetag-outline" size={20} color="#333" />
                  <Text style={styles.performanceText}>Marketing</Text>
                </TouchableOpacity>
    
                <TouchableOpacity style={styles.performanceButton} onPress={handleSupport}>
                  <Ionicons name="megaphone-outline" size={20} color="#333" />
                  <Text style={styles.performanceText}>Hỗ trợ</Text>
                </TouchableOpacity>
              </View>
            </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "100%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "absolute",
    top: 0,
    left: 0,
  },
  performanceCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    width: "95%",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  
  performanceButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    paddingVertical: 10,
    width: 100,
    borderRadius: 10,
  },
  
  performanceText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
    color: "#0066FF",
  },
  
  goBackButton: {
    marginRight: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  loader: {
    marginTop: 100,
  },
  content: {
    marginTop: 80,
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginTop: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  settingsButton: {
    marginLeft: "auto",
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    width: "95%",
    marginTop: 10,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  icon: {
    marginRight: 5,
  },
  
  shopCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginTop: -10,
    width: "95%",
  },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  viewShopButton: {
    flexDirection: "row",
    alignItems: "center",  
    backgroundColor: "#111111",
    paddingVertical: 8,
    paddingHorizontal: 12, 
    borderRadius: 8,
  },
  viewShopButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 3, 
  },
  orderText: {
    fontSize: 15,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  statusButton: {
    alignItems: "center",
    justifyContent: "center", 
    borderRadius: 12, 
    backgroundColor: "#f8f8f8",
    width: 75, 
    paddingVertical: 12, 
    paddingHorizontal: 10, 
  },
  
  statusButtonHistory: {
    flexDirection: "row",
    alignItems: "center", 
    borderRadius: 10,
    width: 100,
    paddingVertical: 2, 
    paddingHorizontal: 5,
  },
  iconCardDon: {
    marginLeft: -3, 
  },
  statusText: {
    fontSize: 10,
  },
  statusNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0066FF",
  },
});
