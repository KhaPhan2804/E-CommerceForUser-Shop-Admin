
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import CartScreen from '../screens/CartScreen';
import BottomNavigation from './BottomNavigation';

import  ParamList from './Data';
import OrderScreen from '../screens/OrderScreen';
import CategoryScreen from '../screens/CategoryScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EditScreen from '../screens/EditScreen';

import PurchaseScreen from '../screens/PurchaseScreen';

import DrawerNavigation from './DrawerNavigation';
import DeliveryScreen from '../screens/DeliveryScreen';
import UpdateAccount from '../shop/UpdateAccount';
import ShopSetting from '../shop/ShopSetting';
import ShopInterface from '../shop/ShopInterface';
import SearchScreen from '../screens/SearchScreen';
import SearchProduct from '../screens/SearchProduct';
import ShopProduct from '../shop/ShopProduct';
import ProductSetting from '../shop/ProductSetting';
import CategorySetting from '../shop/CategorySetting';
import ShippingFee from '../shop/ShippingFee';
import AddProduct from '../shop/AddProduct';
import ProductScreen from '../screens/ProductScreen';
import PriceStock from '../shop/PriceStock';
import AfterOrderScreen from '../screens/AfterOrderScreen';
import PendingScreen from '../screens/PendingScreen';
import SupplyScreen from '../screens/SupplyScreen';
import ShippingScreen from '../screens/ShippingScreen';
import RatingScreen from '../screens/RatingScreen';
import AcceptPending from '../shop/AcceptPending';
import Supplying from '../shop/Supplying';
import Canceling from '../shop/Canceling';
import Rating from '../shop/Rating';
import FullPackage from '../shop/FullPackage';
import HistoryScreen from '../screens/HistoryScreen';
import SearchShop from '../shop/SearchShop';
import SearchShopProduct from '../shop/SearchShopProduct';
import ShopSale from '../shop/ShopSale';
import PaymentConfirm from '../screens/PaymentConfirm';
import PaymentAccept from '../screens/PaymentAccept';
import PaymentCancel from '../screens/PaymentCancel';

const Stack = createNativeStackNavigator<ParamList>();



export default function AppNavigation() {
  return (
    <Stack.Navigator screenOptions={{headerShown:false}} initialRouteName='Main' >
      <Stack.Screen name="Main" component={BottomNavigation} />
      <Stack.Screen name="Cart" options={{presentation: 'modal'}} component={CartScreen} />
      <Stack.Screen name="Order" component={OrderScreen}/>
      <Stack.Screen name="Category" component={CategoryScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Edit" component={EditScreen} />
      <Stack.Screen name="Purchase" component={PurchaseScreen}/>
      <Stack.Screen name="Admin" component={DrawerNavigation}/>
      <Stack.Screen name="Delivery" component={DeliveryScreen}/>
      <Stack.Screen name="Shop" component={UpdateAccount}/>
      <Stack.Screen name="ShopSetting" component={ShopSetting}/>
      <Stack.Screen name="ShopInterface" component={ShopInterface}/>
      <Stack.Screen name="SearchUser" component={SearchScreen}/>
      <Stack.Screen name="SearchProduct" component={SearchProduct}/>
      <Stack.Screen name="ShopProduct" component={ShopProduct}/>
      <Stack.Screen name="ProductSetting" component={ProductSetting}/>
      <Stack.Screen name="CategorySetting" component={CategorySetting}/>
      <Stack.Screen name="ShippingFee" component={ShippingFee}/>
      <Stack.Screen name="AddProduct" component={AddProduct}/>
      <Stack.Screen name="Product" component={ProductScreen}/>
      <Stack.Screen name="PriceStock" component={PriceStock}/>
      <Stack.Screen name="AfterOrder" component={AfterOrderScreen}/>
      <Stack.Screen name="Pending" component={PendingScreen}/>
      <Stack.Screen name="AcceptPending" component={AcceptPending}/>
      <Stack.Screen name="Supply" component={SupplyScreen}/>
      <Stack.Screen name="Supplying" component={Supplying}/>
      <Stack.Screen name="Ship" component={ShippingScreen}/>
      <Stack.Screen name="Rating" component={RatingScreen}/>
      <Stack.Screen name="History" component={HistoryScreen}/>
      <Stack.Screen name="Cancel" component={Canceling}/>
      <Stack.Screen name="RatingTotal" component={Rating}/>
      <Stack.Screen name="FullPackage" component={FullPackage}/>
      <Stack.Screen name="SearchShop" component={SearchShop}/>
      <Stack.Screen name="SearchShopProduct" component={SearchShopProduct}/>
      <Stack.Screen name="ShopSale" component={ShopSale}/>
      <Stack.Screen name="Payment" component={PaymentConfirm}/>
      <Stack.Screen name="PaymentAccept" component={PaymentAccept}/>
      <Stack.Screen name="PaymentCancel" component={PaymentCancel}/>
    </Stack.Navigator>
  )
}