import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamList } from '../navigation/Data';
import { authenticate } from '../slices/authSlices';
import supabase from '../database/supabase';
import Icon from 'react-native-vector-icons/FontAwesome';

type navigationProp = NativeStackNavigationProp<ParamList, 'Login'>;

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<navigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); 

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu!');
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Sai email hoặc mật khẩu');
        return;
      }

      if (!data?.user?.email_confirmed_at) {
        setError('Vui lòng xác nhận email của bạn trước khi đăng nhập!');
        return;
      }
      const { data: userData, error: userError } = await supabase
      .from('Khachhang') 
      .select('roleID') 
      .eq('email', email) 
      .single();

      if (userError || !userData) {
        setError('Không thể lấy thông tin người dùng');
        return;
      }

      dispatch(
        authenticate({
          token: data.session?.access_token || '',
          userData: data.user,
        })
      );
      if (userData.roleID === 1) {
        navigation.navigate('Main');
      } else if (userData.roleID === 2) {
        navigation.navigate('Admin'); 
      } else {
        setError('Vai trò người dùng không xác định.');
      }
    } catch (err) {
      setError('Đăng nhập không thành công. Vui lòng thử lại!');
    }
  };

  return (
    <View style={style.container}>
      <View style={style.titleContainer}>
        <Image source={require('../image/eve.png')} style={style.icon} />
        <Text style={style.title}>Đăng nhập</Text>
      </View>

      <View style={style.inputContainer}>
        <Icon name="envelope" size={20} color="#888" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={style.inputContainer}>
        <Icon name="lock" size={20} color="#888" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword} 
        />
        <TouchableOpacity
          style={style.showPasswordButton}
          onPress={() => setShowPassword(prevState => !prevState)} 
        >
          <Icon name={showPassword ? "eye" : "eye-slash"} size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {error ? <Text style={style.errorText}>{error}</Text> : null}

      <TouchableOpacity style={style.button} onPress={handleLogin}>
        <Text style={style.buttonText}>Đăng nhập</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={style.registerText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',  
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 90,
    height: 90,
    marginBottom: 15,
    borderRadius: 10,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingLeft: 15,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',  
  },
  inputIcon: {
    marginRight: 10,
  },
  showPasswordButton: {
    padding: 5, 
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#111111', 
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#6C6C6C',
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: '#FF4C4C',
    marginBottom: 15,
    fontSize: 14,
  },
});
