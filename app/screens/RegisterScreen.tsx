import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamList } from '../navigation/Data';
import { authenticate } from '../slices/authSlices';
import supabase from '../database/supabase';
import Icon from 'react-native-vector-icons/FontAwesome'; 

type navigationProp = NativeStackNavigationProp<ParamList, 'Register'>;
const defaultAvatarUrl = 'https://njulzxtvzglbrsxdgbcq.supabase.co/storage/v1/object/public/avatars/avatars/273457c6-7645-41dc-91fe-092681be0422_1735552167255_5135kaalf3f.jpg';


export default function RegisterScreen() {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const navigation = useNavigation<navigationProp>();
  

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    setError('');

    if (!name || !email || !password || !phone || !address) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email không hợp lệ!');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp!');
      return;
    }

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('Khachhang')
        .select('email')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        setError('Lỗi kiểm tra email, vui lòng thử lại!');
        return;
      }

      if (existingUser) {
        setError('Email này đã được sử dụng. Vui lòng sử dụng email khác.');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || 'Đăng ký không thành công!');
        return;
      }
      


      if (!data || !data.user) {
        setError('Có lỗi xảy ra khi tạo người dùng');
        return;
      }

      const { data: userData, error: insertError } = await supabase
        .from('Khachhang')
        .insert([{
          name,
          email,
          phone,
          password,
          address,
          roleID: 1,
          userID: data.user.id,
          avatar: defaultAvatarUrl,
        }]);

      if (insertError) {
        console.log('Insert error:', insertError);
        setError('Đã xảy ra lỗi khi lưu thông tin người dùng!');
        return;
      }

      dispatch(
        authenticate({
          token: data.session?.access_token || '',
          userData: data.user,
        })
      );

      navigation.navigate('Login');
    } catch (err) {
      setError('Đăng ký không thành công. Vui lòng thử lại!');
    }
  };

  return (
    <View style={style.container}>
      <View style={style.titleContainer}>
        <Image source={require('../image/eve.png')} style={style.icon} />
        <Text style={style.title}>Đăng ký tài khoản</Text>
      </View>

      <View style={style.inputContainer}>
        <Icon name="user" size={20} color="#ccc" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Tên"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={style.inputContainer}>
        <Icon name="envelope" size={20} color="#ccc" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={style.inputContainer}>
        <Icon name="lock" size={20} color="#ccc" style={style.inputIcon} />
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
          <Icon name={showPassword ? "eye" : "eye-slash"} size={18} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={style.inputContainer}>
        <Icon name="lock" size={20} color="#ccc" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword} 
        />
        <TouchableOpacity
          style={style.showPasswordButton}
          onPress={() => setShowConfirmPassword(prevState => !prevState)} 
        >
          <Icon name={showConfirmPassword ? "eye" : "eye-slash"} size={18} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={style.inputContainer}>
        <Icon name="phone" size={20} color="#ccc" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={style.inputContainer}>
        <Icon name="home" size={20} color="#ccc" style={style.inputIcon} />
        <TextInput
          style={style.input}
          placeholder="Địa chỉ"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {error ? <Text style={style.errorText}>{error}</Text> : null}

      <TouchableOpacity style={style.button} onPress={handleRegister}>
        <Text style={style.buttonText}>Đăng ký</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={style.registerText}>Đã có tài khoản? Đăng nhập ngay</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
    padding: 15,
    backgroundColor: '#111111',
    borderRadius: 10,
    alignItems: 'center',
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
    color: 'red',
    marginBottom: 10,
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});
