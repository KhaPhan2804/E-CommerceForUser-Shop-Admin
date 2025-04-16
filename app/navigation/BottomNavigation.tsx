import { View, Text, Platform, Image } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import icons from "../themes/icon";
import { COLORS, bgColor, themeColors } from '../themes/index';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';


const Tab = createBottomTabNavigator();

export default function BottomNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          height: Platform.OS == "ios" ? 60 : 42,
          backgroundColor: '#D1D1D1', 
          borderTopWidth: 1, 
          borderColor: '#E0E0E0', 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1, 
          shadowRadius: 10,
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? icons.home : icons.homeOutline}
              resizeMode="contain"
              style={{
                height: 22,
                width: 22,
                tintColor: focused ? COLORS.primary : '#FFFFFF', 
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? icons.user : icons.userOutline}
              resizeMode="contain"
              style={{
                height: 22,
                width: 22,
                tintColor: focused ? COLORS.primary : '#FFFFFF', 
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
