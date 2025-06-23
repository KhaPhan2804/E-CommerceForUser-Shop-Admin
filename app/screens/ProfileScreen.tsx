import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ParamList } from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import supabase from '../database/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

type User = {
  MaKH: number;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  address: string;
  password: string; 
  setShop: number;
} | null;

type navigationProp = NativeStackNavigationProp<ParamList, 'Login'>;

export default function ProfileScreen() {
  const [user, setUser] = useState<User>(null);
  const navigation = useNavigation<navigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [statusShop, setStatusShop] = useState<number>(0);
  const [MaKH, setMaKH] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [supplyOrdersCount, setSupplyOrdersCount] = useState(0);
  const [shippingOrdersCount, setShippingOrdersCount] = useState(0);
  const [ratingOrdersCount, setRatingOrdersCount] = useState(0);


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
        const avatarUrl = userProfileData.avatar || <Ionicons name="person-circle-sharp" size={24} color="black" />;

        const userProfile = {
          MaKH: userProfileData.MaKH,
          name: userProfileData.name ,
          email: userProfileData.email ,
          avatar: avatarUrl,
          phone: userProfileData.phone ,
          address: userProfileData.address ,
          password: userProfileData.password , 
          setShop: userProfileData.setShop,
        };
        setUser(userProfile);
        setMaKH(userProfile.MaKH);

        if(userProfile.setShop === 1){
          fetchShopData(userProfileData.MaKH);
        }
      }
    }
    setIsLoading(false);
  };

  const fetchShopData = async (makh: string) => {
    setIsLoading(true);

    const { data: shopData, error: shopError } = await supabase
      .from('shop')
      .select('*')
      .eq('makh', makh)
      .single();

    if (shopError) {
      console.log('Error fetching shop data from shop table:', shopError.message);
      setIsLoading(false);
      return;
    }
    if(shopData){
      setStatusShop(shopData.statusShop);
    } else {
      setStatusShop(0);
    }

    setIsLoading(false);
  }

  const fetchOrdersCount = async () => {

    const { data: PendingData, error: PendingError } = await supabase
      .from('Donhang')
      .select('id')
      .eq('MaKH', MaKH)
      .eq('status', 'Đợi xác nhận');  

    if (PendingError) {
      console.log('Error fetching pending orders:', PendingError.message);
      return;
    }

    if (PendingData) {
      setPendingOrdersCount(PendingData.length);
    }

    const { data: ShippingData, error: ShippingError } = await supabase
      .from('Donhang')
      .select('id')
      .eq('MaKH', MaKH)
      .eq('status', 'Hàng đang được giao');  

    if (ShippingError) {
      console.log('Error fetching pending orders:', ShippingError.message);
      return;
    }

    if (ShippingData) {
      setShippingOrdersCount(ShippingData.length);
    }

    const { data: SupplyData, error: SupplyError } = await supabase
      .from('Donhang')
      .select('id')
      .eq('MaKH', MaKH)
      .eq('status', 'Chuẩn bị hàng');  

    if (SupplyError) {
      console.log('Error fetching pending orders:', SupplyError.message);
      return;
    }

    if (SupplyData) {
      setSupplyOrdersCount(SupplyData.length);
    }


    const { data: RatingData, error: RatingError } = await supabase
      .from('Donhang')
      .select('id')
      .eq('MaKH', MaKH)
      .eq('status', 'Đánh giá');  

    if (RatingError) {
      console.log('Error fetching pending orders:', RatingError.message);
      return;
    }

    if (RatingData) {
      setRatingOrdersCount(RatingData.length);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchOrdersCount();
    }, [MaKH])
  );


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigation.navigate('Login');
  };

  const handleEditProfile = () => {
    if (user) {
      navigation.navigate('Edit', {
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        address: user.address || '',
        password: user.password || '',
      });
    }
  };


  const handleRegisterShop = async () => {
    if (user) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('Khachhang')
          .select('MaKH')
          .eq('email', user.email)
          .single();
  
        if (userError) {
          throw new Error(userError.message);
        }
  
        if (user.setShop === 0) {
          const { data, error } = await supabase
            .from('shop')
            .insert([{
              shopname: user.name,
              shopavatar: user.avatar,
              rating: 0,
              followers: 0,
              makh: userData.MaKH,
              statusShop: 0, 
            }]);
  
          if (error) {
            throw new Error(error.message);
          }
  

          const { error: updateError } = await supabase
          .from('Khachhang')
          .update({ setShop: 1 })
          .eq('MaKH', userData.MaKH);
  
          if (updateError) {
            throw new Error(updateError.message);
          }
  
          console.log("Shop registered successfully.");
          navigation.navigate('Shop');
        } 
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error during shop registration:', err.message);
        }
      }
    }
  };
  

  const handleGoToMyShop = async () => {
    navigation.navigate('Shop');
  };


  

  const handleSupport = () => {
    console.log("Support Screen");
  };
  const handlePrivcy = () => {
    console.log("Privcy Screen");
  };

  return (
    <ScrollView style={styles.container}>
      {isLoading ? ( 
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#111111"  />
        </View>
      ) : user ? (
        <>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar}
                style={styles.profilePicture}
              />
              <TouchableOpacity style={styles.editIcon} onPress={handleEditProfile}>
                <Ionicons name="pencil-outline" size={15} color="#FFF"/>
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{user.name}</Text>
            </View>
            {user.setShop === 1 ? (
              <TouchableOpacity style={styles.registerButton} onPress={handleGoToMyShop}>
                <Ionicons name="storefront-outline" size={15} color="#FFF" />
                <Text style={styles.registerButtonText}>Shop của bạn</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.registerButton} onPress={handleRegisterShop}>
                <Ionicons name="pricetags-outline" size={15} color="#FFF"/>
                <Text style={styles.registerButtonText}>Đăng ký bán hàng</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.card}>
              <View style={styles.orderRow}>
                <Text style={styles.buttonTextLabel}>Đơn hàng</Text>
                
                <TouchableOpacity style={styles.statusButtonHistory} onPress={()=>navigation.navigate('History',{MaKH: MaKH})}>
                  <Text style={styles.buttonTextLabel}>Lịch sử mua hàng</Text>
                  <Ionicons name="chevron-forward-outline" size={13} color="#11111"  style={styles.iconCardDon}/>
                </TouchableOpacity>
              </View>
              <View style={styles.statusRow}>
                <TouchableOpacity style={styles.statusButton} onPress={()=>navigation.navigate('Pending',{MaKH: MaKH})}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="wallet-outline" size={15} color="black" />
                    <Text style={styles.statusText}>Chờ xác nhận</Text>
                    {pendingOrdersCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{pendingOrdersCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={()=>navigation.navigate('Supply',{MaKH: MaKH})}>
                  <View style={styles.iconContainer}>
                  <Ionicons name="file-tray-stacked-outline" size={15} color="black" />
                  <Text style={styles.statusText}>Chờ lấy hàng</Text>
                  {supplyOrdersCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{supplyOrdersCount}</Text>
                      </View>
                  )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={()=>navigation.navigate('Ship',{MaKH: MaKH})}>
                  <View style={styles.iconContainer}>
                  <Ionicons name="car-outline" size={15} color="black" />
                  <Text style={styles.statusText}>Chờ giao hàng</Text>
                  {shippingOrdersCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{shippingOrdersCount}</Text>
                      </View>
                  )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={()=>navigation.navigate('Rating',{MaKH: MaKH})}>
                  <View style={styles.iconContainer}>
                  <Ionicons name="star-outline" size={15} color="black" />
                  <Text style={styles.statusText}>Đánh giá</Text>
                  {ratingOrdersCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{ratingOrdersCount}</Text>
                      </View>
                  )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.body}>
            <Text style={styles.sectionTitle}>Hỗ trợ</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardContent} onPress={handleSupport}>
                <Ionicons name="people-outline" size={24} color="black" />
                <Text style={styles.buttonText}>Hỗ trợ người dùng</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardContent} onPress={handlePrivcy}>
                <Ionicons name="library-outline" size={24} color="black" />
                <Text style={styles.buttonText}>Chính sách</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardContent} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="black" />
                <Text style={styles.buttonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.blankState}>
          <Image source={require('../image/eve.png')} style={styles.blankAvatar} />
          <Text style={styles.message}>Đăng nhập để bắt đầu mua sắm</Text>
          <View style={styles.card1}>
            <TouchableOpacity style={styles.cardContent} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={24} color="black" />
              <Text style={styles.buttonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card1}>
            <TouchableOpacity style={styles.cardContent} onPress={() => navigation.navigate('Register')}>
              <Ionicons name="download-outline" size={24} color="black" />
              <Text style={styles.buttonText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2', 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  badge: {
    position: 'absolute',
    top: -9, 
    right: 5, 
    backgroundColor: '#FF0000', 
    borderRadius: 13, 
    width: 12, 
    height: 12, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 15, 
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 500, 
  },
  editIcon: {
    position: 'absolute',
    bottom: -5, 
    right: 10, 
    backgroundColor: '#111111',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16, 
    fontWeight: '600', 
    marginVertical: 10,
    color: '#333', 
  },
  card: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 20, 
    marginVertical: 8, 
    shadowColor: '#000',
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4, 
    borderWidth: 0.5, 
    borderColor: '#E0E0E0', 
    width: '110%', 
    alignSelf: 'center',
  },
  card1: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 15, 
    marginVertical: 8, 
    shadowColor: '#000',
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4, 
    borderWidth: 0.5, 
    borderColor: '#E0E0E0', 
    width: '90%', 
    alignSelf: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: {
    marginLeft: 10,
  },
  buttonText: {
    color: '#0066FF', 
    fontSize: 16,
    fontWeight: '600', 
  },
  buttonTextLabel: {
    color: '#11111', 
    fontSize: 16,
    fontWeight: '600', 
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',  
    marginTop: 10,     
  },
  registerButton: {
    backgroundColor: '#111111', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    width: '22%',      
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,  
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 5,
  },
  blankState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 100,
  },
  blankAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 10,
  },
  statusButtonHistory: {
    flexDirection: "row",
    alignItems: "center", 
    borderRadius: 10,
    width: 100,
    paddingVertical: 2, 
    paddingHorizontal: 5,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconCardDon: {
    marginLeft: -1,
  },
});
